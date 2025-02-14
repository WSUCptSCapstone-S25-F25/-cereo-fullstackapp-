-- Living Atlas Database Defualt Insert Data
-- WSU 421/423 Senior Design Project
-- Joshua Long, Mitchell Kolb, Sierra Svetlik
-- 1/11/23 - 12/10/23




--To insert Cards you need to have Categories and Users set up to associate with each card
--After cards are inserted you can add in files and custom tags




--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - Categories - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
--Categories are preset by the client to be these three options

INSERT INTO Categories (CategoryID, CategoryLabel)
VALUES
    (1, 'River'),
    (2, 'Watershed'),
    (3, 'Places');




--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - Users  - - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
/*
--Because SALT in the users table is of type Bytea, we found out it is difficult to insert data into the table directly. We found it easier to use this fastAPI endpoint found at the bottom of this comment block to insert the data. We tried to insert the data as shown below but the salt attribute wouldn't allow it, so we used the endpoint instead. Don't drop the Users table unless you are prepared to add the data back in the hard way.

-- User "a" is intended to be used to quickly log into the account to test front end verification systems. 
-- NOTE: these accounts are made on 10/14/23 so if the pepper changes for any reason on the backend the salt and hashedpasswords become unusable.
-- passwords for each of the four accounts is the username lowercase: a, josh, sierra, mitchell

INSERT INTO Users (UserID, Username, Email, HashedPassword, Salt)
VALUES 
    (1, 'a', '0e71a33a60a27f91c9e8213446c69fa14d99d4592025e1e17ab1d9d04627892b', 'a@a.com', b'dx\rf\xcf\x9aHz&\x90\xde\x00\x85\xdf\x9a=\xb3\x95M\x06\xeb=yC\xc2b\xdf\xe7\x8fh\x94\xc3'),
    (2, 'Josh', 'joshua.long@wsu.edu', 'f29f0b5756dfd9a9ac509d10fde2f5c33ab334b603200fb14462a20e4e2f450a', b'A\x19\x98\xa4\n\xf2K\x91\x1f\xec-C\xd4\x8b\xa0b\x97g\xb1\x04\xc3\x1f\x92P!@\xd9h\x93\xc8E\xea'),
    (3, 'Sierra', 'sierra.svetlik@wsu.edu', 'af1e86f22a300e218675368821ff99058c3b8c9d73ddd78c59275c52e23fc95c', b'>\xdd\x07\x85\xe2\x8a\xdao\xb9v\xea\x82\xa3\xe0\xa7B\xac\t\xe2\x83e\xfb\xfc\xb3\xf2\xe7-p\xd2\xb6\x9b['),
    (4, 'Mitchell', 'mitchell.kolb@wsu.edu', '4edd9e133510364664db4130d444d6520352cd37dec54fee8531d76551a79c52', b'\x96\xa4\x96u\x12\xcf\xeb\x13\x01\xe4\x95:\xdf1\xf8d3\xf1\xfe\xf1@\x16\xae\x87\xb0\x1d\xc1\xe5\xd8\x8d\xdb\x08');


@app.post("/registerAccount")
async def registerAccount(
    name: str = Form(None),
    email: str = Form(None),
    password: str = Form(None)
):
    cur.execute(f"SELECT COUNT(userid) FROM users")
    rows = cur.fetchall()
    userid = rows[0][0] + 1
    salt = os.urandom(32)
    hashpass = hashlib.sha256(bytes(password, 'utf-8') + salt + bytes("xe5Dx93xefx16x9ax12wy", 'utf-8')).hexdigest()
    print(f"({userid}, '{name}', '{email}', '{hashpass}', {salt}),")
    cur.execute("INSERT INTO users (userid, username, hashedpassword, email, salt) VALUES (%s, %s, %s, %s, %s)", ((userid, name, hashpass, email, salt)))
    conn.commit()
    return {"success": True, "message": "New account added successfully"}


*/





--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - Cards  - - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

