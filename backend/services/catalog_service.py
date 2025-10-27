from firebase_admin import firestore, storage
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import io
import requests
import uuid
import platform
import os
from firebase_config import db, bucket

class CatalogService:
    
    @staticmethod
    def get_font_paths():
        """Get platform-specific font paths"""
        system = platform.system()
        
        if system == "Windows":
            base_path = "C:/Windows/Fonts"
            return {
                'bold': f"{base_path}/arialbd.ttf",
                'regular': f"{base_path}/arial.ttf",
            }
        elif system == "Linux":
            return {
                'bold': "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                'regular': "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            }
        elif system == "Darwin":  # macOS
            return {
                'bold': "/System/Library/Fonts/Helvetica.ttc",
                'regular': "/System/Library/Fonts/Helvetica.ttc",
            }
        else:
            return None
    
    @staticmethod
    def load_fonts():
        """Load fonts with fallback to default"""
        font_paths = CatalogService.get_font_paths()
        
        try:
            if font_paths:
                font_title = ImageFont.truetype(font_paths['bold'], 36)
                font_subtitle = ImageFont.truetype(font_paths['regular'], 20)
                font_name = ImageFont.truetype(font_paths['bold'], 22)
                font_price = ImageFont.truetype(font_paths['bold'], 28)
                print("✅ Loaded TrueType fonts")
                return font_title, font_subtitle, font_name, font_price
        except Exception as e:
            print(f"⚠️ Error loading TrueType fonts: {e}")
        
        print("⚠️ Using default fonts")
        default_font = ImageFont.load_default()
        return default_font, default_font, default_font, default_font
    
    @staticmethod
    async def get_artisan_products(artisan_id: str):
        """Fetch artisan profile and products from Firestore"""
        try:
            # Get artisan profile
            artisan_ref = db.collection('users').document(artisan_id)
            artisan_doc = artisan_ref.get()
            
            if not artisan_doc.exists:
                raise ValueError(f"Artisan not found with ID: {artisan_id}")
            
            artisan_data = artisan_doc.to_dict()
            artisan_data['id'] = artisan_doc.id
            
            # ✅ FIX: Products are stored inside the user document
            products = artisan_data.get("products", [])
            if not products or len(products) == 0:
                raise ValueError(f"No products found for this artisan")

            print(f"📦 Found {len(products)} embedded products for artisan {artisan_id}")
            return artisan_data, products
            
        except Exception as e:
            print(f"❌ Error fetching data: {str(e)}")
            raise Exception(f"Error fetching data: {str(e)}")
    
    @staticmethod
    def download_image(url: str) -> bytes:
        """Download image from URL with better error handling"""
        try:
            print(f"🔄 Downloading image from: {url}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, timeout=15, headers=headers)
            response.raise_for_status()
            
            # Verify it's actually an image
            content_type = response.headers.get('content-type', '')
            if 'image' not in content_type.lower():
                print(f"⚠️ URL returned non-image content-type: {content_type}")
                return None
            
            print(f"✅ Downloaded image ({len(response.content)} bytes)")
            return response.content
            
        except requests.exceptions.Timeout:
            print(f"⚠️ Timeout downloading image from {url}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Error downloading image from {url}: {e}")
            return None
        except Exception as e:
            print(f"⚠️ Unexpected error downloading image: {e}")
            return None
    
    @staticmethod
    async def generate_pdf_catalog(artisan_id: str) -> dict:
        """Generate PDF catalog"""
        try:
            print(f"🔄 Generating PDF catalog for artisan {artisan_id}")
            
            artisan_data, products = await CatalogService.get_artisan_products(artisan_id)
            
            if not products:
                raise ValueError("No products found for this artisan")
            
            # Create PDF in memory
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch)
            story = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontSize=24,
                textColor=colors.HexColor('#1a56db'),
                spaceAfter=30,
                alignment=1
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor('#111827'),
                spaceAfter=10,
                spaceBefore=20
            )
            
            price_style = ParagraphStyle(
                'PriceStyle',
                parent=styles['Normal'],
                fontSize=14,
                textColor=colors.HexColor('#059669'),
                fontName='Helvetica-Bold'
            )
            
            # Header
            artisan_name = artisan_data.get('name', 'Artisan')
            header = Paragraph(f"<b>{artisan_name}</b><br/>Product Catalog", title_style)
            story.append(header)
            story.append(Spacer(1, 0.3*inch))
            
            # Contact info
            contact_info = []
            if artisan_data.get('email'):
                contact_info.append(f"Email: {artisan_data['email']}")
            if artisan_data.get('phone'):
                contact_info.append(f"Phone: {artisan_data['phone']}")
            
            if contact_info:
                contact_text = " | ".join(contact_info)
                story.append(Paragraph(contact_text, styles['Normal']))
                story.append(Spacer(1, 0.3*inch))
            
            # Products
            for idx, product in enumerate(products, 1):
                product_name = product.get('name', 'Unnamed Product')
                story.append(Paragraph(f"{idx}. {product_name}", heading_style))
                
                # Product image
                image_url = product.get('image_url') or product.get('imageUrl')
                if image_url:
                    try:
                        img_data = CatalogService.download_image(image_url)
                        if img_data:
                            # Verify image data
                            img_buffer = io.BytesIO(img_data)
                            test_img = Image.open(img_buffer)
                            test_img.verify()
                            
                            # Create new buffer for ReportLab
                            img_buffer = io.BytesIO(img_data)
                            img = RLImage(img_buffer, width=3*inch, height=3*inch)
                            story.append(img)
                            story.append(Spacer(1, 0.1*inch))
                    except Exception as e:
                        print(f"⚠️ Error loading image for PDF: {e}")
                
                # Description
                description = product.get('description', 'No description available')
                story.append(Paragraph(description, styles['Normal']))
                story.append(Spacer(1, 0.1*inch))
                
                # Price
                price = product.get('price', 0)
                price_text = f"Price: ₹{price:,.2f}"
                story.append(Paragraph(price_text, price_style))
                
                # Category
                if product.get('category'):
                    category_text = f"Category: {product['category']}"
                    story.append(Paragraph(category_text, styles['Italic']))
                
                story.append(Spacer(1, 0.4*inch))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            # Upload to Firebase Storage
            filename = f"catalogs/{artisan_id}_{uuid.uuid4()}.pdf"
            blob = bucket.blob(filename)
            blob.upload_from_file(buffer, content_type='application/pdf')
            blob.make_public()
            
            catalog_url = blob.public_url
            
            print(f"✅ PDF catalog generated: {catalog_url}")
            
            # Save catalog metadata to Firestore
            catalog_ref = db.collection('catalogs').document()
            catalog_data = {
                'id': catalog_ref.id,
                'artisan_id': artisan_id,
                'type': 'pdf',
                'url': catalog_url,
                'product_count': len(products),
                'created_at': firestore.SERVER_TIMESTAMP,
                'storage_path': filename
            }
            catalog_ref.set(catalog_data)
            
            return {
                'success': True,
                'catalog_url': catalog_url,
                'catalog_id': catalog_ref.id,
                'product_count': len(products),
                'artisan_name': artisan_name
            }
            
        except Exception as e:
            print(f"❌ Error generating PDF: {str(e)}")
            raise Exception(f"Error generating PDF: {str(e)}")
    
    @staticmethod
    async def generate_image_catalog(artisan_id: str) -> dict:
        """Generate image-based catalog"""
        try:
            print(f"🔄 Generating image catalog for artisan {artisan_id}")
            
            artisan_data, products = await CatalogService.get_artisan_products(artisan_id)
            
            if not products:
                raise ValueError("No products found for this artisan")
            
            # Calculate dimensions
            products_per_row = 2
            product_height = 450
            header_height = 150
            rows = (len(products) + products_per_row - 1) // products_per_row
            
            img_width = 1200
            img_height = header_height + (rows * product_height)
            
            # Create image
            catalog_img = Image.new('RGB', (img_width, img_height), '#ffffff')
            draw = ImageDraw.Draw(catalog_img)
            
            # Load fonts
            font_title, font_subtitle, font_name, font_price = CatalogService.load_fonts()
            
            # Header
            artisan_name = artisan_data.get('name', 'Artisan')
            
            # Draw header background
            draw.rectangle([(0, 0), (img_width, header_height)], fill='#1e40af')
            
            # Title
            title = f"{artisan_name} - Product Catalog"
            try:
                title_bbox = draw.textbbox((0, 0), title, font=font_title)
                title_width = title_bbox[2] - title_bbox[0]
            except:
                title_width = len(title) * 15
            draw.text(((img_width - title_width) // 2, 40), title, fill='#ffffff', font=font_title)
            
            # Subtitle
            subtitle = f"{len(products)} Products Available"
            try:
                subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_subtitle)
                subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
            except:
                subtitle_width = len(subtitle) * 10
            draw.text(((img_width - subtitle_width) // 2, 95), subtitle, fill='#e0e7ff', font=font_subtitle)
            
            # Products grid
            x_offset = 50
            y_offset = header_height + 30
            col_width = 550
            
            for idx, product in enumerate(products):
                col = idx % products_per_row
                row = idx // products_per_row
                
                x_pos = x_offset + (col * col_width)
                y_pos = y_offset + (row * product_height)
                
                # Product card background
                card_x = x_pos - 10
                card_y = y_pos - 10
                card_width = 530
                card_height = 420
                draw.rectangle(
                    [(card_x, card_y), (card_x + card_width, card_y + card_height)],
                    outline='#d1d5db',
                    width=2
                )
                
                # Product image
                image_url = product.get('image_url') or product.get('imageUrl')
                if image_url:
                    try:
                        img_data = CatalogService.download_image(image_url)
                        if img_data:
                            # Open and verify image
                            img_buffer = io.BytesIO(img_data)
                            prod_img = Image.open(img_buffer)
                            
                            # Convert to RGB if necessary
                            if prod_img.mode in ('RGBA', 'LA', 'P'):
                                background = Image.new('RGB', prod_img.size, (255, 255, 255))
                                if prod_img.mode == 'P':
                                    prod_img = prod_img.convert('RGBA')
                                background.paste(prod_img, mask=prod_img.split()[-1] if prod_img.mode == 'RGBA' else None)
                                prod_img = background
                            elif prod_img.mode != 'RGB':
                                prod_img = prod_img.convert('RGB')
                            
                            # Resize
                            prod_img.thumbnail((280, 280), Image.Resampling.LANCZOS)
                            
                            # Center the image
                            img_x = x_pos + (510 - prod_img.width) // 2
                            catalog_img.paste(prod_img, (img_x, y_pos))
                            print(f"✅ Added product image for: {product.get('name', 'Product')}")
                    except Exception as e:
                        print(f"⚠️ Error loading product image for {product.get('name', 'Product')}: {e}")
                        # Draw placeholder
                        draw.rectangle(
                            [(x_pos, y_pos), (x_pos + 280, y_pos + 280)],
                            fill='#f3f4f6',
                            outline='#d1d5db'
                        )
                        draw.text((x_pos + 80, y_pos + 130), "No Image", fill='#9ca3af', font=font_subtitle)
                
                # Product details
                text_y = y_pos + 300
                
                # Product name
                product_name = product.get('name', 'Product')[:35]
                if len(product.get('name', '')) > 35:
                    product_name += '...'
                draw.text((x_pos, text_y), product_name, fill='#111827', font=font_name)
                
                # Price
                price = product.get('price', 0)
                price_text = f"₹{price:,.2f}"
                draw.text((x_pos, text_y + 35), price_text, fill='#059669', font=font_price)
                
                # Category
                if product.get('category'):
                    category = product['category'][:25]
                    draw.text((x_pos, text_y + 75), category, fill='#6b7280', font=font_subtitle)
            
            # Upload to Firebase Storage
            buffer = io.BytesIO()
            catalog_img.save(buffer, format='PNG', quality=95, optimize=True)
            buffer.seek(0)
            
            filename = f"catalogs/{artisan_id}_{uuid.uuid4()}.png"
            blob = bucket.blob(filename)
            blob.upload_from_file(buffer, content_type='image/png')
            blob.make_public()
            
            catalog_url = blob.public_url
            
            print(f"✅ Image catalog generated: {catalog_url}")
            
            # Save to Firestore
            catalog_ref = db.collection('catalogs').document()
            catalog_data = {
                'id': catalog_ref.id,
                'artisan_id': artisan_id,
                'type': 'image',
                'url': catalog_url,
                'product_count': len(products),
                'created_at': firestore.SERVER_TIMESTAMP,
                'storage_path': filename
            }
            catalog_ref.set(catalog_data)
            
            return {
                'success': True,
                'catalog_url': catalog_url,
                'catalog_id': catalog_ref.id,
                'product_count': len(products),
                'artisan_name': artisan_name
            }
            
        except Exception as e:
            print(f"❌ Error generating image: {str(e)}")
            raise Exception(f"Error generating image: {str(e)}")