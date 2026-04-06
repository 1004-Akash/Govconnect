import nltk
from textblob import download_corpora
import numpy as np
from sklearn.feature_extraction.text import HashingVectorizer
from math import radians, cos, sin, asin, sqrt
import pickle
from CivicPulse.gsheet_utils import log_to_gsheet_dict

# Download required corpora for nltk and textblob
try:
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
    print("NLTK data loaded successfully.")
except Exception as e:
    print(f"Skipping NLTK downloads due to: {e}")

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from api.admin import router as admin_router
from api.chatbot import router as chatbot_router
from api.news import router as news_router
from api.reactions import router as reactions_router
from db import init_db
from fetch_news import fetch_news
from reactions import add_reaction
from admin_report import generate_admin_report
from mongo import ensure_indexes
from ml_sentiment import preload_model
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId

# MongoDB setup
from mongo import get_client, get_db
try:
    client = get_client()
    db = get_db()
    reports_col = db["reports"]
    clusters_col = db["clusters"]
    assignments_col = db["assignments"]
    print("MongoDB connection established.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # Define dummy collections to prevent startup crash
    reports_col = None
    clusters_col = None
    assignments_col = None

civicpulse_router = APIRouter()

class ReportIn(BaseModel):
    text: str
    lat: float
    lon: float
    media_uri: Optional[str] = None
    severity_tag: Optional[float] = Field(0.5, ge=0.0, le=1.0)
    user_identifier: Optional[str] = None
    device_identifier: Optional[str] = None
    ip_address: Optional[str] = None

class ReportOut(BaseModel):
    id: str
    cluster_id: Optional[str]
    created_at: datetime

# Load ML model for hotspot prediction
try:
    with open('hotspot_model.pkl', 'rb') as f:
        hotspot_model, hotspot_features = pickle.load(f)
except Exception:
    hotspot_model, hotspot_features = None, []

def ml_predict_hotspot(lat, lon, category, severity, infra_age=0, rainfall=0):
    if not hotspot_model:
        return 0.0
    # Build feature vector in correct order
    features = []
    for col in hotspot_features:
        if col == 'lat': features.append(lat)
        elif col == 'lon': features.append(lon)
        elif col == 'severity': features.append(severity)
        elif col == 'infra_age': features.append(infra_age)
        elif col == 'rainfall': features.append(rainfall)
        elif col.startswith('category_'): features.append(1 if category == col.split('_',1)[1] else 0)
        else: features.append(0)
    import numpy as np
    X = np.array([features])
    prob = hotspot_model.predict_proba(X)[0][1]
    return prob

# User endpoint: submit report
@civicpulse_router.post("/reports", response_model=ReportOut)
async def submit_report(
    text: str = Form(...),
    lat: float = Form(...),
    lon: float = Form(...),
    severity_tag: float = Form(...),
    user_identifier: str = Form(None),
    device_identifier: str = Form(None),
    ip_address: str = Form(None),
    image: UploadFile = File(None),
    category: str = Form('General'),
    infra_age: float = Form(0),
    rainfall: float = Form(0)
):
    try:
        print(f"Submitting report: {text[:50]}... at ({lat}, {lon})")
        
        image_url = ""
        if image:
            # ... Google Drive upload logic if needed ...
            pass
        
        # --- Set default values for infra_age and rainfall if not provided or zero ---
        default_infra_age = 10  # years
        default_rainfall = 800  # mm/year
        if not infra_age or infra_age == 0:
            infra_age = default_infra_age
        if not rainfall or rainfall == 0:
            rainfall = default_rainfall
        # -------------------------------------------------------------
        
        # ML prediction
        prob = ml_predict_hotspot(lat, lon, category, severity_tag, infra_age, rainfall)
        print(f"ML prediction: {prob}")
        
        report = {
            "text": text.strip(),
            "lat": lat,
            "lon": lon,
            "media_uri": image_url,
            "severity_tag": severity_tag,
            "user_hash": user_identifier,
            "device_hash": device_identifier,
            "ip_hash": ip_address,
            "created_at": datetime.utcnow(),
            "cluster_id": None,
            "validations": 0,
            "category": category,
            "infra_age": infra_age,
            "rainfall": rainfall,
            "hotspot_prob": prob
        }
        
        result = reports_col.insert_one(report)
        print(f"Report inserted with ID: {result.inserted_id}")
        
        # Log to gsheet_logs for ML retraining
        try:
            log_to_gsheet_dict({
                "lat": lat,
                "lon": lon,
                "category": category,
                "severity": severity_tag,
                "infra_age": infra_age,
                "rainfall": rainfall,
                "is_hotspot": 1 if prob > 0.5 else 0
            })
        except Exception as e:
            print(f"GSheet logging failed: {e}")
        
        # AUTO-CLUSTER: Trigger clustering after adding new report
        try:
            print("Starting auto-clustering...")
            await recompute_clusters()
            print(f"Auto-clustering completed for new report: {result.inserted_id}")
        except Exception as e:
            print(f"Auto-clustering failed: {e}")
            import traceback
            traceback.print_exc()
        
        return ReportOut(id=str(result.inserted_id), cluster_id=None, created_at=report["created_at"])
        
    except Exception as e:
        print(f"Error submitting report: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoint: list clusters
@civicpulse_router.get("/clusters")
async def list_clusters():
    try:
        print("=== CLUSTERS ENDPOINT CALLED ===")
        
        # Check if collections exist
        print(f"Reports collection: {reports_col.name}")
        print(f"Clusters collection: {clusters_col.name}")
        
        # Count documents
        report_count = reports_col.count_documents({})
        cluster_count = clusters_col.count_documents({})
        print(f"Database has {report_count} reports and {cluster_count} clusters")
        
        # Get all clusters
        clusters = list(clusters_col.find())
        print(f"Retrieved {len(clusters)} clusters from database")
        
        if len(clusters) == 0:
            print("No clusters found, returning empty array")
            return []
        
        # Process clusters for JSON serialization
        processed_clusters = []
        for i, c in enumerate(clusters):
            print(f"Processing cluster {i+1}: {c}")
            
            try:
                # Handle ObjectId conversion
                cluster_id = str(c["_id"]) if "_id" in c else f"cluster_{i}"
                
                # Handle datetime conversion
                created_at = ""
                if "created_at" in c and c["created_at"]:
                    if hasattr(c["created_at"], 'isoformat'):
                        created_at = c["created_at"].isoformat()
                    else:
                        created_at = str(c["created_at"])
                
                updated_at = ""
                if "updated_at" in c and c["updated_at"]:
                    if hasattr(c["updated_at"], 'isoformat'):
                        updated_at = c["updated_at"].isoformat()
                    else:
                        updated_at = str(c["updated_at"])
                
                processed_cluster = {
                    "id": cluster_id,
                    "centroid_lat": float(c.get("centroid_lat", 0)),
                    "centroid_lon": float(c.get("centroid_lon", 0)),
                    "report_ids": [str(rid) for rid in c.get("report_ids", [])],
                    "label": c.get("label", "auto"),
                    "created_at": created_at,
                    "updated_at": updated_at
                }
                
                print(f"Processed cluster {i+1}: {processed_cluster}")
                processed_clusters.append(processed_cluster)
                
            except Exception as cluster_error:
                print(f"Error processing cluster {i+1}: {cluster_error}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"Successfully processed {len(processed_clusters)} clusters")
        print(f"Returning: {processed_clusters}")
        
        return processed_clusters
        
    except Exception as e:
        print(f"=== ERROR IN CLUSTERS ENDPOINT ===")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching clusters: {str(e)}")

# Admin endpoint: assign cluster (example)
@civicpulse_router.post("/clusters/{cluster_id}/assign")
async def assign_cluster(cluster_id: str, department: str, assignee: str, sla_hours: int = 72):
    sla_due = datetime.utcnow() + timedelta(hours=sla_hours)
    assignment = {
        "cluster_id": cluster_id,
        "department": department,
        "assignee": assignee,
        "sla_due_at": sla_due,
        "status": "assigned",
        "created_at": datetime.utcnow(),
    }
    result = assignments_col.insert_one(assignment)
    return {"ok": True, "assignment_id": str(result.inserted_id), "sla_due_at": sla_due}

# Add more endpoints as needed for validations, reclustering, etc.

# --- Clustering Utilities ---
def haversine(lat1, lon1, lat2, lon2):
    # Calculate the great circle distance between two points on the earth (specified in decimal degrees)
    # Returns distance in meters
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Radius of earth in meters
    return c * r

vectorizer = HashingVectorizer(n_features=128, alternate_sign=False)

SIM_THRESHOLD = 0.55
RADIUS_M = 300.0

# --- Clustering Logic ---
def embed(text):
    v = vectorizer.transform([text]).toarray()[0]
    n = np.linalg.norm(v) + 1e-9
    return v / n

def cos_sim(a, b):
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-9
    return float(np.dot(a, b) / denom)

async def recompute_clusters():
    try:
        print("Starting cluster recomputation...")
        reports = list(reports_col.find())
        print(f"Found {len(reports)} reports to cluster")
        
        if len(reports) == 0:
            print("No reports found, skipping clustering")
            return
        
        clusters_col.delete_many({})
        print("Deleted existing clusters")
        
        clusters = []
        embeds = [embed(r["text"]) for r in reports]
        print(f"Generated {len(embeds)} embeddings")
        
        for i, r in enumerate(reports):
            assigned = False
            for c in clusters:
                c_emb = embed(" ".join(c["texts"]))
                sim = cos_sim(embeds[i], c_emb)
                c_lat = np.mean(c["lats"]) if c["lats"] else r["lat"]
                c_lon = np.mean(c["lons"]) if c["lons"] else r["lon"]
                dist = haversine(r["lat"], r["lon"], c_lat, c_lon)
                if sim >= SIM_THRESHOLD and dist <= RADIUS_M:
                    c["ids"].append(r["_id"])
                    c["lats"].append(r["lat"])
                    c["lons"].append(r["lon"])
                    c["texts"].append(r["text"])
                    assigned = True
                    break
            if not assigned:
                clusters.append({
                    "ids": [r["_id"]],
                    "lats": [r["lat"]],
                    "lons": [r["lon"]],
                    "texts": [r["text"]],
                })
        
        print(f"Created {len(clusters)} clusters")
        
        # Save clusters and update reports
        for idx, c in enumerate(clusters):
            centroid_lat = float(np.mean(c["lats"]))
            centroid_lon = float(np.mean(c["lons"]))
            cluster_doc = {
                "label": "auto",
                "centroid_lat": centroid_lat,
                "centroid_lon": centroid_lon,
                "bbox_n": max(c["lats"]),
                "bbox_s": min(c["lats"]),
                "bbox_e": max(c["lons"]),
                "bbox_w": min(c["lons"]),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "report_ids": c["ids"],
            }
            cluster_id = clusters_col.insert_one(cluster_doc).inserted_id
            print(f"Inserted cluster {idx+1} with {len(c['ids'])} reports")
            for rid in c["ids"]:
                reports_col.update_one({"_id": rid}, {"$set": {"cluster_id": str(cluster_id)}})
        
        print(f"Clustering completed successfully. Total clusters: {len(clusters)}")
        
    except Exception as e:
        print(f"Error during clustering: {e}")
        import traceback
        traceback.print_exc()
        raise e

# --- Reclustering Endpoint (admin only) ---
@civicpulse_router.post("/recluster")
async def recluster():
    await recompute_clusters()
    return {"ok": True}

app = FastAPI(title="Government RAG Chatbot Backend")

# Mount GovMatch sub-app from external path
try:
    import sys
    # Get the parent directory of GoveConnectAI
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    EXTERNAL_GOVMATCH_PARENT = os.path.join(project_root, "govmatch")
    
    if EXTERNAL_GOVMATCH_PARENT not in sys.path:
        sys.path.insert(0, EXTERNAL_GOVMATCH_PARENT)
    
    from app.main import app as govmatch_app
    app.mount("/govmatch", govmatch_app)
    print(f"[govmatch] Mounted external app at /govmatch from {EXTERNAL_GOVMATCH_PARENT}")
except Exception as _e:
    print(f"[govmatch] Skipped mounting external app: {_e}")

# Ensure DB tables are created and news is fetched on app startup
init_db()
fetch_news()
ensure_indexes()
preload_model()

# CORS setup (allow all for now, restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router, prefix="/admin")
app.include_router(chatbot_router, prefix="/chatbot")
app.include_router(news_router, prefix="/api")
app.include_router(reactions_router, prefix="/api")
app.include_router(civicpulse_router, prefix="/civicpulse")

# Add GovMatch endpoints
@app.post("/govmatch/check")
async def check_eligibility(request: dict):
    """Check user eligibility against government schemes"""
    try:
        if "profile" not in request:
            raise HTTPException(status_code=400, detail="Missing 'profile' in request body")
        
        profile_data = request["profile"]
        
        # Simple eligibility logic
        eligible_schemes = []
        near_misses = []
        
        # Check age
        age = profile_data.get('age')
        if age and int(age) >= 18:
            eligible_schemes.append({
                "scheme_id": "pm_kisan",
                "scheme_name": "Pradhan Mantri Kisan Samman Nidhi",
                "eligible": True,
                "reasons": ["Age requirement met (18+)"],
                "required_documents": ["Aadhaar", "Land records"],
                "next_steps": "Visit nearest bank branch",
                "website_url": "https://pmkisan.gov.in/",
                "pdf_download_url": "/govmatch/download-pdf/pm_kisan"
            })
        else:
            near_misses.append({
                "scheme_id": "pm_kisan",
                "failed_conditions": ["Age below 18 years"]
            })
        
        # Check student status
        if profile_data.get('is_student'):
            eligible_schemes.append({
                "scheme_id": "scholarship",
                "scheme_name": "Central Scholarship Scheme",
                "eligible": True,
                "reasons": ["Student status confirmed"],
                "required_documents": ["Student ID", "Income certificate"],
                "next_steps": "Apply online through National Scholarship Portal",
                "website_url": "https://scholarships.gov.in/",
                "pdf_download_url": "/govmatch/download-pdf/scholarship"
            })
        
        return {
            "eligible_schemes": eligible_schemes,
            "near_misses": near_misses
        }
        
    except Exception as e:
        print(f"Error checking eligibility: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/govmatch/download-pdf/{scheme_id}")
async def download_scheme_pdf(scheme_id: str):
    """Download PDF for a specific scheme"""
    try:
        from fastapi.responses import RedirectResponse
        
        # Redirect to official websites
        if scheme_id == "pm_kisan":
            return RedirectResponse(url="https://pmkisan.gov.in/Documents/PM-KISAN-Scheme-Guidelines.pdf")
        elif scheme_id == "scholarship":
            return RedirectResponse(url="https://scholarships.gov.in/")
        else:
            raise HTTPException(status_code=404, detail="Scheme not found")
            
    except Exception as e:
        print(f"Error downloading PDF for scheme {scheme_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Dashboard data endpoint
@app.get("/dashboard-data")
async def get_dashboard_data():
    try:
        # Get recent reports
        reports = list(reports_col.find().sort("created_at", -1).limit(50))
        print(f"Found {len(reports)} reports in dashboard data")
        
        # Process reports for dashboard
        processed_reports = []
        issue_breakdown = {}
        priority_breakdown = {}
        department_breakdown = {}
        
        for report in reports:
            print(f"Processing report: text='{report.get('text', '')[:30]}...', lat={report.get('lat')}, lon={report.get('lon')}")
            
            # Convert ObjectId to string for JSON serialization
            report["_id"] = str(report["_id"])
            
            # Convert datetime to string for JSON serialization
            if "created_at" in report:
                report["created_at"] = report["created_at"].isoformat()
            
            # Calculate priority based on hotspot probability and severity
            hotspot_prob = report.get('hotspot_prob', 0)
            severity = report.get('severity_tag', 0.5)
            
            # Priority calculation: HIGH if hotspot_prob > 0.6 OR severity > 0.7
            if hotspot_prob > 0.6 or severity > 0.7:
                priority = "HIGH"
            elif hotspot_prob > 0.4 or severity > 0.5:
                priority = "MEDIUM"
            else:
                priority = "NORMAL"
            
            # Department mapping based on category
            category = report.get('category', 'General')
            department_map = {
                'Water Issue': 'Public Works',
                'Road Issue': 'Transport',
                'Sanitation': 'Public Health',
                'Security': 'Police',
                'General': 'General'
            }
            department = department_map.get(category, 'General')
            
            # Rapport Score calculation (combination of severity and hotspot probability)
            rapport_score = (severity * 0.6) + (hotspot_prob * 0.4)
            
            # Enhanced prediction text
            prediction_text = f"Hotspot Probability: {hotspot_prob:.2f}, Severity: {severity:.2f}"
            if hotspot_prob > 0.6:
                prediction_text += " - HIGH RISK AREA"
            elif hotspot_prob > 0.4:
                prediction_text += " - MODERATE RISK"
            else:
                prediction_text += " - LOW RISK"
            
            processed_report = {
                "report": report.get("text", ""),
                "confidence": severity,  # Using severity as confidence
                "lat": report.get("lat"),
                "lon": report.get("lon"),
                "prediction": prediction_text,
                "category": category,
                "department": department,
                "rapport_score": rapport_score,
                "priority": priority,
                "hotspot_prob": hotspot_prob,
                "severity": severity
            }
            
            print(f"Processed report: {processed_report}")
            processed_reports.append(processed_report)
            
            # Count by category
            issue_breakdown[category] = issue_breakdown.get(category, 0) + 1
            
            # Count by priority
            priority_breakdown[priority] = priority_breakdown.get(priority, 0) + 1
            
            # Count by department
            department_breakdown[department] = department_breakdown.get(department, 0) + 1
        
        print(f"Dashboard data: {len(processed_reports)} processed reports")
        
        return {
            "reports": processed_reports,
            "issueBreakdown": issue_breakdown,
            "priorityBreakdown": priority_breakdown,
            "departmentBreakdown": department_breakdown,
            "totalReports": len(processed_reports)
        }
        
    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        import traceback
        traceback.print_exc()
        return {
            "reports": [],
            "issueBreakdown": {},
            "priorityBreakdown": {},
            "departmentBreakdown": {},
            "totalReports": 0
        }

# API to report a concern
class Concern(BaseModel):
    text: str
    lat: float
    lon: float

@app.post("/api/report")
async def report_concern(concern: Concern):
    try:
        if reports_col is None:
             raise Exception("Database connection not established")
             
        # Create report document
        report_doc = {
            "text": concern.text,
            "lat": concern.lat,
            "lon": concern.lon,
            "created_at": datetime.now(),
            "category": "General", # Simple category for manual entry
            "hotspot_prob": 0.5, # Default values
            "severity_tag": 0.5
        }
        
        # Simple severity scoring based on keywords
        keywords = {
            "urgent": 0.8,
            "emergency": 0.9,
            "broken": 0.7,
            "danger": 0.85,
            "water": 0.6,
            "traffic": 0.4
        }
        
        for k, v in keywords.items():
            if k in concern.text.lower():
                report_doc["severity_tag"] = max(report_doc["severity_tag"], v)
        
        # Insert into MongoDB
        result = reports_col.insert_one(report_doc)
        
        return {
            "status": "success",
            "report_id": str(result.inserted_id),
            "severity": report_doc["severity_tag"]
        }
    except Exception as e:
        print(f"Error saving report: {e}")
        return {"status": "error", "message": str(e)}

# Test endpoint to check MongoDB and data
@app.get("/debug-data")
async def debug_data():
    try:
        # Check MongoDB connection
        client.admin.command('ping')
        print("MongoDB connection: OK")
        
        # Count reports
        report_count = reports_col.count_documents({})
        print(f"Total reports in database: {report_count}")
        
        # Count clusters
        cluster_count = clusters_col.count_documents({})
        print(f"Total clusters in database: {cluster_count}")
        
        # Get sample reports
        sample_reports = list(reports_col.find().limit(3))
        print(f"Sample reports: {[r.get('text', '')[:50] for r in sample_reports]}")
        
        return {
            "mongodb_status": "connected",
            "report_count": report_count,
            "cluster_count": cluster_count,
            "sample_reports": [r.get('text', '')[:100] for r in sample_reports]
        }
        
    except Exception as e:
        print(f"Debug data error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# Temporary test endpoint
@app.get("/ping")
async def ping():
    return {"message": "pong", "endpoints": ["/", "/dashboard-data", "/debug-data", "/civicpulse/clusters"]}

@app.get("/")
def root():
    return {"message": "Government RAG Chatbot Backend is running."}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        client.admin.command('ping')
        return {
            "status": "healthy", 
            "service": "govconnect-backend",
            "mongodb": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "govconnect-backend", 
            "mongodb": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Test endpoint in CivicPulse router
@civicpulse_router.get("/ping")
async def test_civicpulse():
    return {"message": "CivicPulse router working", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    # Example usage:
    # add_reaction(news_id=1, user_id="user123", reaction_type="like")
    # add_reaction(news_id=1, user_id="user123", reaction_type="comment", comment_text="Great initiative!")
    generate_admin_report()
