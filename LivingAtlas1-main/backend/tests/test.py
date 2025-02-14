
from fastapi.testclient import TestClient
from main import app # import your FastAPI application


client = TestClient(app)

def test_test_cate():
   response = client.get("/test_cate")
   assert response.status_code == 200
   assert response.json() == {"data": ["assa"]} # replace with expected response

"""
def test_upload_form_no_tags():
   response = client.post(
       "/uploadForm",
       data={
           "name": "Mitchell",
           "email": "mitchell.kolb@wsu.edu",
           "title": "No Tags",
           "tags": "",
           "link": "",
           "file": "",
           "description": "asd",
           "funding": "",
           "category": "River",
           "latitude": 46.88,
           "longitude": -117.68,
           "org": ""
       }
   )
   assert response.status_code == 200

def test_upload_form_one_tag():
   response = client.post(
       "/uploadForm",
       data={
           "name": "Mitchell",
           "email": "mitchell.kolb@wsu.edu",
           "title": "One Unique Tag",
           "tags": "yeller",
           "link": "",
           "file": "",
           "description": "asd",
           "funding": "",
           "category": "River",
           "latitude": 46.88,
           "longitude": -117.68,
           "org": ""
       }
   )
   assert response.status_code == 200

def test_upload_form_one_existing_tag():
  response = client.post(
      "/uploadForm",
      data={
          "name": "Mitchell",
          "email": "mitchell.kolb@wsu.edu",
          "title": "One existing Tag",
          "tags": "Eastern WA",
          "link": "",
          "file": "",
          "description": "asd",
          "funding": "",
          "category": "River",
          "latitude": 46.88,
          "longitude": -117.68,
          "org": ""
      }
  )
  assert response.status_code == 200

def test_upload_form_unique_then_existing_tag():
  response = client.post(
      "/uploadForm",
      data={
          "name": "Mitchell",
          "email": "mitchell.kolb@wsu.edu",
          "title": "Unique then Existing Tag",
          "tags": "TacoBell, Western WA",
          "link": "",
          "file": "",
          "description": "asd",
          "funding": "",
          "category": "River",
          "latitude": 46.88,
          "longitude": -117.68,
          "org": ""
      }
  )
  assert response.status_code == 200

def test_upload_form_existing_then_unique_tag():
  response = client.post(
      "/uploadForm",
      data={
          "name": "Mitchell",
          "email": "mitchell.kolb@wsu.edu",
          "title": "Existing Tag then Unique",
          "tags": "Western WA, Havok",
          "link": "",
          "file": "",
          "description": "asd",
          "funding": "",
          "category": "River",
          "latitude": 46.88,
          "longitude": -117.68,
          "org": ""
      }
  )
  assert response.status_code == 200

def test_upload_form_many_tags():
  response = client.post(
      "/uploadForm",
      data={
          "name": "Mitchell",
          "email": "mitchell.kolb@wsu.edu",
          "title": "Many Tags",
          "tags": "yeller, Dataset, NewTag,Havok,Smile,Water",
          "link": "",
          "file": "",
          "description": "asd",
          "funding": "",
          "category": "River",
          "latitude": 46.88,
          "longitude": -117.68,
          "org": ""
      }
  )
  assert response.status_code == 200


def test_test_cate():
   response = client.get("/test_cate")
   assert response.status_code == 200
   assert isinstance(response.json()["data"], list)


def test_profileAccount():
   response = client.get("/profileAccount", params={"email": "test@example.com", "password": "testpassword"})
   assert response.status_code == 200
   assert isinstance(response.json()["Account Information"], list)


def test_uploadAccount():
   response = client.post("/uploadAccount", data={"name": "test", "email": "test@example.com", "password": "testpassword"})
   assert response.status_code == 200
   assert response.json()["success"] == True


def test_profileCards():
   response = client.get("/profileCards", params={"username": "testuser"})
   assert response.status_code == 200
   assert isinstance(response.json()["data"], list)


def test_deleteCard():
   response = client.delete("/deleteCard", params={"username": "testuser", "title": "testtitle"})
   assert response.status_code == 200
   assert response.json()["data"] == "Card 'testtitle' is Deleted"

def test_allCards():
   response = client.get("/allCards")
   assert response.status_code == 200
   assert isinstance(response.json()["data"], list)


def test_uploadFile():
   file_path = "test_file.txt"
   with open(file_path, "w") as f:
       f.write("test content")

   with open(file_path, "rb") as f:
       response = client.post("/uploadFile", files={"file": f})

   assert response.status_code == 200
   assert response.json()["success"] == True

   os.remove(file_path)


def test_downloadFile():
   file_path = "test_file.txt"
   with open(file_path, "w") as f:
       f.write("test content")

   response = client.get(f"/downloadFile?fileTitle={file_path}")

   assert response.status_code == 200
   assert response.content == b"test content"

   os.remove(file_path)


def test_tagList():
  response = client.get("/tagList")
  assert response.status_code == 200
  assert isinstance(response.json()["tagList"], list)


def test_allCardsByTag():
  response = client.get("/allCardsByTag", params={"categoryString": "testcategory", "tagString": "testtag"})
  assert response.status_code == 200
  assert isinstance(response.json()["data"], list)


def test_searchBar():
  response = client.get("/searchBar", params={"titleSearch": "testtitle"})
  assert response.status_code == 200
  assert isinstance(response.json()["data"], list)


def test_getMarkers():
  response = client.get("/getMarkers")
  assert response.status_code == 200
  assert isinstance(response.json()["data"], list)


def test_updateBoundry():
  response = client.post("/updateBoundry", json={"NEpoint": {"lat": 1.0, "long": 1.0}, "SWpoint": {"lat": -1.0, "long": -1.0}})
  assert response.status_code == 200
  assert isinstance(response.json()["data"], list)

"""