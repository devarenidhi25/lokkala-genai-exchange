"""
Analytics Router for FastAPI
Endpoints for fetching artisan insights from BigQuery
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional
import sys
import os

# Add parent directory to path to import bigquery_analytics
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from services.bigquery_analytics import (
        get_all_insights,
        get_target_audience,
        get_best_timing,
        get_price_performance,
        get_key_insights,
        get_recommended_channels
    )
except ImportError:
    # Fallback for development
    print("Warning: Could not import BigQuery analytics. Using mock data.")
    
    def get_all_insights(artisan_id: str):
        return {
            "target_audience_data": {
                "target_audience": [
                    "Women aged 25-34",
                    "Metropolitan areas (Mumbai, Delhi, Bangalore)",
                    "Festival shoppers"
                ]
            },
            "timing_data": {
                "best_timing": [
                    "Post between 7-9 PM for maximum reach",
                    "Thursdays and Fridays show 30% higher engagement"
                ]
            },
            "price_data": {
                "price_bands": [
                    {"range": "₹2000-5000", "percentage": 45},
                    {"range": "₹5000-10000", "percentage": 35}
                ]
            },
            "key_insights": [
                {"icon": "📈", "text": "Engagement up 25% this week", "trend": "up"}
            ],
            "recommended_channels": [
                {"name": "Instagram Reels", "reason": "High engagement for visual products"}
            ]
        }

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

class InsightsResponse(BaseModel):
    target_audience_data: Dict[str, Any]
    timing_data: Dict[str, Any]
    price_data: Dict[str, Any]
    key_insights: list
    recommended_channels: list

@router.get("/insights/{artisan_id}", response_model=InsightsResponse)
async def get_artisan_insights(
    artisan_id: str,
    refresh: Optional[bool] = Query(False, description="Force refresh from BigQuery")
):
    """
    Get comprehensive analytics insights for an artisan
    
    - **artisan_id**: Firebase UID of the artisan
    - **refresh**: Set to true to bypass cache and fetch fresh data
    """
    try:
        insights = get_all_insights(artisan_id)
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching insights: {str(e)}"
        )

@router.get("/audience/{artisan_id}")
async def get_audience_insights(artisan_id: str):
    """Get target audience insights only"""
    try:
        data = get_target_audience(artisan_id)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching audience data: {str(e)}"
        )

@router.get("/timing/{artisan_id}")
async def get_timing_insights(artisan_id: str):
    """Get best posting timing insights"""
    try:
        data = get_best_timing(artisan_id)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching timing data: {str(e)}"
        )

@router.get("/price-performance/{artisan_id}")
async def get_price_insights(artisan_id: str):
    """Get price band performance analysis"""
    try:
        data = get_price_performance(artisan_id)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching price data: {str(e)}"
        )

@router.get("/key-insights/{artisan_id}")
async def get_key_actionable_insights(artisan_id: str):
    """Get key actionable insights"""
    try:
        insights = get_key_insights(artisan_id)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching insights: {str(e)}"
        )

@router.get("/channels/{artisan_id}")
async def get_channel_recommendations(artisan_id: str):
    """Get recommended marketing channels"""
    try:
        channels = get_recommended_channels(artisan_id)
        return {"channels": channels}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching channels: {str(e)}"
        )

@router.post("/track-interaction")
async def track_interaction(
    user_id: str,
    artisan_id: str,
    product_id: str,
    action_type: str,
    session_id: Optional[str] = None,
    device_type: Optional[str] = "web"
):
    """
    Track user interaction for analytics
    
    - **user_id**: User's Firebase UID or anonymous ID
    - **artisan_id**: Artisan's Firebase UID
    - **product_id**: Product identifier
    - **action_type**: Type of action (view, click, inquiry, purchase)
    - **session_id**: Optional session identifier
    - **device_type**: Device type (web, mobile, tablet)
    """
    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
        from datetime import datetime
        import uuid
        
        credentials = service_account.Credentials.from_service_account_file(
            os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        )
        project_id = os.environ.get("GCLOUD_PROJECT")
        client = bigquery.Client(credentials=credentials, project=project_id)
        
        interaction = {
            "interaction_id": str(uuid.uuid4()),
            "user_id": user_id,
            "artisan_id": artisan_id,
            "product_id": product_id,
            "action_type": action_type,
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id or str(uuid.uuid4()),
            "device_type": device_type,
            "location": None
        }
        
        table_id = f"{project_id}.artisan_analytics.user_interactions"
        errors = client.insert_rows_json(table_id, [interaction])
        
        if errors:
            raise HTTPException(status_code=500, detail=f"Error tracking: {errors}")
        
        return {"status": "success", "interaction_id": interaction["interaction_id"]}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error tracking interaction: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Check if analytics service is running"""
    return {
        "status": "healthy",
        "service": "analytics",
        "bigquery_configured": bool(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
    }