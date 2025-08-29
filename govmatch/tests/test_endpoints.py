import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.models import EligibleScheme, NearMiss, SchemeInfo
from datetime import datetime

client = TestClient(app)


class TestEndpoints:
    """Test cases for FastAPI endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["message"] == "GovMatch API is running"
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    @patch('app.services.SchemeService.check_eligibility')
    def test_check_eligibility_success(self, mock_check_eligibility):
        """Test successful eligibility check"""
        # Mock response
        eligible_schemes = [
            EligibleScheme(
                scheme_id="pm_kisan",
                scheme_name="PM Kisan",
                eligible=True,
                reasons=["age >= 18 ✓"],
                required_documents=["aadhaar"],
                next_steps="Apply online"
            )
        ]
        near_misses = []
        
        mock_check_eligibility.return_value = (eligible_schemes, near_misses)
        
        # Test request
        request_data = {
            "profile": {
                "age": 25,
                "gender": "male",
                "occupation": "farmer",
                "income": 50000,
                "state": "UP"
            }
        }
        
        response = client.post("/govmatch/check", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["eligible_schemes"]) == 1
        assert data["eligible_schemes"][0]["scheme_id"] == "pm_kisan"
        assert len(data["near_misses"]) == 0
    
    def test_check_eligibility_missing_profile(self):
        """Test eligibility check with missing profile"""
        response = client.post("/govmatch/check", json={})
        assert response.status_code == 400
        assert "Missing 'profile' in request body" in response.json()["detail"]
    
    def test_check_eligibility_invalid_profile(self):
        """Test eligibility check with invalid profile data"""
        request_data = {
            "profile": {
                "age": "invalid_age"  # Should be integer
            }
        }
        
        response = client.post("/govmatch/check", json=request_data)
        assert response.status_code == 400
        assert "Invalid profile data" in response.json()["detail"]
    
    @patch('app.services.SchemeService.get_all_schemes')
    def test_get_schemes(self, mock_get_schemes):
        """Test get all schemes endpoint"""
        # Mock response
        schemes = [
            SchemeInfo(
                scheme_id="pm_kisan",
                scheme_name="PM Kisan",
                last_updated=datetime.utcnow(),
                has_rules=True
            )
        ]
        
        mock_get_schemes.return_value = schemes
        
        response = client.get("/govmatch/schemes")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["scheme_id"] == "pm_kisan"
        assert data[0]["has_rules"] is True
    
    @patch('app.services.SchemeService.upload_scheme_pdf')
    def test_upload_scheme_success(self, mock_upload):
        """Test successful scheme upload"""
        mock_upload.return_value = (True, "Success")
        
        request_data = {
            "scheme_id": "test_scheme",
            "title": "Test Scheme",
            "pdf_base64": "dGVzdCBwZGYgY29udGVudA=="  # "test pdf content" in base64
        }
        
        response = client.post("/govmatch/upload_scheme", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["scheme_id"] == "test_scheme"
        assert data["rules_saved"] is True
    
    def test_upload_scheme_missing_pdf(self):
        """Test scheme upload with missing PDF"""
        request_data = {
            "scheme_id": "test_scheme",
            "title": "Test Scheme"
            # Missing pdf_base64
        }
        
        response = client.post("/govmatch/upload_scheme", json=request_data)
        assert response.status_code == 400
        assert "Missing pdf_base64" in response.json()["detail"]
    
    @patch('app.services.SchemeService.upload_scheme_pdf')
    def test_upload_scheme_processing_error(self, mock_upload):
        """Test scheme upload with processing error"""
        mock_upload.return_value = (False, "Failed to extract text")
        
        request_data = {
            "scheme_id": "test_scheme",
            "title": "Test Scheme",
            "pdf_base64": "dGVzdCBwZGYgY29udGVudA=="
        }
        
        response = client.post("/govmatch/upload_scheme", json=request_data)
        assert response.status_code == 422
        assert "Failed to extract text" in response.json()["detail"]
    
    @patch('app.services.SchemeService.rebuild_rules')
    def test_rebuild_rules_success(self, mock_rebuild):
        """Test successful rules rebuild"""
        mock_rebuild.return_value = (True, "Rules rebuilt successfully")
        
        response = client.get("/govmatch/rebuild_rules/test_scheme")
        assert response.status_code == 200
        
        data = response.json()
        assert data["scheme_id"] == "test_scheme"
        assert "successfully" in data["message"]
    
    @patch('app.services.SchemeService.rebuild_rules')
    def test_rebuild_rules_not_found(self, mock_rebuild):
        """Test rebuild rules for non-existent scheme"""
        mock_rebuild.return_value = (False, "Scheme not found")
        
        response = client.get("/govmatch/rebuild_rules/nonexistent")
        assert response.status_code == 404
        assert "Scheme not found" in response.json()["detail"]
