

"""
-- Living Atlas Backend
-- WSU 421/423 Senior Design Project
-- Joshua Long, Mitchell Kolb (Author of Backend), Sierra Svetlik
-- 1/11/23 - 12/10/23
"""
import os
import json
# from google.cloud import storage
# import base64

# Decode base64 service account key from environment variable
# COMMENT OUT IF RUNNING LOCALLY
gcs_key = os.environ.get("GOOGLE_CREDENTIALS_BASE64")
if gcs_key:
    with open("temp_service_key.json", "wb") as f:
        f.write(base64.b64decode(gcs_key))
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'temp_service_key.json'
else:
    raise Exception("Missing GOOGLE_CREDENTIALS_BASE64 environment variable")
# _______________________________________

# COMMENT OUT IF RUNNING ON RENDER
# os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "ServiceKey_GoogleCloud.json"
# client = storage.Client()
# _______________________________________

#importing libraries for the backend
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware




#importing functions from other files
from database import conn, cur
from endpoint_files import account_router
from endpoint_files import card_router
from endpoint_files import filterbar_router
from endpoint_files import map_router




#mkGoogleStorageV2
app = FastAPI(title="Living Atlas Backend")





#CORSMiddleware allows requests to be made from a differenet ip, domain name, or port.
origins = [
    "http://localhost:3000",
    "localhost:3000",
    "http://verdant-smakager-ef450d.netlify.app",
    "https://verdant-smakager-ef450d.netlify.app",
    "https://65458b6817130a911cac80a9--verdant-smakager-ef450d.netlify.app",
    "https://65459daee8a10b1fed3df76c--resonant-basbousa-1a5433.netlify.app",
    "https://67f74e0aa010dfc87b1e32f0--willowy-twilight-157839.netlify.app",
    "https://willowy-twilight-157839.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)





#Inital Endpoints
@app.get("/")
def index():
    return {"Default": "Data For Living Atlas"}


@app.get("/test_cate")
def test_cate():
    cur.execute("SELECT * FROM categories")
    rows = cur.fetchall()
    return {"data": rows}





#Calling for the importing of endpoints from other files
app.include_router(account_router)
app.include_router(card_router)
app.include_router(filterbar_router)
app.include_router(map_router)




@app.on_event("shutdown")
def shutdown_event():
    cur.close()
    conn.close()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render sets this PORT automatically
    uvicorn.run(app, host="0.0.0.0", port=port)

"""
Index
test cate
"""