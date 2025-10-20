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