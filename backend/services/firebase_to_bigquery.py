"""
Firebase to BigQuery Data Sync
Syncs Firebase Firestore data to BigQuery for analytics
"""

from google.cloud import bigquery, firestore
from google.oauth2 import service_account
from datetime import datetime
import os
import uuid

credentials = service_account.Credentials.from_service_account_file(
    os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
)
project_id = os.environ.get("GCLOUD_PROJECT")

bq_client = bigquery.Client(credentials=credentials, project=project_id)
fs_client = firestore.Client(credentials=credentials, project=project_id)

def sync_products():
    """Sync products from Firestore to BigQuery"""
    print("🔄 Syncing products...")
    
    # Get all artisan users
    users_ref = fs_client.collection('users')
    artisans = users_ref.where('type', '==', 'artisan').stream()
    
    rows_to_insert = []
    
    for artisan in artisans:
        artisan_data = artisan.to_dict()
        artisan_id = artisan.id
        products = artisan_data.get('products', [])
        
        for idx, product in enumerate(products):
            product_id = f"{artisan_id}_{idx}_{uuid.uuid4().hex[:8]}"
            
            row = {
                "product_id": product_id,
                "artisan_id": artisan_id,
                "name": product.get('name', ''),
                "price": float(product.get('price', 0)),
                "description": product.get('description', ''),
                "craft_type": artisan_data.get('craftType', ''),
                "uploaded_at": product.get('uploadedAt', datetime.now().isoformat()),
                "images": product.get('images', []),
            }
            rows_to_insert.append(row)
    
    if rows_to_insert:
        table_id = f"{project_id}.artisan_analytics.products"
        errors = bq_client.insert_rows_json(table_id, rows_to_insert)
        
        if errors:
            print(f"❌ Errors inserting products: {errors}")
        else:
            print(f"✅ Synced {len(rows_to_insert)} products")
    else:
        print("⚠️ No products to sync")

def generate_sample_interactions(artisan_id: str, num_interactions: int = 100):
    """Generate sample interaction data for testing"""
    import random
    from datetime import timedelta
    
    print(f"🎲 Generating {num_interactions} sample interactions for artisan {artisan_id}...")
    
    action_types = ['view', 'click', 'inquiry', 'purchase']
    action_weights = [0.5, 0.3, 0.15, 0.05]
    
    age_groups = ['18-24', '25-34', '35-44', '45-54', '55+']
    cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Kolkata', 'Chennai']
    states = ['Maharashtra', 'Delhi', 'Karnataka', 'West Bengal', 'Tamil Nadu']
    
    interactions = []
    demographics = {}
    
    base_time = datetime.now()
    
    for i in range(num_interactions):
        user_id = f"user_{random.randint(1000, 9999)}"
        
        # Create demographic entry if new user
        if user_id not in demographics:
            demographics[user_id] = {
                "user_id": user_id,
                "age_group": random.choice(age_groups),
                "gender": random.choice(['Male', 'Female', 'Other']),
                "location_city": random.choice(cities),
                "location_state": random.choice(states),
                "interests": random.sample(['traditional', 'handmade', 'ethnic', 'festive'], k=2),
                "created_at": (base_time - timedelta(days=random.randint(1, 365))).isoformat(),
            }
        
        interaction = {
            "interaction_id": str(uuid.uuid4()),
            "user_id": user_id,
            "artisan_id": artisan_id,
            "product_id": f"{artisan_id}_product_{random.randint(0, 5)}",
            "action_type": random.choices(action_types, weights=action_weights)[0],
            "timestamp": (base_time - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )).isoformat(),
            "session_id": str(uuid.uuid4()),
            "device_type": random.choice(['mobile', 'desktop', 'tablet']),
            "location": None,  # Geography type - can be added later
        }
        interactions.append(interaction)
    
    # Insert interactions
    table_id = f"{project_id}.artisan_analytics.user_interactions"
    errors = bq_client.insert_rows_json(table_id, interactions)
    
    if errors:
        print(f"❌ Errors inserting interactions: {errors}")
    else:
        print(f"✅ Inserted {len(interactions)} interactions")
    
    # Insert demographics
    demo_table_id = f"{project_id}.artisan_analytics.user_demographics"
    demo_rows = list(demographics.values())
    errors = bq_client.insert_rows_json(demo_table_id, demo_rows)
    
    if errors:
        print(f"❌ Errors inserting demographics: {errors}")
    else:
        print(f"✅ Inserted {len(demo_rows)} demographic records")

def sync_all(artisan_id: str = None, generate_samples: bool = False):
    """Sync all data from Firebase to BigQuery"""
    print("🚀 Starting Firebase → BigQuery sync...\n")
    
    sync_products()
    
    if generate_samples and artisan_id:
        generate_sample_interactions(artisan_id, num_interactions=200)
    
    print("\n✅ Sync complete!")

if __name__ == "__main__":
    # Run sync
    # Replace with actual artisan ID for testing
    sync_all(artisan_id="test_artisan_123", generate_samples=True)