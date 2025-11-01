"""
BigQuery Setup Script - Run this FIRST
Creates datasets, tables, and initial schema for analytics
"""

from google.cloud import bigquery
from google.oauth2 import service_account
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Initialize BigQuery client
credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
project_id = os.environ.get("GCLOUD_PROJECT")

if not credentials_path:
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS not set in .env file")
if not project_id:
    raise ValueError("GCLOUD_PROJECT not set in .env file")

print(f"📁 Using credentials: {credentials_path}")
print(f"📌 Project ID: {project_id}\n")

credentials = service_account.Credentials.from_service_account_file(credentials_path)
client = bigquery.Client(credentials=credentials, project=project_id)

def create_datasets():
    """Create BigQuery datasets"""
    datasets = [
        {
            "id": "artisan_analytics",
            "location": "US",
            "description": "Main analytics dataset for artisan insights"
        },
        {
            "id": "artisan_ml",
            "location": "US", 
            "description": "Machine learning models and predictions"
        }
    ]
    
    for ds in datasets:
        dataset_id = f"{project_id}.{ds['id']}"
        dataset = bigquery.Dataset(dataset_id)
        dataset.location = ds["location"]
        dataset.description = ds["description"]
        
        try:
            dataset = client.create_dataset(dataset, timeout=30)
            print(f"✅ Created dataset {dataset_id}")
        except Exception as e:
            if "Already Exists" in str(e):
                print(f"⚠️ Dataset {dataset_id} already exists")
            else:
                print(f"❌ Error creating dataset {dataset_id}: {e}")

def create_tables():
    """Create BigQuery tables with schema"""
    
    # Products table
    products_schema = [
        bigquery.SchemaField("product_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("artisan_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("name", "STRING"),
        bigquery.SchemaField("price", "FLOAT64"),
        bigquery.SchemaField("description", "STRING"),
        bigquery.SchemaField("craft_type", "STRING"),
        bigquery.SchemaField("uploaded_at", "TIMESTAMP"),
        bigquery.SchemaField("images", "STRING", mode="REPEATED"),
    ]
    
    # User interactions table
    interactions_schema = [
        bigquery.SchemaField("interaction_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("user_id", "STRING"),
        bigquery.SchemaField("artisan_id", "STRING"),
        bigquery.SchemaField("product_id", "STRING"),
        bigquery.SchemaField("action_type", "STRING"),
        bigquery.SchemaField("timestamp", "TIMESTAMP"),
        bigquery.SchemaField("session_id", "STRING"),
        bigquery.SchemaField("device_type", "STRING"),
    ]
    
    # Demographics table
    demographics_schema = [
        bigquery.SchemaField("user_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("age_group", "STRING"),
        bigquery.SchemaField("gender", "STRING"),
        bigquery.SchemaField("location_city", "STRING"),
        bigquery.SchemaField("location_state", "STRING"),
        bigquery.SchemaField("interests", "STRING", mode="REPEATED"),
        bigquery.SchemaField("created_at", "TIMESTAMP"),
    ]
    
    tables = [
        ("products", products_schema),
        ("user_interactions", interactions_schema),
        ("user_demographics", demographics_schema),
    ]
    
    for table_name, schema in tables:
        table_id = f"{project_id}.artisan_analytics.{table_name}"
        table = bigquery.Table(table_id, schema=schema)
        
        try:
            table = client.create_table(table)
            print(f"✅ Created table {table_id}")
        except Exception as e:
            if "Already Exists" in str(e):
                print(f"⚠️ Table {table_id} already exists")
            else:
                print(f"❌ Error creating table {table_id}: {e}")

def main():
    """Run all setup steps"""
    print("🚀 Starting BigQuery setup...\n")
    
    print("📦 Creating datasets...")
    create_datasets()
    
    print("\n📊 Creating tables...")
    create_tables()
    
    print("\n✅ BigQuery setup complete!")
    print("\n📝 Next steps:")
    print("   1. Run: python services/generate_sample_data.py")
    print("   2. Restart your backend server")

if __name__ == "__main__":
    main()