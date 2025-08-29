import base64
import logging
from app.routes.eligibility import router as eligibility_router
from app.routes.schemes import router as schemes_router
from app.routes.field_discovery import router as field_discovery_router
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from bson import ObjectId
import io

from app.database import connect_to_mongo, close_mongo_connection, get_database, get_gridfs_bucket
from app.models import UserProfile, CheckResponse, UploadSchemeRequest, UploadSchemeResponse, SchemeInfo
from app.services import SchemeService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    logger.info("Connected to MongoDB")
    yield
    # Shutdown
    await close_mongo_connection()
    logger.info("Disconnected from MongoDB")


app = FastAPI(
    title="GovMatch API",
    description="Backend service for government scheme eligibility matching",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "GovMatch API is running", "version": "1.0.0"}


@app.post("/govmatch/check", response_model=CheckResponse)
async def check_eligibility(request: dict):
    """Check user eligibility against all schemes"""
    try:
        # Validate profile data
        if "profile" not in request:
            raise HTTPException(status_code=400, detail="Missing 'profile' in request body")
        
        profile_data = request["profile"]
        profile = UserProfile(**profile_data)
        
        # Check eligibility
        eligible_schemes, near_misses = await SchemeService.check_eligibility(profile)
        
        return CheckResponse(
            eligible_schemes=eligible_schemes,
            near_misses=near_misses
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid profile data: {str(e)}")
    except Exception as e:
        logger.error(f"Error checking eligibility: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/govmatch/schemes", response_model=list[SchemeInfo])
async def get_schemes():
    """Get all schemes with metadata"""
    try:
        schemes = await SchemeService.get_all_schemes()
        return schemes
    except Exception as e:
        logger.error(f"Error fetching schemes: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/govmatch/upload_scheme", response_model=UploadSchemeResponse)
async def upload_scheme(request: UploadSchemeRequest):
    """Upload scheme PDF and extract rules (JSON body)"""
    try:
        if not request.pdf_base64:
            raise HTTPException(status_code=400, detail="Missing pdf_base64 in request")
        
        success, message = await SchemeService.upload_scheme_pdf(
            scheme_id=request.scheme_id,
            title=request.title,
            pdf_base64=request.pdf_base64
        )
        
        if not success:
            raise HTTPException(status_code=422, detail=message)
        
        return UploadSchemeResponse(
            scheme_id=request.scheme_id,
            rules_saved=success
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading scheme: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/govmatch/download-pdf/{scheme_id}")
async def download_scheme_pdf(scheme_id: str):
    """Download PDF file for a specific scheme"""
    try:
        db = get_database()
        gridfs = get_gridfs_bucket()
        
        # Find the scheme document
        scheme_doc = await db.schemes_rules.find_one({"scheme_id": scheme_id})
        if not scheme_doc:
            raise HTTPException(status_code=404, detail="Scheme not found")
        
        pdf_file_id = scheme_doc.get("pdf_file_id")
        if not pdf_file_id:
            raise HTTPException(status_code=404, detail="PDF file not found for this scheme")
        
        # Download PDF from GridFS
        try:
            pdf_stream = await gridfs.open_download_stream(ObjectId(pdf_file_id))
            pdf_bytes = await pdf_stream.read()
        except Exception as e:
            logger.error(f"Error downloading PDF for scheme {scheme_id}: {e}")
            raise HTTPException(status_code=404, detail="PDF file not accessible")
        
        # Validate PDF content
        if not pdf_bytes or len(pdf_bytes) < 100:
            raise HTTPException(status_code=404, detail="Invalid PDF file")
        
        # Create proper filename
        safe_filename = scheme_id.replace(" ", "_").replace("/", "_")
        
        # Create streaming response for browser download
        def generate_pdf():
            yield pdf_bytes
        
        return StreamingResponse(
            generate_pdf(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{safe_filename}.pdf\"",
                "Content-Length": str(len(pdf_bytes)),
                "Cache-Control": "no-cache"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading PDF for scheme {scheme_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/govmatch/upload_scheme_simple")
async def upload_scheme_simple(
    scheme_id: str,
    title: str,
    pdf_content: str
):
    """Simple PDF upload - accepts PDF content as string and converts to base64"""
    try:
        # If it's already base64, use it directly
        # If it's raw PDF content, encode it
        try:
            # Try to decode to see if it's already base64
            base64.b64decode(pdf_content)
            pdf_base64 = pdf_content
        except:
            # Not base64, so encode it
            pdf_base64 = base64.b64encode(pdf_content.encode()).decode('utf-8')
        
        success, message = await SchemeService.upload_scheme_pdf(
            scheme_id=scheme_id,
            title=title,
            pdf_base64=pdf_base64
        )
        
        if not success:
            raise HTTPException(status_code=422, detail=message)
        
        return UploadSchemeResponse(
            scheme_id=scheme_id,
            rules_saved=success
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading scheme: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/govmatch/upload_scheme_file")
async def upload_scheme_file(
    scheme_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload scheme PDF and extract rules (multipart form)"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Read file content
        pdf_bytes = await file.read()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        success, message = await SchemeService.upload_scheme_pdf(
            scheme_id=scheme_id,
            title=title,
            pdf_base64=pdf_base64
        )
        
        if not success:
            raise HTTPException(status_code=422, detail=message)
        
        return UploadSchemeResponse(
            scheme_id=scheme_id,
            rules_saved=success
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading scheme file: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/govmatch/rebuild_rules/{scheme_id}")
async def rebuild_rules(scheme_id: str, force: bool = True):
    """Force rebuild rules for a specific scheme"""
    try:
        success, message = await SchemeService.rebuild_rules(scheme_id)
        
        if not success:
            if "not found" in message.lower():
                raise HTTPException(status_code=404, detail=message)
            else:
                raise HTTPException(status_code=422, detail=message)
        
        return {"scheme_id": scheme_id, "message": message}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rebuilding rules for {scheme_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Include field discovery router
app.include_router(field_discovery_router, prefix="/govmatch", tags=["field-discovery"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "govmatch-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
