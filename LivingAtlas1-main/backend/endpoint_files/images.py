"""
Endpoint for multi-image support
Provides APIs to manage images in the CardImages table
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from database import conn, cur
from typing import Optional
import os
import uuid
import datetime
import base64
import tempfile
from pathlib import Path

images_router = APIRouter()

# Configure image storage directory (used as local fallback only)
IMAGE_UPLOAD_DIR = "uploads/card_images"
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
GCS_BUCKET_NAME = "cereo_atlas_storage"
GCS_IMAGE_FOLDER = "card_images"


def _get_gcs_client():
    """
    Return a GCS storage client if credentials are available, else None.
    Supports:
      1. GOOGLE_CREDENTIALS_BASE64 env var
      2. Existing GOOGLE_APPLICATION_CREDENTIALS path
      3. Local ServiceKey_GoogleCloud.json in common backend paths
    """
    try:
        from google.cloud import storage as gcs

        gcs_b64 = os.environ.get("GOOGLE_CREDENTIALS_BASE64")
        if gcs_b64:
            key_bytes = base64.b64decode(gcs_b64)
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
            tmp.write(key_bytes)
            tmp.flush()
            tmp.close()
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = tmp.name
            return gcs.Client()

        existing_credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if existing_credentials_path and os.path.exists(existing_credentials_path):
            return gcs.Client()

        backend_root = os.path.dirname(os.path.dirname(__file__))
        candidate_keys = [
            os.path.join(os.path.dirname(__file__), "ServiceKey_GoogleCloud.json"),
            os.path.join(backend_root, "ServiceKey_GoogleCloud.json"),
            os.path.join(os.getcwd(), "ServiceKey_GoogleCloud.json"),
        ]

        for candidate in candidate_keys:
            if os.path.exists(candidate):
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = candidate
                return gcs.Client()

    except Exception as e:
        print(f"[images] Unable to initialize GCS client: {e}")

    return None


def ensure_upload_dir():
    """Ensure local upload directory exists"""
    Path(IMAGE_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file: UploadFile, require_gcs: bool = True) -> str:
    """
    Save uploaded file and return a URL.
    For card gallery images, require_gcs should be True so uploads are persistent.
    """
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}_{timestamp}.{file_ext}"

    gcs_client = _get_gcs_client()
    if gcs_client is not None:
        try:
            bucket = gcs_client.bucket(GCS_BUCKET_NAME)
            blob_name = f"{GCS_IMAGE_FOLDER}/{unique_filename}"
            blob = bucket.blob(blob_name)
            content_type = f"image/{file_ext}" if file_ext != 'jpg' else "image/jpeg"
            blob.upload_from_string(content, content_type=content_type)
            return blob.public_url
        except Exception as gcs_err:
            if require_gcs:
                raise HTTPException(status_code=500, detail=f"GCS upload failed: {gcs_err}")
            print(f"[images] GCS upload failed, falling back to local storage: {gcs_err}")

    if require_gcs:
        raise HTTPException(status_code=500, detail="Image upload requires GCS credentials.")

    ensure_upload_dir()
    filepath = os.path.join(IMAGE_UPLOAD_DIR, unique_filename)
    with open(filepath, 'wb') as f:
        f.write(content)
    return f"/uploads/card_images/{unique_filename}"

@images_router.post("/uploadCardImage")
async def upload_card_image(
    cardID: int = Form(...),
    altText: str = Form(default=""),
    image: UploadFile = File(...)
):
    """
    Upload a new image for a card
    
    Args:
        cardID: Card ID
        altText: Alternative text for the image
        image: Image file
    
    Returns:
        Created image record with ImageID and ImageURL
    """
    try:
        # Verify card exists
        cur.execute("SELECT CardID FROM Cards WHERE CardID = %s", (cardID,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Card not found")
        
        # Save file (persistent GCS storage required)
        image_url = save_uploaded_file(image, require_gcs=True)
        
        # Get next display order
        cur.execute(
            "SELECT COALESCE(MAX(DisplayOrder), -1) FROM CardImages WHERE CardID = %s",
            (cardID,)
        )
        next_order = cur.fetchone()[0] + 1
        
        # Insert into CardImages
        cur.execute("""
            INSERT INTO CardImages (CardID, ImageURL, DisplayOrder, AltText)
            VALUES (%s, %s, %s, %s)
            RETURNING ImageID
        """, (cardID, image_url, next_order, altText))
        
        image_id = cur.fetchone()[0]

        # Keep legacy thumbnail field in sync for list/map endpoints that still read Cards.Thumbnail_Link
        cur.execute(
            "UPDATE Cards SET Thumbnail_Link = %s WHERE CardID = %s",
            (image_url, cardID)
        )
        conn.commit()
        
        return {
            "success": True,
            "imageID": image_id,
            "imageURL": image_url,
            "displayOrder": next_order,
            "altText": altText
        }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@images_router.post("/uploadCardImages")
async def upload_card_images(
    cardID: int = Form(...),
    altTexts: Optional[str] = Form(None),
    images: list[UploadFile] = File(...)
):
    """
    Upload multiple images for a card in one request.

    Args:
        cardID: Card ID
        altTexts: Optional delimiter-separated alt text values ("||" delimiter)
        images: List of image files

    Returns:
        Created image records with ImageID and ImageURL
    """
    try:
        if not images:
            raise HTTPException(status_code=400, detail="No images provided")

        cur.execute("SELECT CardID FROM Cards WHERE CardID = %s", (cardID,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Card not found")

        alt_text_values = []
        if altTexts:
            alt_text_values = [text.strip() for text in altTexts.split("||")]

        cur.execute(
            "SELECT COALESCE(MAX(DisplayOrder), -1) FROM CardImages WHERE CardID = %s",
            (cardID,)
        )
        next_order = cur.fetchone()[0] + 1

        created_images = []
        for index, image in enumerate(images):
            image_url = save_uploaded_file(image, require_gcs=True)
            alt_text = alt_text_values[index] if index < len(alt_text_values) else ""

            cur.execute(
                """
                INSERT INTO CardImages (CardID, ImageURL, DisplayOrder, AltText)
                VALUES (%s, %s, %s, %s)
                RETURNING ImageID
                """,
                (cardID, image_url, next_order + index, alt_text)
            )
            image_id = cur.fetchone()[0]

            created_images.append({
                "imageID": image_id,
                "imageURL": image_url,
                "displayOrder": next_order + index,
                "altText": alt_text
            })

        # Keep legacy thumbnail in sync to first newly uploaded image
        cur.execute(
            "UPDATE Cards SET Thumbnail_Link = %s WHERE CardID = %s",
            (created_images[0]["imageURL"], cardID)
        )
        conn.commit()

        return {
            "success": True,
            "cardID": cardID,
            "images": created_images
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")


@images_router.delete("/deleteCardImage/{imageID}")
async def delete_card_image(imageID: int):
    """
    Delete an image by ID
    
    Args:
        imageID: Image ID to delete
    
    Returns:
        Success confirmation
    """
    try:
        # Get image details
        cur.execute("SELECT ImageURL, CardID FROM CardImages WHERE ImageID = %s", (imageID,))
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_url, card_id = result
        
        # Delete from database
        cur.execute("DELETE FROM CardImages WHERE ImageID = %s", (imageID,))
        
        # Delete the backing file (GCS or local)
        if image_url.startswith('https://storage.googleapis.com/'):
            try:
                gcs_client = _get_gcs_client()
                if gcs_client is not None:
                    # Extract blob name from URL: .../bucket_name/blob_name
                    blob_name = '/'.join(image_url.split(f"/{GCS_BUCKET_NAME}/")[1:])
                    gcs_client.bucket(GCS_BUCKET_NAME).blob(blob_name).delete()
            except Exception as gcs_err:
                print(f"[images] GCS delete failed (non-fatal): {gcs_err}")
        elif image_url.startswith('/uploads/card_images/'):
            filepath = image_url.lstrip('/')
            if os.path.exists(filepath):
                os.remove(filepath)
        
        # Reorder remaining images
        cur.execute("""
            SELECT ImageID FROM CardImages 
            WHERE CardID = %s 
            ORDER BY DisplayOrder, ImageID
        """, (card_id,))        
        remaining_images = cur.fetchall()
        for idx, (img_id,) in enumerate(remaining_images):
            cur.execute(
                "UPDATE CardImages SET DisplayOrder = %s WHERE ImageID = %s",
                (idx, img_id)
            )

        # After delete, reset thumbnail to first remaining image or default logo.
        cur.execute(
            """
            SELECT ImageURL
            FROM CardImages
            WHERE CardID = %s
            ORDER BY DisplayOrder ASC, ImageID ASC
            LIMIT 1
            """,
            (card_id,)
        )
        first_image = cur.fetchone()
        next_thumbnail = first_image[0] if first_image else "/CEREO-logo.png"
        cur.execute(
            "UPDATE Cards SET Thumbnail_Link = %s WHERE CardID = %s",
            (next_thumbnail, card_id)
        )
        
        conn.commit()
        
        return {
            "success": True,
            "deleteImageID": imageID,
            "cardID": card_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@images_router.put("/reorderCardImages")
async def reorder_card_images(cardID: int, imageOrder: list):
    """
    Reorder images for a card
    
    Args:
        cardID: Card ID
        imageOrder: List of ImageIDs in desired order
    
    Returns:
        Updated order confirmation
    """
    try:
        # Verify all images belong to this card
        placeholders = ','.join(['%s'] * len(imageOrder))
        cur.execute(f"""
            SELECT COUNT(*) FROM CardImages 
            WHERE CardID = %s AND ImageID = ANY(ARRAY[{placeholders}])
        """, [cardID] + imageOrder)
        
        if cur.fetchone()[0] != len(imageOrder):
            raise HTTPException(status_code=400, detail="Invalid image IDs for this card")
        
        # Update display order
        for display_idx, image_id in enumerate(imageOrder):
            cur.execute(
                "UPDATE CardImages SET DisplayOrder = %s WHERE ImageID = %s",
                (display_idx, image_id)
            )
        
        conn.commit()
        
        return {
            "success": True,
            "cardID": cardID,
            "newOrder": imageOrder
        }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Reorder failed: {str(e)}")

@images_router.get("/cardImages/{cardID}")
async def get_card_images(cardID: int):
    """
    Get all images for a card
    
    Args:
        cardID: Card ID
    
    Returns:
        List of images sorted by DisplayOrder
    """
    try:
        cur.execute("""
            SELECT ImageID, ImageURL, DisplayOrder, AltText, DateAdded
            FROM CardImages
            WHERE CardID = %s
            ORDER BY DisplayOrder ASC
        """, (cardID,))
        
        rows = cur.fetchall()
        images = [
            {
                "imageID": row[0],
                "url": row[1],
                "displayOrder": row[2],
                "alt": row[3],
                "dateAdded": str(row[4]) if row[4] else None
            }
            for row in rows
        ]
        
        return {
            "cardID": cardID,
            "totalImages": len(images),
            "images": images
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
