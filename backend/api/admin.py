from fastapi import APIRouter, UploadFile, File, Form
from models.schemas import DocumentIn, FetchIn
from services.chunker import chunk_text
from services.embedder import embed_text
from services.vector_db import store_embedding
from services.pdf_utils import json_to_pdf
from services.data_gov_in import fetch_resource_json
import json
import io
from pdfminer.high_level import extract_text
from qdrant_client.http import models as qmodels
from services.vector_db import qdrant_client, COLLECTION_NAME

router = APIRouter()

def _extract_tabular(json_data):
    # Shape A: {"records":[{...},{...}]}
    if isinstance(json_data, dict) and isinstance(json_data.get("records"), list):
        records = json_data["records"]
        cols = list(records[0].keys()) if records else []
        names = {c: c for c in cols}
        return records, cols, names

    # Shape B: {"fields":[{id,label,...}], "data":[[...], ...]}
    if isinstance(json_data, dict) and isinstance(json_data.get("fields"), list) and isinstance(json_data.get("data"), list):
        ids = [f.get("id") for f in json_data["fields"]]
        labels = [f.get("label") or f.get("id") for f in json_data["fields"]]
        records = [dict(zip(ids, row)) for row in json_data["data"]]
        names = dict(zip(ids, labels))
        return records, ids, names

    return [], [], {}

def _row_to_text(row, cols, names):
    # Stable, LLM-friendly row serialization
    return "; ".join(f"{names.get(c, c)}: {row.get(c, '')}" for c in cols)

@router.post("/documents/")
def post_document(document: DocumentIn):
    # Chunk the document content
    chunks = chunk_text(document.content)
    chunk_count = 0
    for idx, chunk in enumerate(chunks):
        embedding = embed_text(chunk)
        metadata = {
            "title": document.title,
            "reference_id": document.reference_id,
            "chunk_index": idx,
            "text": chunk
        }
        store_embedding(embedding, metadata)
        chunk_count += 1
    return {"message": "Document uploaded and processed.", "chunks": chunk_count}

@router.post("/documents/json/")
def post_json_document(title: str, reference_id: str = None, json_file: UploadFile = File(...)):
    # Read and parse JSON
    json_data = json.load(json_file.file)
    # Convert JSON to PDF
    pdf_path = json_to_pdf(json_data, title=title)
    # Extract text from PDF
    pdf_text = extract_text(pdf_path)
    # Chunk, embed, and store
    chunks = chunk_text(pdf_text)
    chunk_count = 0
    for idx, chunk in enumerate(chunks):
        embedding = embed_text(chunk)
        metadata = {
            "title": title,
            "reference_id": reference_id,
            "chunk_index": idx,
            "text": chunk
        }
        store_embedding(embedding, metadata)
        chunk_count += 1
    return {"message": "JSON document processed and stored.", "chunks": chunk_count}

@router.post("/documents/pdf/")
def ingest_pdf(title: str = Form(...), reference_id: str = Form(None), pdf_file: UploadFile = File(...)):
    # 1) Extract text from uploaded PDF
    pdf_bytes = pdf_file.file.read()
    pdf_text = extract_text(io.BytesIO(pdf_bytes))

    # 2) Chunk → Embed → Store
    chunks = chunk_text(pdf_text)
    chunk_count = 0
    chunks_preview = []
    for idx, chunk in enumerate(chunks):
        embedding = embed_text(chunk)
        metadata = {
            "title": title,
            "reference_id": reference_id,
            "chunk_index": idx,
            "text": chunk
        }
        store_embedding(embedding, metadata)
        chunk_count += 1
        if idx < 5:
            chunks_preview.append({"index": idx, "text": chunk[:800]})

    return {
        "message": "PDF uploaded, chunked, embedded, and stored.",
        "chunks": chunk_count,
        "chunks_preview": chunks_preview
    }

@router.post("/documents/fetch/")
def fetch_and_store_document(body: FetchIn, include_full_json: bool = False):
    # 1) Fetch JSON from data.gov.in
    json_data = fetch_resource_json(body.reference_id)

    # 2) Prefer tabular ingestion if available
    records, cols, names = _extract_tabular(json_data)
    used_tabular = bool(records and cols)

    chunks_preview = []
    chunk_count = 0

    if used_tabular:
        # One clean chunk per row + rich metadata
        for idx, row in enumerate(records):
            row_text = _row_to_text(row, cols, names)
            embedding = embed_text(row_text)
            metadata = {
                "title": body.title,
                "reference_id": body.reference_id,
                "chunk_index": idx,
                "text": row_text,
                "row": row,
                "columns": cols
            }
            store_embedding(embedding, metadata)
            chunk_count += 1
            if idx < 5:
                chunks_preview.append({"index": idx, "text": row_text[:800]})
    else:
        # Fallback: Convert JSON -> PDF -> text -> chunk
        pdf_path = json_to_pdf(json_data, title=body.title)
        pdf_text = extract_text(pdf_path)
        for idx, chunk in enumerate(chunk_text(pdf_text)):
            embedding = embed_text(chunk)
            metadata = {
                "title": body.title,
                "reference_id": body.reference_id,
                "chunk_index": idx,
                "text": chunk
            }
            store_embedding(embedding, metadata)
            chunk_count += 1
            if idx < 5:
                chunks_preview.append({"index": idx, "text": chunk[:800]})

    # 3) Build previews for verification
    try:
        top_level_keys = list(json_data.keys()) if isinstance(json_data, dict) else []
    except Exception:
        top_level_keys = []
    try:
        json_compact_str = json.dumps(json_data)[:2000]
    except Exception:
        json_compact_str = str(json_data)[:2000]

    records_count = len(records) if used_tabular else 0
    sample_records = records[:3] if used_tabular else []

    resp = {
        "message": "Fetched, processed, and stored document from data.gov.in.",
        "ingest_mode": "tabular_rows" if used_tabular else "pdf_text",
        "chunks": chunk_count,
        "chunks_preview": chunks_preview,
        "fetched_json_preview": {
            "top_level_keys": top_level_keys,
            "records_count": records_count,
            "columns": cols if used_tabular else [],
            "sample_records": sample_records,
            "compact": json_compact_str
        }
    }
    if include_full_json:
        resp["fetched_json_full"] = json_data  # caution: large payloads

    return resp

@router.get("/documents/vector/status")
def vector_status(reference_id: str = None, limit: int = 5):
    if not qdrant_client:
        return {"ok": False, "message": "Qdrant client not initialized"}

    total = qdrant_client.count(collection_name=COLLECTION_NAME, exact=True).count

    filt = None
    if reference_id:
        filt = qmodels.Filter(
            must=[qmodels.FieldCondition(
                key="reference_id",
                match=qmodels.MatchValue(value=reference_id)
            )]
        )

    points, _ = qdrant_client.scroll(
        collection_name=COLLECTION_NAME,
        limit=limit,
        scroll_filter=filt
    )

    samples = []
    for p in points:
        samples.append({
            "id": str(p.id),
            "score": getattr(p, "score", None),
            "payload": p.payload
        })

    return {
        "ok": True,
        "collection": COLLECTION_NAME,
        "total_points": total,
        "filtered_by_reference_id": reference_id,
        "sample_points": samples
    }