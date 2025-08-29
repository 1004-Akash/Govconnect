# GovMatch Backend

A FastAPI-based backend service for government scheme eligibility matching. This service extracts eligibility rules from PDF documents using AI and evaluates user profiles against those rules.

## Features

- **PDF Processing**: Extract text from government scheme PDFs using PyMuPDF with pdfminer fallback
- **AI Rule Extraction**: Convert PDF text to structured eligibility rules using OpenRouter API
- **Rule Evaluation**: Evaluate user profiles against scheme eligibility criteria
- **MongoDB Storage**: Store PDFs in GridFS and cache extracted rules
- **Idempotent Processing**: Avoid duplicate AI calls using PDF hash-based caching

## Tech Stack

- **Framework**: FastAPI
- **Database**: MongoDB with Motor (async driver)
- **PDF Processing**: PyMuPDF, pdfminer.six
- **AI Integration**: OpenRouter API
- **Testing**: pytest

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=govconnect
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
RULES_MODEL=openrouter/auto
PDF_CACHE_TTL_HOURS=720
MAX_PDF_PAGES=200
```

### 3. Start MongoDB

Ensure MongoDB is running locally or update `MONGODB_URI` for remote instance.

### 4. Run the Application

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the built-in runner:

```bash
python app/main.py
```

## API Endpoints

### Check Eligibility
```bash
POST /govmatch/check
```

**Request:**
```json
{
  "profile": {
    "age": 21,
    "gender": "female",
    "occupation": "student",
    "is_student": true,
    "income": 50000,
    "caste": "OBC",
    "state": "KA"
  }
}
```

**Response:**
```json
{
  "eligible_schemes": [
    {
      "scheme_id": "pm_kisan",
      "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
      "eligible": true,
      "reasons": ["age >= 18 ✓", "income < 200000 ✓"],
      "required_documents": ["aadhaar", "land_record"],
      "next_steps": "Apply via official portal"
    }
  ],
  "near_misses": [
    {
      "scheme_id": "scholarship_x",
      "failed_conditions": ["income exceeds threshold"]
    }
  ]
}
```

### Get All Schemes
```bash
GET /govmatch/schemes
```

### Upload Scheme (JSON)
```bash
POST /govmatch/upload_scheme
```

**Request:**
```json
{
  "scheme_id": "pm_kisan",
  "title": "PM Kisan Scheme",
  "pdf_base64": "base64_encoded_pdf_content"
}
```

### Upload Scheme (File)
```bash
POST /govmatch/upload_scheme_file
```

**Form Data:**
- `scheme_id`: string
- `title`: string  
- `file`: PDF file

### Rebuild Rules
```bash
GET /govmatch/rebuild_rules/{scheme_id}?force=true
```

## Rules JSON Schema

The system converts PDF eligibility criteria into structured JSON:

```json
{
  "scheme_id": "pm_kisan",
  "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
  "eligibility": {
    "all": [
      {
        "attribute": "age",
        "op": ">=",
        "value": 18,
        "reason_if_fail": "Must be 18 or older"
      }
    ],
    "any": [
      {
        "attribute": "occupation",
        "op": "in",
        "value": ["farmer", "agricultural_worker"],
        "reason_if_fail": "Must be involved in agriculture"
      }
    ],
    "disqualifiers": [
      {
        "attribute": "income",
        "op": ">",
        "value": 200000,
        "reason": "Income exceeds maximum limit"
      }
    ]
  },
  "required_inputs": ["age", "gender", "occupation", "income", "state"],
  "required_documents": ["aadhaar", "land_record"],
  "benefit_outline": "₹6000 per year in 3 installments",
  "next_steps": "Apply through PM Kisan portal"
}
```

## Supported Operators

- `==`, `!=`: Equality/inequality
- `>`, `>=`, `<`, `<=`: Comparisons
- `truthy`, `falsy`: Boolean checks
- `in`, `not_in`: List membership
- `between`: Range check (requires `{"min": x, "max": y}`)

## Testing

Run the test suite:

```bash
pytest tests/ -v
```

Test specific modules:

```bash
pytest tests/test_rules_evaluator.py -v
pytest tests/test_endpoints.py -v
```

## MongoDB Collections

### `schemes.files` & `schemes.chunks` (GridFS)
Stores original PDF files with metadata.

### `schemes_rules`
Caches extracted eligibility rules:

```json
{
  "_id": "ObjectId",
  "scheme_id": "pm_kisan",
  "scheme_name": "PM Kisan Scheme",
  "pdf_file_id": "ObjectId",
  "pdf_sha256": "hash",
  "rules_json": { /* RulesJSON */ },
  "extracted_at": "2025-08-28T00:00:00Z",
  "model_id": "openrouter/auto",
  "status": "ready|error",
  "error_message": null
}
```

## Error Handling

- **400**: Invalid request payload
- **404**: Scheme not found (for rebuild endpoint)
- **422**: Invalid rules JSON from AI extraction
- **500**: Internal server errors

## Development

### Project Structure
```
govmatch-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── database.py          # MongoDB connection
│   ├── models.py            # Pydantic models
│   ├── pdf_extractor.py     # PDF text extraction
│   ├── openrouter_client.py # AI integration
│   ├── rules_evaluator.py   # Rule evaluation logic
│   └── services.py          # Business logic
├── tests/
│   ├── test_rules_evaluator.py
│   └── test_endpoints.py
├── requirements.txt
├── .env.example
└── README.md
```

### Adding New Operators

1. Add operator to `SUPPORTED_OPERATORS` in `RulesEvaluator`
2. Implement logic in `_evaluate_condition` method
3. Add validation in `validate_rules_json`
4. Write tests in `test_rules_evaluator.py`

## Production Deployment

1. Set appropriate CORS origins in `main.py`
2. Use production MongoDB instance
3. Configure proper logging levels
4. Set up monitoring and health checks
5. Use production ASGI server (gunicorn + uvicorn)

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## License

MIT License
