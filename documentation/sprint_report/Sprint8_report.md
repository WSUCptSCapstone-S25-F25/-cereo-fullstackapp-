# Sprint 8 Report (11/9/2025 - 12/6/2025)
 * [Sprint Demo Video (Created with a Video Editing Tool)](https://www.youtube.com/watch?v=tuPV26ekDX4)
 * [Sprint Demo Video (Recorded Live Demo Version)](https://www.youtube.com/watch?v=rPPysoUJIcI&feature=youtu.be)

## What's New (User Facing)
 * Added the ability to restore or permanently delete removed GIS services.
 * Added a search function for removed GIS services.
 * Added a Closest To Pin function to allow sorting based on proximity to any location.
 * Made renaming and removing GIS services admin-only.
 * Added a removed GIS services button on the left sidebar.
 * UI updates including moving sorting and filtering functionality to layers panel, and a redone profile menu.
 * Bug fix that speeds up card loading speeds by eliminating a point where cards need to re-render.
 * Bug fix that allows users to be deleted from the admin page again.
 * Bug fix that allows removed GIS services to be restored again and non-removed GIS services to be removed again.
 * Bug fix that fixes sorting and filtering functions.
 * Various other minor bug fixes.

## Work Summary (Developer Facing)
This sprint mainly focused on bug fixes as the goal was to deliver a working final product for the end of the development cycle. Yaru mainly worked on the GIS services panel, which included new features for the removed services section as well as bug fixes for GIS service features already implemented in previous sprints. Zachary worked on updating the UI of the profile menu, as well as bug fixes related to users on the admin page and card rendering. Jonathan worked on improvements to the sorting function, namely adding Closest to Pin sorting, as well as fixing bugs and updating the UI of the sorting function. Our biggest challenge for this sprint was pivoting from focusing on new features to focusing on fixing already existing features. Our goal was still to create the most feature-rich application possible, but we also needed to keep in mind the time limitations present and so reliability of existing features needed to be prioritized with that limited time.

## Unfinished Work
 * There is more work to be done to improve the performance of the application. This could involve making rendering cards more efficient or upgrading the backend.
 * There is work to be done with app security and data integrity. A 2-factor authentication system needs to be implemented, and user data should be encrypted.
 * More ArcGIS service types besides only MapServer should be supported, for example, FeatureServer support would allow for more interactivity.
 * An in-app tutorial should be added to teach new users how to use the more complicated features of the app, namely the GIS services tab.
 * More accessibility features should be added to the map in order to comply with the UPPM 10.45 and USER-01 Accessibility Policy.
 * The tag search and location search bars should be combined into one search function to reduce confusion.

## Completed Issues/User Stories
Here are links to the issues that we completed in this sprint:
 * [Fix Sublayer Displaying Issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/116)
 * [Completely fix page redirecting issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/120)
 * [Admin page goes blank after deleting a user](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/131)
 * [Complete Removed Services Panel](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/137)
 * [Make editing and removing services features admin-only](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/139)
 * [Fix service restoring failure issue in removed services panel](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/142)
 * [Fix service removing failure issue in upload panel](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/143)
 * [Add Closest To Pin sort function](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/151)
 * [Improve duplicate services handling of upload panel and removed services panel](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/154)
 
 ## Incomplete Issues/User Stories
 Here are links to issues we worked on but did not complete in this sprint:
 * [Improve performance and loading times](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/63) << We prioritized other tasks and ran out of time. >>
 * [Improve App Security and Data Integrity](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/79) << We prioritized other tasks and ran out of time. >>
 * [Refine Search Modal](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/85) << We prioritized other tasks and ran out of time. >>
 * [Fix cards loading with mismatched fields](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/106) << We spent a lot of development time looking into this bug, and could not find the cause. >>
 * [Move search button to the right sidebar and build new search button](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/113) << We prioritized other tasks and ran out of time. >>
 * [Update Documentation for Editing local ArcGIS data](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/118) << We wanted to focus on updates to the application over documentation. >>
 * [Handle more types of ArcGIS Services](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/119) << This was not as important as other tasks and we ran out of time. >>
 * [Move Favorite Button on Profile page](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/149) << This was a minor UI update added late in development, and we ran out of time prioritizing other issues. >>
 * [Fix Admin page Again](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/150) << This was a minor bug fix added late in development, and we ran out of time. >>

## Code Files for Review
Please review the following code files, which were actively developed during this sprint, for quality:
 * [RemovedServicesPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/c36a6eec2ed7eecf91383b2ec81f37254f7c7798/LivingAtlas1-main/client/src/RemovedServicesPanel.css)
 * [RemovedServicesPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/c36a6eec2ed7eecf91383b2ec81f37254f7c7798/LivingAtlas1-main/client/src/RemovedServicesPanel.js)
 * [arcgisServicesDb.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/c36a6eec2ed7eecf91383b2ec81f37254f7c7798/LivingAtlas1-main/client/src/arcgisServicesDb.js)
 * [arcgis.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/08099d9b40033e9caf9384c6eccf0b4d0cf4f513/LivingAtlas1-main/backend/endpoint_files/arcgis.py)
 * [Content2.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/0eb1c8ddd4a5e45cfcb84f5d2d7827a8060ce7e4/LivingAtlas1-main/client/src/Content2.css)
 * [Content2.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f46e325bbed796f1d6267e822f4ffeea131a2f9c/LivingAtlas1-main/client/src/Content2.js)
 * [Profile.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/0eb1c8ddd4a5e45cfcb84f5d2d7827a8060ce7e4/LivingAtlas1-main/client/src/Profile.css)
 * [Profile.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/0eb1c8ddd4a5e45cfcb84f5d2d7827a8060ce7e4/LivingAtlas1-main/client/src/Profile.js)
 * [create_arcgis_services_table.sql](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/ee5306d7724ef2df3d60a16f8a64d4895b04cb96/LivingAtlas1-main/backend/create_arcgis_services_table.sql)
 * [ArcgisUploadPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/ee5306d7724ef2df3d60a16f8a64d4895b04cb96/LivingAtlas1-main/client/src/ArcgisUploadPanel.js)
 * [ArcgisUploadPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/e49045a195532b94b500d4fa2bb126034ecf58fe/LivingAtlas1-main/client/src/ArcgisUploadPanel.css)
 * [ArcgisUploadPanelStateMenu.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/ee5306d7724ef2df3d60a16f8a64d4895b04cb96/LivingAtlas1-main/client/src/ArcgisUploadPanelStateMenu.css)
 * [ArcgisRenameItem.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/e49045a195532b94b500d4fa2bb126034ecf58fe/LivingAtlas1-main/client/src/ArcgisRenameItem.css)
 * [Home.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/61203e2248041ad7b4b0beb4a2a6488eed5adb4b/LivingAtlas1-main/client/src/Home.js)
 * [Sidebars.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/61203e2248041ad7b4b0beb4a2a6488eed5adb4b/LivingAtlas1-main/client/src/Sidebars.css)
 * [filterbar.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f46e325bbed796f1d6267e822f4ffeea131a2f9c/LivingAtlas1-main/backend/endpoint_files/filterbar.py)
 * [Card.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f46e325bbed796f1d6267e822f4ffeea131a2f9c/LivingAtlas1-main/client/src/Card.js)
 * [Content1.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f46e325bbed796f1d6267e822f4ffeea131a2f9c/LivingAtlas1-main/client/src/Content1.js)
 * [Header.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f46e325bbed796f1d6267e822f4ffeea131a2f9c/LivingAtlas1-main/client/src/Header.js)
 * [LayerPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f46e325bbed796f1d6267e822f4ffeea131a2f9c/LivingAtlas1-main/client/src/LayerPanel.css)
 * [LayerPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f46e325bbed796f1d6267e822f4ffeea131a2f9c/LivingAtlas1-main/client/src/LayerPanel.js)
 * [Main.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/feed336f66144a10b9c3cb7a9a704291784c3a80/LivingAtlas1-main/client/src/Main.js)
 * [main.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/b4a568572ad99c5d649d90909af305cb1f78089b/LivingAtlas1-main/backend/main.py)
 * [account.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/b4a568572ad99c5d649d90909af305cb1f78089b/LivingAtlas1-main/backend/account.py)
 * [Reset.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/b4a568572ad99c5d649d90909af305cb1f78089b/LivingAtlas1-main/client/src/Reset.js)
 * [Login.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/66994179b280cc4e554bace6dacf735cc5512a2f/LivingAtlas1-main/client/src/Login.js)
 * [api.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/66994179b280cc4e554bace6dacf735cc5512a2f/LivingAtlas1-main/client/src/api.js)
 * [App.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/7cd3c6c36d521a4c7f55cb7476c4900ec2dd1d05/LivingAtlas1-main/client/src/App.js)
 * [FormModal.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/7989e12ec4c54208552c5944aa3a5cc274e83593/LivingAtlas1-main/client/src/FormModal.css)
 
## Retrospective Summary
Here's what went well:
  * We did a good job pivoting to focusing on bug fixes over new features.
  * We have effectively planned how to pass off account details to the next development team.
 
Here's what we'd like to improve:
   * We should have improved our efficiency in which we addressed bug fixes so as to have a more stable final product.
   * We should have simplified some of our new features so that it was obvious to all users what each feature did.
  
Here are changes we plan to implement in the next sprint (No next sprint for our team, but future development for future teams):
   * Performance improvement, namely loading of cards, should be prioritized.
   * 2-factor authentication, user data encryption, and other security protections should be added.
   * An in-app tutorial should be added to guide new users on how to use the app.

   * Accessibility features should be added.

