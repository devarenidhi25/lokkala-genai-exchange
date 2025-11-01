from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.best_time_analyzer import BestTimeAnalyzer

router = APIRouter(prefix="/api/best-time", tags=["Best Time Analytics"])

class BestTimeRequest(BaseModel):
    product_name: str
    category: str
    keywords: List[str]
    hashtags: Optional[List[str]] = None

@router.post("/analyze")
async def best_time_to_post(request: BestTimeRequest):
    """
    Analyze the best time to post a product on Instagram
    
    Combines:
    - Instagram Graph API engagement data (50% weight)
    - Gemini AI cultural/seasonal insights (30% weight)
    - Firestore historical performance (20% weight)
    
    Example Request:
    {
        "product_name": "Hand-painted Terracotta Pots",
        "category": "Home Decor",
        "keywords": ["terracotta", "handmade", "clay", "pots"],
        "hashtags": ["#terracotta", "#handmade", "#homedecor"]
    }
    """
    try:
        analyzer = BestTimeAnalyzer()
        
        result = analyzer.analyze(
            product_name=request.product_name,
            category=request.category,
            keywords=request.keywords,
            hashtags=request.hashtags
        )
        
        if "error" in result and not result.get("product"):
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "status": "success",
            "data": result
        }
        
    except Exception as e:
        print(f"Error in best_time_to_post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/test")
async def test_best_time():
    """
    Test endpoint with sample data
    """
    try:
        analyzer = BestTimeAnalyzer()
        
        result = analyzer.analyze(
            product_name="Brass Ganesh Idol",
            category="Spiritual Items",
            keywords=["brass", "ganesh", "idol", "statue", "handcrafted"],
            hashtags=["#brass", "#ganesh", "#spiritual", "#handmade"]
        )
        
        return {
            "status": "success",
            "message": "Test analysis completed",
            "data": result
        }
        
    except Exception as e:
        print(f"Error in test_best_time: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Check if best time analyzer is configured properly"""
    try:
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        return {
            "status": "healthy",
            "instagram_configured": bool(os.getenv("INSTAGRAM_ACCESS_TOKEN")),
            "gemini_configured": bool(os.getenv("GOOGLE_API_KEY")),
            "service": "best-time-analyzer"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }