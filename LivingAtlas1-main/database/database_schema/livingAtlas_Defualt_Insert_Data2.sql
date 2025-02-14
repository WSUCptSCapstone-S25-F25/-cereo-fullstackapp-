-- Living Atlas Database Defualt Insert Data
-- WSU 421/423 Senior Design Project
-- Joshua Long, Mitchell Kolb, Sierra Svetlik
-- 1/11/23 - 12/10/23


--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - Cards  - - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
INSERT INTO Cards (CardID, UserID, Title, Latitude, Longitude, CategoryID, Description, Organization, Link)
VALUES 
(13, 3, 'Current Washington Water Quality Assessment', 46.0832, -118.9480, 1, 'The current Water Quality Assessment (WQA) for Washington State', 'Department of Ecology State of Washington', 'https://ecology.wa.gov/Research-Data/Data-resources/Geographic-Information-Systems-GIS/Data'),
(14, 2, 'Lower Granite Dam', 46.66094, -117.42805, 3, 'The Lower Granite Dam is a run-of-the-river dam built by the U.S. Army Corps of Engineers for hydroelectricity. Local tribes have recommended the dam be decommissioned due to detrimental effects on fish populations.', 'U.S. Army Corps of Engineers', 'https://www.nww.usace.army.mil/Locations/District-Locks-and-Dams/Lower-Granite-Lock-and-Dam/'),
(15, 3, 'Fire Impacts to Water Quality', 46.7563, -117.2062, 2, 'This survey focuses on the need for tools to help with decision-making related to the impact of fire on water management resources. It was created as part of a project funded by NASA, and this summary was created by Julie C. Padowski, the Co-Director nad a research associate professor at the School of the Environment at Washington State University.', 'CEREO', 'https://s3.wp.wsu.edu/uploads/sites/2965/2021/09/SurveySummary_Final.pdf'),
(16, 2, 'Moses Lake Water Quality', 47.1355, -119.3489, 1, 'This report looks at the effects of the dilution of the water of the Columbia river on the water quality of Moses lake. It was written by Eugene B. Welch, a professor at the University of Washington.', 'Moses Lake Irrigation and Rehabilitation District', 'https://www.mlird.org/docs/2022_report.pdf'),
(17, 4, 'Chinook Salmon Spawning Estimates Upstream of the Grand Coulee Dam', 47.96562, -118.97661, 1, 'Unfortanutely for the people who relied on the Chinook salmon for food, the construction of the Coulee dam (and later the Chief Joseph dam) prevented much of the ability of the salmon to reproduce. This report looks at the feasability of reintroducing salmon to the area.', NULL, 'https://bioone.org/journals/northwest-science/volume-94/issue-2/046.094.0201/Estimates-of-Chinook-Salmon-Spawning-Habitat-in-a-Blocked-Reach/10.3955/046.094.0201.full'),
(18, 2, 'Spokane Valley Rathdrum Praire Aquifer', 47.7, 117, 3, 'The Spokane Valley Rathdrum Praire Aquifer is a major water source for people in Spokane, and is part of the Columbia River drainage basin. The Spokane river is also connected to the aquifer.', NULL, NULL),
(19, 3, 'Walla Walla Sewage Treatment Plant', 46.03, -118.33, 3, 'One of the many facilities helping manage the treatment and reclamation of waste water as part of the Department of Healths Water Reclamation and Reuse program', 'Department of Health', 'https://doh.wa.gov/community-and-environment/wastewater-management/water-reclamation'),
(20, 3, 'King County-Brightwater Waste Water Treatment Plant', 47.79, -122.14, 3, 'One of the many facilities helping manage the treatment and reclamation of waste water as part of the Department of Healths Water Reclamation and Reuse program', 'Department of Health', 'https://doh.wa.gov/community-and-environment/wastewater-management/water-reclamation'),
(21, 2, 'Baker Lake', 48.69, -121.67, 3, 'Located at the foot of Mount Baker, part of the Cascades, a previously smaller lake, Baker Lake is largely formed by the Upper Baker Dam, which taps into the potential for hydroelectric power from the rivers of the Cascades.', NULL, NULL),
(22, 4, 'Long-term hydrologic recovery post-fire in interior Pacific Northwest', 47.93, -120.45, 2, 'This study looks at the long-term effects of increasing wildfire frequency on annual discharge, peak flows, low flows, and evapotranspiration.', 'National Institute of Food and Agriculture', 'https://onlinelibrary.wiley.com/doi/full/10.1002/hyp.13665');





--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - Files  - - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
INSERT INTO Files (FileID, CardID, FileName, DirectoryPath, FileSize, FileExtension)
VALUES 
    (8, 13, 'WQ_ENV_WQAssessmentCurrent', 'WQ_ENV_WQAssessmentCurrent.zip', 49707364, 'ZIP');




--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - Tags - - - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
INSERT INTO Tags (TagID, TagLabel)
VALUES 
    (11, 'Water Quality'),
    (12, 'CEREO');



--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - - - - - - - - - - - - CardTags - - - - - - - - - - - - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
INSERT INTO CardTags (CardID, TagID)
VALUES 
    (13, 4), -- Department of Ecology
    (13, 6), -- Files Attached
    (13, 11), -- Water Quality
    (14, 10), -- Eastern WA
    (15, 11), -- Water Quality
    (15, 12), -- CEREO
    (16, 10), -- Eastern WA
    (16, 11), -- Water Quality
    (17, 8), -- Species
    (17, 10), -- Eastern WA
    (18, 10), -- Eastern WA
    (19, 10), -- Eastern WA
    (20, 10), -- Western WA
    (21, 10), -- Western WA
    (22, 11); -- Water Quality




--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
--|- - - To Delete the Table Data, Delete them in this order  - - |
--|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

/*DELETE FROM CardTags;
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
DROP TABLE IF EXISTS Categories;*/
--DROP TABLE IF EXISTS Users; --Don't drop unless you are prepared, SALT is difficult to deal with


