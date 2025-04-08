from google.cloud import storage
import os

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'ServiceKey_GoogleCloud.json'

bucket_name = "cereo_atlas_storage"
storage_client = storage.Client()
bucket = storage_client.bucket(bucket_name)

def upload_default_logo():
    blob = bucket.blob("thumbnails/default_cereo_thumbnail.png")
    with open("default_cereo_thumbnail.png", "rb") as img:
        blob.upload_from_file(img, content_type="image/png")
    blob.make_public()
    print("Default logo uploaded. URL:")
    print(blob.public_url)

upload_default_logo()