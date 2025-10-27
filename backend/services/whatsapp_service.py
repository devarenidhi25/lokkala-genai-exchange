from twilio.rest import Client
from firebase_admin import firestore
from firebase_config import db
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WhatsAppService:
    
    def __init__(self):
        # Load credentials
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER', '+14155238886')
        
        # Remove 'whatsapp:' prefix if present in env
        if self.whatsapp_number.startswith('whatsapp:'):
            self.whatsapp_number = self.whatsapp_number.replace('whatsapp:', '')
        
        # Debug output
        print(f"🔍 Loading Twilio credentials...")
        print(f"   Account SID: {self.account_sid[:10] if self.account_sid else 'NOT SET'}...")
        print(f"   Auth Token: {'SET' if self.auth_token else 'NOT SET'}")
        print(f"   WhatsApp Number: {self.whatsapp_number}")
        
        if not self.account_sid or not self.auth_token:
            print("⚠️ WARNING: Twilio credentials not set in .env file")
            self.client = None
        else:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                print("✅ Twilio WhatsApp client initialized")
                
                # Test the number format
                print(f"   Will send from: whatsapp:{self.whatsapp_number}")
            except Exception as e:
                print(f"❌ Error initializing Twilio client: {e}")
                self.client = None
    
    async def send_catalog(self, artisan_id: str, phone_number: str, catalog_url: str, custom_message: str = None):
        """Send catalog via WhatsApp"""
        try:
            if not self.client:
                raise ValueError("Twilio client not initialized. Check your .env credentials.")
            
            # Get artisan data
            artisan_ref = db.collection('users').document(artisan_id)
            artisan_doc = artisan_ref.get()
            
            if not artisan_doc.exists:
                raise ValueError(f"Artisan not found with ID: {artisan_id}")
            
            artisan_data = artisan_doc.to_dict()
            artisan_name = artisan_data.get('name', 'Our Artisan')
            
            # Format phone number - ensure it has country code
            if not phone_number.startswith('+'):
                phone_number = '+91' + phone_number.lstrip('0')
            
            # Remove any 'whatsapp:' prefix if present
            if phone_number.startswith('whatsapp:'):
                phone_number = phone_number.replace('whatsapp:', '')
            
            print(f"📤 Sending catalog...")
            print(f"   From: whatsapp:{self.whatsapp_number}")
            print(f"   To: whatsapp:{phone_number}")
            print(f"   Media: {catalog_url}")
            
            # Default message
            if not custom_message:
                custom_message = (
                    f"🛍️ *{artisan_name}* Product Catalog\n\n"
                    f"Check out our latest products!\n"
                    f"Browse the catalog and place your order.\n\n"
                    f"📱 For orders, reply to this message."
                )
            
            # Send WhatsApp message
            message = self.client.messages.create(
                from_=f'whatsapp:{self.whatsapp_number}',
                to=f'whatsapp:{phone_number}',
                body=custom_message,
                media_url=[catalog_url]
            )
            
            print(f"✅ Message sent! SID: {message.sid}, Status: {message.status}")
            
            # Log to Firestore
            share_ref = db.collection('whatsapp_shares').document()
            share_data = {
                'id': share_ref.id,
                'artisan_id': artisan_id,
                'phone_number': phone_number,
                'catalog_url': catalog_url,
                'message_sid': message.sid,
                'status': message.status,
                'created_at': firestore.SERVER_TIMESTAMP,
                'message_sent': custom_message
            }
            share_ref.set(share_data)
            
            # Update artisan analytics
            try:
                artisan_ref.update({
                    'whatsapp_shares_count': firestore.Increment(1),
                    'last_shared_at': firestore.SERVER_TIMESTAMP
                })
            except:
                pass
            
            return {
                'success': True,
                'message_sid': message.sid,
                'status': message.status,
                'share_id': share_ref.id
            }
            
        except Exception as e:
            print(f"❌ Error sending WhatsApp: {str(e)}")
            raise Exception(f"Error sending WhatsApp: {str(e)}")
    
    async def send_bulk_catalog(self, artisan_id: str, phone_numbers: list, catalog_url: str):
        """Send catalog to multiple numbers"""
        results = []
        
        print(f"📤 Bulk sending to {len(phone_numbers)} contacts")
        
        for phone in phone_numbers:
            try:
                result = await self.send_catalog(artisan_id, phone, catalog_url)
                results.append({
                    'phone': phone,
                    'success': True,
                    'message_sid': result['message_sid']
                })
            except Exception as e:
                results.append({
                    'phone': phone,
                    'success': False,
                    'error': str(e)
                })
        
        return results