from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from database import cur

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