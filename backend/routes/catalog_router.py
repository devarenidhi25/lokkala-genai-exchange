from fastapi import APIRouter, HTTPException
from firebase_admin import firestore 
from firebase_config import db
from pydantic import BaseModel
from typing import Optional, List
from services.catalog_service import CatalogService
from services.whatsapp_service import WhatsAppService

router = APIRouter()
catalog_service = CatalogService()
whatsapp_service = WhatsAppService()

class GenerateCatalogRequest(BaseModel):
    artisan_id: str
    catalog_type: str = 'pdf'

class ShareWhatsAppRequest(BaseModel):
    artisan_id: str
    phone_number: str
    catalog_url: str
    custom_message: Optional[str] = None

class BulkShareRequest(BaseModel):
    artisan_id: str
    phone_numbers: List[str]
    catalog_url: str

@router.get("/")
async def catalog_root():
    """Catalog API root"""
    return {
        "message": "Catalog API is running",
        "endpoints": {
            "generate": "POST /generate",
            "share-whatsapp": "POST /share-whatsapp",
            "share-whatsapp-bulk": "POST /share-whatsapp-bulk",
            "history": "GET /history/{artisan_id}",
            "shares": "GET /shares/{artisan_id}"
        }
    }

@router.post("/generate")
async def generate_catalog(request: GenerateCatalogRequest):
    """Generate product catalog (PDF or Image)"""
    try:
        if request.catalog_type == 'pdf':
            result = await catalog_service.generate_pdf_catalog(request.artisan_id)
        elif request.catalog_type == 'image':
            result = await catalog_service.generate_image_catalog(request.artisan_id)
        else:
            raise HTTPException(status_code=400, detail="Invalid catalog type. Use 'pdf' or 'image'")
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share-whatsapp")
async def share_whatsapp(request: ShareWhatsAppRequest):
    """Share catalog via WhatsApp"""
    try:
        result = await whatsapp_service.send_catalog(
            request.artisan_id,
            request.phone_number,
            request.catalog_url,
            request.custom_message
        )
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share-whatsapp-bulk")
async def share_whatsapp_bulk(request: BulkShareRequest):
    """Share catalog to multiple WhatsApp numbers"""
    try:
        results = await whatsapp_service.send_bulk_catalog(
            request.artisan_id,
            request.phone_numbers,
            request.catalog_url
        )
        
        success_count = sum(1 for r in results if r['success'])
        
        return {
            'success': True,
            'total': len(results),
            'sent': success_count,
            'failed': len(results) - success_count,
            'results': results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{artisan_id}")
async def get_catalog_history(artisan_id: str, limit: int = 5):
    try:
        docs = db.collection('catalogs').where('artisan_id', '==', artisan_id)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(limit).stream()
        history = [doc.to_dict() for doc in docs]
        return {"success": True, "data": history}
    except Exception as e:
        print(f"❌ Error fetching catalog history: {e}")
        return {"success": False, "data": []}


@router.get("/shares/{artisan_id}")
async def get_catalog_shares(artisan_id: str, limit: int = 10):
    try:
        docs = db.collection('whatsapp_shares').where('artisan_id', '==', artisan_id)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(limit).stream()
        shares = [doc.to_dict() for doc in docs]
        return {"success": True, "data": shares}
    except Exception as e:
        print(f"❌ Error fetching WhatsApp shares: {e}")
        return {"success": False, "data": []}

