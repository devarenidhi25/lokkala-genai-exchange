import requests
import json

API_BASE = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{API_BASE}/api/best-time/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_analyze():
    """Test best time analysis"""
    print("\n=== Testing Best Time Analysis ===")
    
    payload = {
        "product_name": "Hand-painted Terracotta Pots",
        "category": "Home Decor",
        "keywords": ["terracotta", "handmade", "clay", "pots"],
        "hashtags": ["#terracotta", "#handmade", "#homedecor"]
    }
    
    response = requests.post(
        f"{API_BASE}/api/best-time/analyze",
        json=payload
    )
    
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_sample():
    """Test with sample data"""
    print("\n=== Testing Sample Analysis ===")
    response = requests.get(f"{API_BASE}/api/best-time/test")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    test_health()
    test_sample()
    test_analyze()