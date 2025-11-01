"""
Test script for BigQuery Analytics
Run this to verify everything is working correctly
"""

import os
import sys
from datetime import datetime
import requests

# Configuration
API_BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
TEST_ARTISAN_ID = os.getenv("TEST_ARTISAN_ID", "test_artisan_123")

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_result(test_name, passed, message=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {test_name}")
    if message:
        print(f"     └─ {message}")

def test_backend_health():
    """Test if backend is running"""
    print_header("Backend Health Check")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        data = response.json()
        
        passed = response.status_code == 200 and data.get("status") == "healthy"
        print_result("Backend Health", passed, 
                    f"Status: {data.get('status')}, BigQuery: {data.get('bigquery_enabled')}")
        return passed
    except Exception as e:
        print_result("Backend Health", False, str(e))
        return False

def test_bigquery_connection():
    """Test BigQuery connection"""
    print_header("BigQuery Connection Test")
    
    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
        
        credentials = service_account.Credentials.from_service_account_file(
            os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        )
        project_id = os.environ.get("GCLOUD_PROJECT")
        client = bigquery.Client(credentials=credentials, project=project_id)
        
        # Try to list datasets
        datasets = list(client.list_datasets())
        
        passed = len(datasets) > 0
        print_result("BigQuery Connection", passed, 
                    f"Found {len(datasets)} dataset(s)")
        
        # Check for our analytics dataset
        analytics_exists = any(ds.dataset_id == "artisan_analytics" for ds in datasets)
        print_result("Analytics Dataset", analytics_exists,
                    "artisan_analytics dataset found" if analytics_exists else "Dataset not found")
        
        return passed and analytics_exists
    except Exception as e:
        print_result("BigQuery Connection", False, str(e))
        return False

def test_tables_exist():
    """Test if required tables exist"""
    print_header("BigQuery Tables Check")
    
    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
        
        credentials = service_account.Credentials.from_service_account_file(
            os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        )
        project_id = os.environ.get("GCLOUD_PROJECT")
        client = bigquery.Client(credentials=credentials, project=project_id)
        
        required_tables = [
            "products",
            "user_interactions",
            "user_demographics",
            "engagement_metrics"
        ]
        
        dataset_ref = client.dataset("artisan_analytics")
        tables = list(client.list_tables(dataset_ref))
        table_ids = [table.table_id for table in tables]
        
        all_exist = True
        for table_name in required_tables:
            exists = table_name in table_ids
            print_result(f"Table: {table_name}", exists)
            all_exist = all_exist and exists
        
        return all_exist
    except Exception as e:
        print_result("Tables Check", False, str(e))
        return False

def test_analytics_endpoints():
    """Test analytics API endpoints"""
    print_header("Analytics API Endpoints Test")
    
    endpoints = [
        f"/api/analytics/insights/{TEST_ARTISAN_ID}",
        f"/api/analytics/audience/{TEST_ARTISAN_ID}",
        f"/api/analytics/timing/{TEST_ARTISAN_ID}",
        f"/api/analytics/price-performance/{TEST_ARTISAN_ID}",
        f"/api/analytics/key-insights/{TEST_ARTISAN_ID}",
        f"/api/analytics/channels/{TEST_ARTISAN_ID}",
    ]
    
    all_passed = True
    for endpoint in endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
            passed = response.status_code == 200
            
            endpoint_name = endpoint.split('/')[-2]
            print_result(endpoint_name, passed, 
                        f"Status: {response.status_code}")
            all_passed = all_passed and passed
        except Exception as e:
            print_result(endpoint.split('/')[-2], False, str(e))
            all_passed = False
    
    return all_passed

def test_data_sync():
    """Test data sync from Firebase to BigQuery"""
    print_header("Data Sync Test")
    
    try:
        from services.firebase_to_bigquery import sync_products, generate_sample_interactions
        
        # Test product sync
        print("Testing product sync...")
        sync_products()
        print_result("Product Sync", True)
        
        # Test sample data generation
        print("\nTesting sample interaction generation...")
        generate_sample_interactions(TEST_ARTISAN_ID, num_interactions=10)
        print_result("Sample Interactions", True)
        
        return True
    except Exception as e:
        print_result("Data Sync", False, str(e))
        return False

def test_query_performance():
    """Test query performance"""
    print_header("Query Performance Test")
    
    import time
    
    endpoint = f"/api/analytics/insights/{TEST_ARTISAN_ID}"
    
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE}{endpoint}", timeout=30)
        end_time = time.time()
        
        duration = end_time - start_time
        passed = response.status_code == 200 and duration < 5.0
        
        print_result("Query Speed", passed, 
                    f"Duration: {duration:.2f}s {'(Good)' if duration < 2 else '(Acceptable)' if duration < 5 else '(Slow)'}")
        
        return passed
    except Exception as e:
        print_result("Query Performance", False, str(e))
        return False

def test_frontend_integration():
    """Test if frontend can connect to backend"""
    print_header("Frontend Integration Test")
    
    print("⚠️  Manual test required:")
    print("1. Start frontend: npm start")
    print("2. Navigate to artisan dashboard")
    print("3. Check if insights load correctly")
    print("4. Click 'Refresh' button")
    print("5. Verify data updates")
    
    return True

def run_all_tests():
    """Run all tests"""
    print("\n" + "🚀 " + "="*58)
    print("   BigQuery Analytics Test Suite")
    print("   " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    results = {
        "Backend Health": test_backend_health(),
        "BigQuery Connection": test_bigquery_connection(),
        "Tables Exist": test_tables_exist(),
        "API Endpoints": test_analytics_endpoints(),
        "Query Performance": test_query_performance(),
    }
    
    # Optional: Only run sync test if explicitly requested
    if "--sync" in sys.argv:
        results["Data Sync"] = test_data_sync()
    
    # Summary
    print_header("Test Summary")
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is ready.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    
    # Frontend integration reminder
    test_frontend_integration()
    
    sys.exit(exit_code)