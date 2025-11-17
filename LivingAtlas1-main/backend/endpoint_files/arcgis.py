from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from database import cur, conn

arcgis_router = APIRouter(prefix="/arcgis", tags=["ArcGIS"])

_STATE_MAP = {
    "wa": "washington",
    "washington": "washington",
    "id": "idaho",
    "idaho": "idaho",
    "or": "oregon",
    "oregon": "oregon",
}

def _normalize_state(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    key = s.strip().lower()
    return _STATE_MAP.get(key, key)

class RemoveServiceRequest(BaseModel):
    service_key: str
    removed_by: Optional[str] = None
    layers_removed: Optional[List[str]] = None

class RenameFolderRequest(BaseModel):
    old_folder_name: str
    new_folder_name: str
    state: Optional[str] = None

class RenameServiceRequest(BaseModel):
    service_key: str
    new_label: str

@arcgis_router.get("/services")
def get_services(
    state: Optional[str] = Query(None, description="WA|ID|OR or full state name"),
    type: Optional[str] = Query("MapServer", description="ArcGIS service type or 'all'"),
):
    if cur is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    clauses: List[str] = []
    params: List[str] = []

    norm_state = _normalize_state(state)
    if norm_state:
        clauses.append("LOWER(state) = %s")
        params.append(norm_state)

    if type and type.lower() != "all":
        clauses.append("type = %s")
        params.append(type)

    where_sql = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT
            service_key AS key,
            label,
            url,
            COALESCE(folder, 'Root') AS folder,
            type,
            state
        FROM arcgis_services
        {where_sql}
        ORDER BY folder, label
    """.strip()

    try:
        cur.execute(sql, params)
        rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    columns = ["key", "label", "url", "folder", "type", "state"]
    data = [dict(zip(columns, row)) for row in rows]
    return data

@arcgis_router.post("/services/remove")
def remove_service(request: RemoveServiceRequest):
    if cur is None or conn is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Start transaction
        conn.autocommit = False
        
        # Ensure removed_arcgis_services table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS removed_arcgis_services (
                id SERIAL PRIMARY KEY,
                service_key VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                folder VARCHAR(255) DEFAULT 'Root',
                type VARCHAR(50) NOT NULL,
                state VARCHAR(50) NOT NULL,
                removed_by VARCHAR(255),
                layers_removed TEXT[],
                removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_removed_service_per_state UNIQUE (service_key, state, type)
            )
        """)
        
        # First, get the service details from the main table
        cur.execute("""
            SELECT service_key, label, url, folder, type, state 
            FROM arcgis_services 
            WHERE service_key = %s
        """, (request.service_key,))
        
        service_row = cur.fetchone()
        if not service_row:
            conn.rollback()
            conn.autocommit = True
            raise HTTPException(status_code=404, detail="Service not found")
        
        service_key, label, url, folder, type_val, state = service_row
        
        # Insert into removed_arcgis_services table
        cur.execute("""
            INSERT INTO removed_arcgis_services 
            (service_key, label, url, folder, type, state, removed_by, layers_removed)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            service_key,
            label, 
            url,
            folder,
            type_val,
            state,
            request.removed_by,
            request.layers_removed or []
        ))
        
        # Remove from main arcgis_services table
        cur.execute("""
            DELETE FROM arcgis_services 
            WHERE service_key = %s
        """, (request.service_key,))
        
        # Commit transaction
        conn.commit()
        conn.autocommit = True
        
        return {
            "success": True,
            "message": f"Service '{label}' moved to removed services",
            "service_key": service_key
        }
        
    except Exception as e:
        conn.rollback()
        conn.autocommit = True
        raise HTTPException(status_code=500, detail=f"Failed to remove service: {str(e)}")

@arcgis_router.get("/services/removed")
def get_removed_services(
    state: Optional[str] = Query(None, description="WA|ID|OR or full state name"),
    type: Optional[str] = Query("MapServer", description="ArcGIS service type or 'all'"),
):
    if cur is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Ensure removed_arcgis_services table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS removed_arcgis_services (
                id SERIAL PRIMARY KEY,
                service_key VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                folder VARCHAR(255) DEFAULT 'Root',
                type VARCHAR(50) NOT NULL,
                state VARCHAR(50) NOT NULL,
                removed_by VARCHAR(255),
                layers_removed TEXT[],
                removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_removed_service_per_state UNIQUE (service_key, state, type)
            )
        """)
        conn.commit()
    except Exception as e:
        # If table creation fails, continue anyway as it might already exist
        pass

    clauses: List[str] = []
    params: List[str] = []

    norm_state = _normalize_state(state)
    if norm_state:
        clauses.append("LOWER(state) = %s")
        params.append(norm_state)

    if type and type.lower() != "all":
        clauses.append("type = %s")
        params.append(type)

    where_sql = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT
            service_key AS key,
            label,
            url,
            COALESCE(folder, 'Root') AS folder,
            type,
            state,
            removed_at AS removed_date,
            removed_by,
            layers_removed
        FROM removed_arcgis_services
        {where_sql}
        ORDER BY removed_at DESC
    """.strip()

    try:
        cur.execute(sql, params)
        rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    columns = ["key", "label", "url", "folder", "type", "state", "removed_date", "removed_by", "layers_removed"]
    data = [dict(zip(columns, row)) for row in rows]
    return data

@arcgis_router.put("/services/rename-folder")
def rename_folder(request: RenameFolderRequest):
    if cur is None or conn is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    # Validate input
    if not request.new_folder_name.strip():
        raise HTTPException(status_code=400, detail="New folder name cannot be empty")
    
    if len(request.new_folder_name.strip()) > 255:
        raise HTTPException(status_code=400, detail="Folder name cannot exceed 255 characters")
    
    if request.old_folder_name.strip() == request.new_folder_name.strip():
        raise HTTPException(status_code=400, detail="New folder name must be different from current name")

    try:
        # Start transaction
        conn.autocommit = False
        
        # Build WHERE clause
        where_clauses = ["COALESCE(folder, 'Root') = %s"]
        params = [request.old_folder_name or 'Root']
        
        if request.state:
            norm_state = _normalize_state(request.state)
            if norm_state:
                where_clauses.append("LOWER(state) = %s")
                params.append(norm_state)
        
        # Check if any services exist with the old folder name
        check_sql = f"""
            SELECT COUNT(*) FROM arcgis_services 
            WHERE {' AND '.join(where_clauses)}
        """
        
        cur.execute(check_sql, params)
        count = cur.fetchone()[0]
        
        if count == 0:
            conn.rollback()
            conn.autocommit = True
            raise HTTPException(status_code=404, detail="No services found with the specified folder name")
        
        # Update folder name for all matching services
        update_sql = f"""
            UPDATE arcgis_services 
            SET folder = %s 
            WHERE {' AND '.join(where_clauses)}
        """
        
        update_params = [request.new_folder_name.strip()] + params
        cur.execute(update_sql, update_params)
        
        updated_count = cur.rowcount
        
        # Commit transaction
        conn.commit()
        conn.autocommit = True
        
        return {
            "success": True,
            "message": f"Successfully renamed folder '{request.old_folder_name}' to '{request.new_folder_name}'",
            "services_updated": updated_count
        }
        
    except Exception as e:
        conn.rollback()
        conn.autocommit = True
        raise HTTPException(status_code=500, detail=f"Failed to rename folder: {str(e)}")

@arcgis_router.put("/services/rename")
def rename_service(request: RenameServiceRequest):
    if cur is None or conn is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    # Validate input
    if not request.new_label.strip():
        raise HTTPException(status_code=400, detail="New service label cannot be empty")
    
    if len(request.new_label.strip()) > 255:
        raise HTTPException(status_code=400, detail="Service label cannot exceed 255 characters")

    try:
        # Start transaction
        conn.autocommit = False
        
        # Check if service exists
        cur.execute("""
            SELECT label FROM arcgis_services 
            WHERE service_key = %s
        """, (request.service_key,))
        
        result = cur.fetchone()
        if not result:
            conn.rollback()
            conn.autocommit = True
            raise HTTPException(status_code=404, detail="Service not found")
        
        old_label = result[0]
        
        if old_label == request.new_label.strip():
            conn.rollback()
            conn.autocommit = True
            raise HTTPException(status_code=400, detail="New service label must be different from current label")
        
        # Update service label
        cur.execute("""
            UPDATE arcgis_services 
            SET label = %s 
            WHERE service_key = %s
        """, (request.new_label.strip(), request.service_key))
        
        # Commit transaction
        conn.commit()
        conn.autocommit = True
        
        return {
            "success": True,
            "message": f"Successfully renamed service from '{old_label}' to '{request.new_label}'",
            "service_key": request.service_key,
            "old_label": old_label,
            "new_label": request.new_label.strip()
        }
        
    except Exception as e:
        conn.rollback()
        conn.autocommit = True
        raise HTTPException(status_code=500, detail=f"Failed to rename service: {str(e)}")

class RestoreServiceRequest(BaseModel):
    service_key: str

class DeleteRemovedServiceRequest(BaseModel):
    service_key: str

class BulkAddServicesRequest(BaseModel):
    services: List[dict]

@arcgis_router.post("/services/restore")
def restore_service(request: RestoreServiceRequest):
    """Restore a service from removed_arcgis_services back to arcgis_services"""
    if cur is None or conn is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Start transaction
        conn.autocommit = False
        
        # Ensure removed_arcgis_services table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS removed_arcgis_services (
                id SERIAL PRIMARY KEY,
                service_key VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                folder VARCHAR(255) DEFAULT 'Root',
                type VARCHAR(50) NOT NULL,
                state VARCHAR(50) NOT NULL,
                removed_by VARCHAR(255),
                layers_removed TEXT[],
                removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_removed_service_per_state UNIQUE (service_key, state, type)
            )
        """)
        
        # First, get the service details from the removed table
        cur.execute("""
            SELECT service_key, label, url, folder, type, state 
            FROM removed_arcgis_services 
            WHERE service_key = %s
        """, (request.service_key,))
        
        service_row = cur.fetchone()
        if not service_row:
            conn.rollback()
            conn.autocommit = True
            raise HTTPException(status_code=404, detail="Removed service not found")
        
        service_key, label, url, folder, type_val, state = service_row
        
        # Check if service already exists in main table (to avoid duplicates)
        cur.execute("""
            SELECT COUNT(*) FROM arcgis_services 
            WHERE service_key = %s
        """, (service_key,))
        
        exists = cur.fetchone()[0] > 0
        if exists:
            conn.rollback()
            conn.autocommit = True
            raise HTTPException(status_code=409, detail="Service already exists in active services")
        
        # Insert back into main arcgis_services table
        cur.execute("""
            INSERT INTO arcgis_services 
            (service_key, label, url, folder, type, state)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            service_key,
            label, 
            url,
            folder,
            type_val,
            state
        ))
        
        # Remove from removed_arcgis_services table
        cur.execute("""
            DELETE FROM removed_arcgis_services 
            WHERE service_key = %s
        """, (request.service_key,))
        
        # Commit transaction
        conn.commit()
        conn.autocommit = True
        
        return {
            "success": True,
            "message": f"Service '{label}' restored to active services",
            "service_key": service_key
        }
        
    except Exception as e:
        conn.rollback()
        conn.autocommit = True
        raise HTTPException(status_code=500, detail=f"Failed to restore service: {str(e)}")

@arcgis_router.delete("/services/removed")
def permanently_delete_removed_service(request: DeleteRemovedServiceRequest):
    """Permanently delete a service from removed_arcgis_services"""
    if cur is None or conn is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Ensure removed_arcgis_services table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS removed_arcgis_services (
                id SERIAL PRIMARY KEY,
                service_key VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                folder VARCHAR(255) DEFAULT 'Root',
                type VARCHAR(50) NOT NULL,
                state VARCHAR(50) NOT NULL,
                removed_by VARCHAR(255),
                layers_removed TEXT[],
                removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_removed_service_per_state UNIQUE (service_key, state, type)
            )
        """)
        conn.commit()
        # Check if service exists in removed table
        cur.execute("""
            SELECT label FROM removed_arcgis_services 
            WHERE service_key = %s
        """, (request.service_key,))
        
        service_row = cur.fetchone()
        if not service_row:
            raise HTTPException(status_code=404, detail="Removed service not found")
        
        label = service_row[0]
        
        # Permanently delete from removed_arcgis_services table
        cur.execute("""
            DELETE FROM removed_arcgis_services 
            WHERE service_key = %s
        """, (request.service_key,))
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Service '{label}' permanently deleted",
            "service_key": request.service_key
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to permanently delete service: {str(e)}")

