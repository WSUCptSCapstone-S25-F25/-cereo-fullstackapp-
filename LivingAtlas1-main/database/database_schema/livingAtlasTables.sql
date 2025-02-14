-- Living Atlas Database Schema 
-- WSU 421/423 Senior Design Project
-- Joshua Long, Mitchell Kolb, Sierra Svetlik
-- 1/11/23 - 12/10/23


CREATE TABLE Users (
    UserID INT,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    HashedPassword VARCHAR(255) NOT NULL,
    Salt BYTEA NOT NULL,
    Is_Admin BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (UserID)
);

CREATE TABLE SignupData (
    SignupID INT,
    Username VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Pass VARCHAR(255) NOT NULL,
    SponsorMessage TEXT,
    DesiresAdmin BOOLEAN NOT NULL
);


CREATE TABLE Categories (
    CategoryID INT,
    CategoryLabel VARCHAR(255) UNIQUE,
    PRIMARY KEY (CategoryID)
);


CREATE TABLE Cards (
    CardID INT,
    UserID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Latitude DECIMAL(10,8) NOT NULL,
    Longitude DECIMAL(11,8) NOT NULL,
    CategoryID INT NOT NULL,
    DatePosted DATE DEFAULT CURRENT_DATE,
    Description VARCHAR(2000),
    Organization VARCHAR(255),
    Funding VARCHAR(255),
    Link VARCHAR(255),
    PRIMARY KEY (CardID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);


CREATE TABLE Files (
    FileID INT,
    CardID INT NOT NULL,
    FileName VARCHAR(255),
    DirectoryPath VARCHAR(255),
    FileSize INT, --Store all file sizes in the type of bytes
    FileExtension VARCHAR(20),
    DateSubmitted DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (FileID),
    FOREIGN KEY (CardID) REFERENCES Cards(CardID)
);


CREATE TABLE Tags (
    TagID INT,
    TagLabel VARCHAR(255),
    PRIMARY KEY (TagID)
);


CREATE TABLE CardTags (
    CardID INT REFERENCES Cards(CardID),
    TagID INT REFERENCES Tags(TagID),
    PRIMARY KEY (CardID, TagID),
    FOREIGN KEY (CardID) REFERENCES Cards(CardID),
    FOREIGN KEY (TagID) REFERENCES Tags(TagID)
);





/*

|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
|- - - - - - - Normalization of this table schema - - - - - - - |
|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

1NF  -  First Normal Form 
1. Using row order to convey information is not permitted
2. Mixing data type within the same column is not permitted
3. Having a table without a primary key is not permitted
4. Repeating groups are not permitted 

	Rationale: Row order doesn't matter in users, card, categories, tags or file tables all needed info is its own attribute. All table attrbutes are of one single type. All tables contain a primary key. All table attrbiutes contain a single value and for instances where multiple associations are needed they are seperated to maintain induvidual relationships.


2NF  -  Second Normal Form
Each non-key attrbiute in the table must be dependant on the entire primary key.

	Rationale: This deals with having the table attributes being functionally dependant on the primary key and for Users all non-key attributes rely on the entire primary key. There are no partial dependencies in the tables. For instance, in the Cards table, Title, Longitude, Latitude, Category, DatePosted, Description, Organization, FundingAmount, Link are all functionally dependent on the primary key CardID, and there are no partial dependencies.


3NF or BNCF - Third Normal Form or Boyce Codd Normal Form 
Each attribute in the table must depend on the key, the whole key, and nothing but the key.

	Rationale: All the tables are in 3NF. This is because there are no transitive dependencies for non-primary-key attributes. For example, in the Cards table, Title, Longitude, Latitude, Category, DatePosted, Description, Organization, FundingAmount, Link are all functionally dependent on the primary key CardID, and there are no transitive dependencies between these attributes. All attributes rely entirely on the key induvidually. 


4NF  -   Fourth Normal Form
The only kinds of multivalued dependency allowed in a table are multivalued dependenices on the key.

	Rationale: The tables are split so their are no multivalued dependencies.


5NF  -   Fifth Normal Form 
It must not be possible to describe the table as being the logical result of joining some other tables together.
	
	Rationale: This schema cannot be subdivided into any smaller tables without losing some form of information. For example, the CardTags table is a junction table that links Cards and Tags. It cannot be further decomposed without losing information about which cards are associated with which tags.






|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
|- - - - - - - IMPROVMENTS that could be made - - - - - - - - - |
|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 

1.)- Ideas were given about seperating organizations in the card table so unqiue values are sorted out but since our database will never be used to filter cards by organizations that has been not implemented. 



2.)- For increased security we were considering adding a USER credentials table to seperate the salt and password attrbutes from the Users table that we query often to retrieve basic user account data. That table would've looked like this. 

CREATE TABLE UserCredentials (
    UserID INT NOT NULL,
    HashedPassword VARCHAR(255),
    Salt BYTEA,
    PRIMARY KEY (UserID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);



3.)- For more isolated cards data we were considering making the card relationship seperated. This is a more involved solution than that of imporvement #1 but the reasoning why we didn't go down this path was becuase we saw that complete normalization is not always beneficial. It can make some things more difficult, like joining tables back together for a query that relies on information in multiple tables. In this case when we call a entire card stack of information to fill the right side of the website. We think calling it from one table would be more effiecent in the long run and easier to maintain in the fastAPI backend codebase. Overal decisions about our schema design were made with future use in mind for not just our devleopment team but future devs teams as well.
If we did go down this path we thought seperating cards into tables like CardLinks, CardInformation, UserCards to show relationships and then within CardInformation we would have supplementary tables to furhter describe and hold data on the attrbiutes of organizations, funding, links, location into their own tables to retain uniqueness to save space. Below is an example of card files, one of the tables we would've added. 

CREATE TABLE CardLinks (
    CardID INT NOT NULL,
    FileID INT NOT NULL,
    DatePosted DATE DEFAULT CURRENT_DATE,
    DateSubmitted DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (CardID, FileID),
    FOREIGN KEY (CardID) REFERENCES Cards(CardID),
    FOREIGN KEY (FileID) REFERENCES Files(FileID)
);

CREATE TABLE CardInformation (
    CardID INT,
    Title VARCHAR(255) NOT NULL,
    Latitude DECIMAL(10,8) NOT NULL,
    Longitude DECIMAL(11,8) NOT NULL,
    CategoryID INT NOT NULL,
    DatePosted DATE DEFAULT CURRENT_DATE,
    Description VARCHAR(2000),
    Organization VARCHAR(255),
    Funding DECIMAL(10,2),
    Link VARCHAR(255),
    PRIMARY KEY (CardID),
    FOREIGN KEY (CardID) REFERENCES CardLinks(CardID)
);


4.)- We had this feature in mind to add in which would be a userType attribute to denote if a user account is basic or an admin or anything else to give them special buttons to click on the frontend.



5.)- This is minor thought but also we thought to create indexes for the queries that we use a lot like for the three main filters in categories. Our two database teamates at the time didn't know that much about indexes so we didn't use them. 

|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
| - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - |
|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -| 
*/