-- Test Fake data
INSERT INTO Cards (CardID, UserID, Title, Latitude, Longitude, CategoryID, Description, Organization, Funding, Link)
VALUES 
    (1, 1, 'First Card', 46.86600733, -116.9262192, 1, 'Card 1 Description: This card is the first out of the four test cards that are added. It is intended to test if cards are loaded in the correct order', 'Organization 1', 1000.00, 'https://www.firstcard.com'),
    (2, 1, 'Minimum Card', 46.80635222, -116.92814864, 1, NULL, NULL, NULL, NULL),
    (3, 1, 'Maximum Card', 46.80805652, -116.82839737, 1, 'Card 3 Description: This card has every available table attribute filled with some value. The funding is the max value it can be, the minimum is 0.01', 'Maximum Org.',  99999999.99, 'https://www.maximumcard.com'),
    (4, 1, 'Picture Card', 46.83982891, -116.87543259, 1, 'Picture Card Description: This card has a file attached to it taken from the CEREO website. It is intended to test out the file features on the Living Atlas website', NULL, NULL, NULL),
    (5, 1, 'Last Card', 46.86776776, -116.83028716, 1, 'Card 4 Description: This card is the last out of the four test cards that are added. It is intended to test if cards are loaded in the correct order', 'Organization 4', 3000.00, 'https://www.lastcard.com');