@arcgis_router.delete("/services/removed/all")
def clear_all_removed_services():
    """Permanently delete all services from removed_arcgis_services"""
    if cur is None or conn is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Ensure removed_arcgis_services table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS removed_arcgis_services (
                id SERIAL PRIMARY KEY,
                service_key VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                folder VARCHAR(255) DEFAULT 'Root',
                type VARCHAR(50) NOT NULL,
                state VARCHAR(50) NOT NULL,
                removed_by VARCHAR(255),
                layers_removed TEXT[],
                removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_removed_service_per_state UNIQUE (service_key, state, type)
            )
        """)
        conn.commit()
        # Get count before deletion
        cur.execute("SELECT COUNT(*) FROM removed_arcgis_services")
        count_before = cur.fetchone()[0]
        
        # Clear all removed services
        cur.execute("DELETE FROM removed_arcgis_services")
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"All {count_before} removed services permanently deleted",
            "count": count_before
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear all removed services: {str(e)}")

@arcgis_router.post("/services/bulk-add")
def bulk_add_services(request: BulkAddServicesRequest):
    """Add multiple new ArcGIS services to the database (skips existing ones by key)"""
    if cur is None or conn is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    if not request.services:
        return {"success": True, "added": 0, "skipped": 0, "message": "No services provided"}
    
    try:
        # Start transaction
        conn.autocommit = False
        
        added_count = 0
        skipped_count = 0
        
        for service in request.services:
            # Validate required fields
            required_fields = ['key', 'label', 'url', 'folder', 'type', 'state']
            if not all(field in service for field in required_fields):
                continue
            
            # Check if service already exists by key
            cur.execute("""
                SELECT COUNT(*) FROM arcgis_services 
                WHERE service_key = %s
            """, (service['key'],))
            
            exists = cur.fetchone()[0] > 0
            
            if not exists:
                # Insert new service
                cur.execute("""
                    INSERT INTO arcgis_services (service_key, label, url, folder, type, state)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    service['key'],
                    service['label'],
                    service['url'],
                    service['folder'],
                    service['type'],
                    service['state']
                ))
                added_count += 1
            else:
                skipped_count += 1
        
        # Commit transaction
        conn.commit()
        conn.autocommit = True
        
        return {
            "success": True,
            "added": added_count,
            "skipped": skipped_count,
            "total_processed": len(request.services),
            "message": f"Successfully added {added_count} new services, skipped {skipped_count} existing ones"
        }
        
    except Exception as e:
        conn.rollback()
        conn.autocommit = True
        raise HTTPException(status_code=500, detail=f"Failed to bulk add services: {str(e)}")