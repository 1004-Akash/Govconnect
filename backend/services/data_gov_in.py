import os
import requests

DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY")


def fetch_resource_json(resource_id: str, limit: int = 100) -> dict:
    url = f"https://api.data.gov.in/resource/{resource_id}"
    params = {
        "api-key": DATA_GOV_API_KEY,
        "format": "json",
        "limit": limit
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()
