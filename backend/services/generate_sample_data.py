"""
Generate sample analytics data for testing
"""

from google.cloud import bigquery
from google.oauth2 import service_account
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random
import uuid
import os

# Load environment variables from .env file
load_dotenv()

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

def generate_sample_data(artisan_id: str):
    """Generate sample data for testing"""
    
    print(f"🎲 Generating sample data for artisan: {artisan_id}\n")
    
    # Sample demographics
    age_groups = ['18-24', '25-34', '35-44', '45-54', '55+']
    cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Ahmedabad', 'Kolkata']
    states = ['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'West Bengal']
    
    # Generate 50 sample users
    demographics = []
    user_ids = []
    
    print("👥 Creating sample users...")
    for i in range(50):
        user_id = f"sample_user_{i}_{uuid.uuid4().hex[:8]}"
        user_ids.append(user_id)
        
        demographics.append({
            "user_id": user_id,
            "age_group": random.choice(age_groups),
            "gender": random.choice(['Male', 'Female', 'Other']),
            "location_city": random.choice(cities),
            "location_state": random.choice(states),
            "interests": random.sample(['traditional', 'handmade', 'pottery', 'festive'], k=2),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
        })
    
    # Insert demographics
    print("💾 Inserting demographics...")
    table_id = f"{project_id}.artisan_analytics.user_demographics"
    errors = client.insert_rows_json(table_id, demographics)
    
    if errors:
        print(f"❌ Error inserting demographics: {errors}")
        return False
    else:
        print(f"✅ Inserted {len(demographics)} user demographics")
    
    # Generate 200 interactions
    print("\n📊 Creating sample interactions...")
    interactions = []
    action_types = ['view', 'click', 'inquiry', 'purchase']
    action_weights = [0.5, 0.3, 0.15, 0.05]
    
    base_time = datetime.now()
    
    for i in range(200):
        interactions.append({
            "interaction_id": str(uuid.uuid4()),
            "user_id": random.choice(user_ids),
            "artisan_id": artisan_id,
            "product_id": f"{artisan_id}_product_0",  # Your product
            "action_type": random.choices(action_types, weights=action_weights)[0],
            "timestamp": (base_time - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )).isoformat(),
            "session_id": str(uuid.uuid4()),
            "device_type": random.choice(['mobile', 'desktop', 'tablet']),
        })
    
    # Insert interactions
    print("💾 Inserting interactions...")
    table_id = f"{project_id}.artisan_analytics.user_interactions"
    errors = client.insert_rows_json(table_id, interactions)
    
    if errors:
        print(f"❌ Error inserting interactions: {errors}")
        return False
    else:
        print(f"✅ Inserted {len(interactions)} interactions")
    
    print("\n🎉 Sample data generation complete!")
    print(f"\n📈 Summary:")
    print(f"   - {len(demographics)} sample users created")
    print(f"   - {len(interactions)} interactions generated")
    print(f"   - Artisan ID: {artisan_id}")
    
    return True

if __name__ == "__main__":
    # Replace with your actual artisan ID
    ARTISAN_ID = "p69QjUV3HqeLZxmRDZvQTqRjm2G2"
    
    print("=" * 60)
    print("  Sample Data Generator for BigQuery Analytics")
    print("=" * 60 + "\n")
    
    success = generate_sample_data(ARTISAN_ID)
    
    if success:
        print("\n✅ All done! Next steps:")
        print("   1. Restart your backend: uvicorn main:app --reload")
        print("   2. Refresh your artisan dashboard")
        print("   3. You should now see analytics data!")
    else:
        print("\n❌ Something went wrong. Check the errors above.")