--Test Real Data
INSERT INTO Cards (CardID, UserID, Title, Latitude, Longitude, CategoryID, Description, Organization, Link)
VALUES 
(6, 2, 'National Hydrography Dataset 4k', 47.223254, -120.067632, 1, 'The National Hydrography Dataset (NHD) is a comprehensive dataset that represents the surface water of the United States using features such as: Streams, Rivers, Lakes, Ponds, Reservoirs, Swamp/Marsh, Canals, Coastline, Glaciers. The NHD also contains a unique identification system and geometric network and by using attributes such as these, observational data such as outfall locations, fish populations, and water quality, can be linked to the NHD framework. By utilizing the unique attributes and network of the NHD, it is possible to study spatial relationships, such as how a toxic spill upstream might affect a fish population or drinking water downstream. It was originally published in July 2021.', 'Department of Ecology State of Washington', 'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(7, 2, 'Puget Sound Watershed WRIA 1', 48.794383, -122.467722, 2, 'Watershed characterization for the Puget Sound drainage basins', 'Department of Ecology State of Washington',  'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(8, 3, 'Puget Sound Watershed WRIA 8', 47.65455, -122.25742, 2, 'Watershed characterization for the Puget Sound drainage basins', 'Department of Ecology State of Washington',  'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(9, 3, 'WSU CEREO Building', 46.7294834, -117.1546756, 3, 'The Center for Environmental Research, Education, and Outreach (CEREO) is a progressive network of more than 350 faculty, staff, students, and industry leaders working to resolve environmental issues through collaborative partnerships. Guided by a roster of distinguished scientists, CEREO seeks to apply innovative technologies and management tools to the ever-growing challenges of global climate change and environmental sustainability. You can find the CEREO team at: PACCAR Room 242 Washington State University', 'WSU', 'https://cereo.wsu.edu/'),
(10, 4, 'Spokane Tribe', 47.980600, -118.204580, 3, 'The Spokane Tribe of Indians ancestors inhabited much of northeastern Washington which consisted of approximately 3 million acres. At times they extended their hunting, fishing, and gathering grounds into Idaho and Montana.', 'Spokane Tribe Org.', 'https://www.spokanetribe.com/'),
(11, 4, 'Invasive Species Areas of Extreme Concern', 46.198436, -123.374856, 3, 'Areas where field gear decontamination is required to avoid spreading invasive species - 3 layers: Streams, Rivers, Watersheds. File attached is a zip that contains spatial data and a jpeg of the monitored areas.', 'Department of Ecology State of Washington', 'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(12, 4, 'Puget Sound Watershed WRIA 10', 47.244223, -122.334931, 2, 'Watershed characterization for the Puget Sound drainage basins', 'Department of Ecology State of Washington',  'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data');





--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - Files  - - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

--Test Fake data
INSERT INTO Files (FileID, CardID, FileName, DirectoryPath, FileSize, FileExtension)
VALUES 
    (1, 3, 'maximum_text_file', 'maximum_text_file.txt', 59, 'TXT'),
    (2, 4, 'pictureCard_fakeData', 'pictureCard_fakeData.PNG', 2622954, 'PNG');

--Test Real Data
INSERT INTO Files (FileID, CardID, FileName, DirectoryPath, FileSize, FileExtension)
VALUES 
    (3, 6, 'NHD_files', 'NHD_files.zip', 1262563, 'ZIP'),
    (4, 7, 'SEA_ENV_PSWSCWaterAssess_WRIA01', 'SEA_ENV_PSWSCWaterAssess_WRIA01.jpg', 329564, 'JPG'),
    (5, 8, 'SEA_ENV_PSWSCWaterAssess_WRIA08', 'SEA_ENV_PSWSCWaterAssess_WRIA08.jpg', 314474, 'JPG'),
    (6, 11, 'EAP_ENV_ExtremeConcern.gdb', 'EAP_ENV_ExtremeConcern.gdb.zip', 3100064, 'ZIP'),
    (7, 12, 'SEA_ENV_PSWSCWaterAssess_WRIA10', 'SEA_ENV_PSWSCWaterAssess_WRIA10.jpg', 346301, 'JPG');




--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - Tags - - - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

INSERT INTO Tags (TagID, TagLabel)
VALUES 
    (1, 'TestLabel_FakeData'),
    (2, 'TestLabel_RealData'),
    (3, 'Dataset'),
    (4, 'Department of Ecology'),
    (5, 'Native Americans'),
    (6, 'Files Attached'),
    (7, 'WRIA'),
    (8, 'Species'),
    (9, 'Western WA'),
    (10, 'Eastern WA');


--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - CardTags - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

--Test Fake data
INSERT INTO CardTags (CardID, TagID)
VALUES 
    (1, 1), -- TestLabel_FakeData
    (2, 1), -- TestLabel_FakeData
    (3, 1), -- TestLabel_FakeData
    (4, 1), -- TestLabel_FakeData
    (4, 6), -- Files Attached
    (5, 1); -- TestLabel_FakeData

--Test Real Data
INSERT INTO CardTags (CardID, TagID)
VALUES 
    (6, 2), -- TestLabel_RealData
    (6, 3), -- Dataset
    (6, 4), -- Department of Ecology
    (6, 6), -- Files Attached
    (6, 9), -- Western WA
    (6, 10), -- Eastern WA
    (7, 2), -- TestLabel_RealData
    (7, 4), -- Department of Ecology
    (7, 6), -- Files Attached
    (7, 7), -- WIRA
    (7, 9), -- Western WA
    (8, 2), -- TestLabel_RealData
    (8, 4), -- Department of Ecology
    (8, 6), -- Files Attached
    (8, 7), -- WIRA
    (8, 9), -- Western WA
    (9, 2), -- TestLabel_RealData
    (9, 10), -- Eastern WA
    (10, 2), -- TestLabel_RealData
    (10, 5), -- Native Americans
    (10, 10), -- Eastern WA
    (11, 2), -- TestLabel_RealData
    (11, 3), -- Dataset
    (11, 4), -- Department of Ecology
    (11, 6), -- Files Attached
    (11, 8), -- Species
    (11, 9), -- Western WA
    (12, 2), -- TestLabel_RealData
    (12, 4), -- Department of Ecology
    (12, 6), -- Files Attached
    (12, 7), -- WIRA
    (12, 9); -- Western WA




--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - To Delete the Table Data, Delete them in this order  - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

DELETE FROM CardTags;
DELETE FROM Tags;
DELETE FROM Files;
DELETE FROM Cards;
DELETE FROM Categories;


--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - To Drop the Tables, Drop them in this order  - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

DROP TABLE IF EXISTS CardTags;
DROP TABLE IF EXISTS Tags;
DROP TABLE IF EXISTS Files;
DROP TABLE IF EXISTS Cards;
DROP TABLE IF EXISTS Categories;
--DROP TABLE IF EXISTS Users; --Don't drop unless you are prepared, SALT is difficult to deal with



/*
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - Only Test Data Insert Statements - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

--|- - - - - - - - - - - - - Categories - - - - - - - - - - - - - |
INSERT INTO Categories (CategoryID, CategoryLabel)
VALUES
    (1, 'River'),
    (2, 'Watershed'),
    (3, 'Places');

--|- - - - - - - - - - - - - - Cards  - - - - - - - - - - - - - - |
INSERT INTO Cards (CardID, UserID, Title, Latitude, Longitude, CategoryID, Description, Organization, Funding, Link)
VALUES 
    (1, 1, 'First Card', 46.86600733, -116.9262192, 1, 'Card 1 Description: This card is the first out of the four test cards that are added. It is intended to test if cards are loaded in the correct order', 'Organization 1', 1000.00, 'https://www.firstcard.com'),
    (2, 1, 'Minimum Card', 46.80635222, -116.92814864, 1, NULL, NULL, NULL, NULL),
    (3, 1, 'Maximum Card', 46.80805652, -116.82839737, 1, 'Card 3 Description: This card has every available table attribute filled with some value. The funding is the max value it can be, the minimum is 0.01', 'Maximum Org.',  99999999.99, 'https://www.maximumcard.com'),
    (4, 1, 'Picture Card', 46.83982891, -116.87543259, 1, 'Picture Card Description: This card has a file attached to it taken from the CEREO website. It is intended to test out the file features on the Living Atlas website', NULL, NULL, NULL),
    (5, 1, 'Last Card', 46.86776776, -116.83028716, 1, 'Card 4 Description: This card is the last out of the four test cards that are added. It is intended to test if cards are loaded in the correct order', 'Organization 4', 3000.00, 'https://www.lastcard.com');

--|- - - - - - - - - - - - - - Files  - - - - - - - - - - - - - - |
INSERT INTO Files (FileID, CardID, FileName, DirectoryPath, FileSize, FileExtension)
VALUES 
    (1, 3, 'maximum_text_file', 'maximum_text_file.txt', 59, 'TXT'),
    (2, 4, 'pictureCard_fakeData', 'pictureCard_fakeData.PNG', 2622954, 'PNG');

--|- - - - - - - - - - - - - - Tags - - - - - - - - - - - - - - - |
INSERT INTO Tags (TagID, TagLabel)
VALUES 
    (1, 'TestLabel_FakeData'),
    (2, 'TestLabel_RealData'),
    (3, 'Dataset'),
    (4, 'Department of Ecology'),
    (5, 'Native Americans'),
    (6, 'Files Attached'),
    (7, 'WIRA'),
    (8, 'Species'),
    (9, 'Western WA'),
    (10, 'Eastern WA');

--|- - - - - - - - - - - - - - CardTags - - - - - - - - - - - - - |
INSERT INTO CardTags (CardID, TagID)
VALUES 
    (1, 1), -- TestLabel_FakeData
    (2, 1), -- TestLabel_FakeData
    (3, 1), -- TestLabel_FakeData
    (4, 1), -- TestLabel_FakeData
    (4, 6), -- Files Attached
    (5, 1); -- TestLabel_FakeData










--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - Only Real Data Insert Statements - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
--         Only Use after you have inserted the data above

--|- - - - - - - - - - - - - - Cards  - - - - - - - - - - - - - - |
INSERT INTO Cards (CardID, UserID, Title, Latitude, Longitude, CategoryID, Description, Organization, Link)
VALUES 
(6, 2, 'National Hydrography Dataset 4k', 47.223254, -120.067632, 1, 'The National Hydrography Dataset (NHD) is a comprehensive dataset that represents the surface water of the United States using features such as: Streams, Rivers, Lakes, Ponds, Reservoirs, Swamp/Marsh, Canals, Coastline, Glaciers. The NHD also contains a unique identification system and geometric network and by using attributes such as these, observational data such as outfall locations, fish populations, and water quality, can be linked to the NHD framework. By utilizing the unique attributes and network of the NHD, it is possible to study spatial relationships, such as how a toxic spill upstream might affect a fish population or drinking water downstream. It was originally published in July 2021.', 'Department of Ecology State of Washington', 'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(7, 2, 'Puget Sound Watershed WRIA 1', 48.794383, -122.467722, 2, 'Watershed characterization for the Puget Sound drainage basins', 'Department of Ecology State of Washington',  'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(8, 3, 'Puget Sound Watershed WRIA 8', 47.65455, -122.25742, 2, 'Watershed characterization for the Puget Sound drainage basins', 'Department of Ecology State of Washington',  'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(9, 3, 'WSU CEREO Building', 46.7294834, -117.1546756, 3, 'The Center for Environmental Research, Education, and Outreach (CEREO) is a progressive network of more than 350 faculty, staff, students, and industry leaders working to resolve environmental issues through collaborative partnerships. Guided by a roster of distinguished scientists, CEREO seeks to apply innovative technologies and management tools to the ever-growing challenges of global climate change and environmental sustainability. You can find the CEREO team at: PACCAR Room 242 Washington State University', 'WSU', 'https://cereo.wsu.edu/'),
(10, 4, 'Spokane Tribe', 47.980600, -118.204580, 3, 'The Spokane Tribe of Indians ancestors inhabited much of northeastern Washington which consisted of approximately 3 million acres. At times they extended their hunting, fishing, and gathering grounds into Idaho and Montana.', 'Spokane Tribe Org.', 'https://www.spokanetribe.com/'),
(11, 4, 'Invasive Species Areas of Extreme Concern', 46.198436, -123.374856, 3, 'Areas where field gear decontamination is required to avoid spreading invasive species - 3 layers: Streams, Rivers, Watersheds. File attached is a zip that contains spatial data and a jpeg of the monitored areas.', 'Department of Ecology State of Washington', 'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(12, 4, 'Puget Sound Watershed WRIA 10', 47.244223, -122.334931, 2, 'Watershed characterization for the Puget Sound drainage basins', 'Department of Ecology State of Washington',  'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data');

--|- - - - - - - - - - - - - - Files  - - - - - - - - - - - - - - |
INSERT INTO Files (FileID, CardID, FileName, DirectoryPath, FileSize, FileExtension)
VALUES 
    (3, 6, 'NHD_files', 'NHD_files.zip', 1262563, 'ZIP'),
    (4, 7, 'SEA_ENV_PSWSCWaterAssess_WRIA01', 'SEA_ENV_PSWSCWaterAssess_WRIA01.jpg', 329564, 'JPG'),
    (5, 8, 'SEA_ENV_PSWSCWaterAssess_WRIA08', 'SEA_ENV_PSWSCWaterAssess_WRIA08.jpg', 314474, 'JPG'),
    (6, 11, 'EAP_ENV_ExtremeConcern.gdb', 'EAP_ENV_ExtremeConcern.gdb.zip', 3100064, 'ZIP'),
    (7, 12, 'SEA_ENV_PSWSCWaterAssess_WRIA10', 'SEA_ENV_PSWSCWaterAssess_WRIA10.jpg', 346301, 'JPG');

--|- - - - - - - - - - - - - - CardTags - - - - - - - - - - - - - |
INSERT INTO CardTags (CardID, TagID)
VALUES 
    (6, 2), -- TestLabel_RealData
    (6, 3), -- Dataset
    (6, 4), -- Department of Ecology
    (6, 6), -- Files Attached
    (6, 9), -- Western WA
    (6, 10), -- Eastern WA
    (7, 2), -- TestLabel_RealData
    (7, 4), -- Department of Ecology
    (7, 6), -- Files Attached
    (7, 7), -- WIRA
    (7, 9), -- Western WA
    (8, 2), -- TestLabel_RealData
    (8, 4), -- Department of Ecology
    (8, 6), -- Files Attached
    (8, 7), -- WIRA
    (8, 9), -- Western WA
    (9, 2), -- TestLabel_RealData
    (9, 10), -- Eastern WA
    (10, 2), -- TestLabel_RealData
    (10, 5), -- Native Americans
    (10, 10), -- Eastern WA
    (11, 2), -- TestLabel_RealData
    (11, 3), -- Dataset
    (11, 4), -- Department of Ecology
    (11, 6), -- Files Attached
    (11, 8), -- Species
    (11, 9), -- Western WA
    (12, 2), -- TestLabel_RealData
    (12, 4), -- Department of Ecology
    (12, 6), -- Files Attached
    (12, 7), -- WIRA
    (12, 9); -- Western WA





*/