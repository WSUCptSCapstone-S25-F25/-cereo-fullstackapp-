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
            removed_date,
            removed_by,
            layers_removed
        FROM removed_arcgis_services
        {where_sql}
        ORDER BY removed_date DESC
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