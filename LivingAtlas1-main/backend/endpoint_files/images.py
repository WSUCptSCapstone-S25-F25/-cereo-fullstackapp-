"""
Endpoint for multi-image support
Provides APIs to manage images in the CardImages table
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from database import conn, cur
import os
from pathlib import Path

images_router = APIRouter()

# Configure image storage directory
IMAGE_UPLOAD_DIR = "uploads/card_images"
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def ensure_upload_dir():
    """Ensure upload directory exists"""
    Path(IMAGE_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file: UploadFile) -> str:
    """Save uploaded file and return URL"""
    ensure_upload_dir()
    
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Generate unique filename
    import uuid
    timestamp = __import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}_{timestamp}.{file_ext}"
    
    filepath = os.path.join(IMAGE_UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(filepath, 'wb') as f:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
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
        
        # Save file
        image_url = save_uploaded_file(image)
        
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
        
        # Delete file if it exists
        if image_url.startswith('/uploads/card_images/'):
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
