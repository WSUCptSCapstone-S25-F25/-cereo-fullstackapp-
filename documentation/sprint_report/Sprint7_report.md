# Sprint 7 Report (10/12/2025 - 11/8/2025)

 * [Sprint Demo Video](https://www.youtube.com/watch?v=mziTJDRZ-0c)

## What's New (User Facing)
 * Folder and Service Renaming - Users can rename folders or services by double-clicking and saving via keyboard shortcuts.
 * ArcGIS Synchronization - The Living Atlas now allow users to synchronizes with the ArcGIS Server and newly added or removed services can appear in real time.
 * Learn More Popups - Layers and sublayers now include a "Learn More" button for easier information discovery.
 * Map-Based Upload Enhancements - Users can now click directly on the map to add new cards, instead of manually entering coordinates.
 * UI Redesign - Redundant sidebars and buttons have been removed, resulting in a cleaner, more streamlined interface.
 * Improved Bookmarking Functionality - Users can now bookmark cards reliably; favorites persist across sessions and page refreshes.
 * Performance Improvements - Optimized card rendering reduces duplicate loads and speeds up data retrieval.

## Work Summary (Developer Facing)
Throughout this sprint, the team focused on finalizing core features and improving stability based on client feedback. Yaru mainly implemented ArcGIS synchronization to keep Living Atlas data automatically updated with the ArcGIS Server, developed folder and service renaming, improved the removed-services panel, and enabled the upload panel to display sublayers of services. Jonathan redesigned the UI for a cleaner layout and added a map-based upload feature allowing users to click directly on the map to add cards while migrating search and sorting functions into the layer panel. Zachary completed the bookmarking system with persistent favorites and optimized card rendering for faster performance. Collectively, the team prioritized reliability, data synchronization, and usability improvements across the platform.

## Unfinished Work
* Fix remaining reliability and performance issues causing slow startup or inconsistent data loading.
* Fix a critical bug where deleting a user from the administration page causes the screen to go blank until the app is reset.
* Resolve the bug with sublayer display and unintended selection behavior.
* Complete the removed services panel and ensure deleted services sync correctly with the database.
* Improve search and sorting functionality within the layer panel.
* Conduct full-application testing to identify and eliminate residual bugs.
* Begin exploring additional improvements and optimizations for future sprints.

## Completed Issues/User Stories
Here are links to the issues that we completed in this sprint:
 * [Include a link to ArcGIS page for each service](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/103)
 * [Fix Sublayer Fetching Issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/93)
 * [Allow users to edit and update fetched ArcGIS data through frontend](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/104)
 * [Fix Favorite State Resetting When Page is Refreshed](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/90)
 * [Naming Bug with zipped files](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/108)
 * [Thumbnails not saving when edit card](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/101)
 * [Create a documentation demonstrating how to update local ArcGIS data](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/109)
 * [Learn-more features for Layers and sublayers](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/129)
 * [Apply folder structure to layers containing multiple sublayers](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/115)
 * [Enhance the card creation process](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/117)
 * [Add ability to synchronize all available services in ArcGIS REST Server and the Living Atlas app](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/121)
 
 ## Incomplete Issues/User Stories
 Here are links to issues we worked on but did not complete in this sprint:
 * [Refine Search Modal](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/85) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Move search button to the right sidebar and build new search button](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/113) <<We ran out of time in the sprint to complete this feature.>>
 * [Fix Sublayer Displaying Issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/116) <<We ran out of time in the sprint to complete this feature.>>
 * [Update Documentation for Editing local ArcGIS data](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/118) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Complete Removed Services Panel](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/137) <<We ran out of time in the sprint to complete this feature.>>
 * [Admin page goes blank after deleting a user](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/131) <<We ran out of time in the sprint to complete this feature.>>
 * [Completely fix page redirecting issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/120) <<This issue is near completion, we will completely fix it in the next sprint.>>


## Code Files for Review
Please review the following code files, which were actively developed during this sprint, for quality:
 * [ArcgisUploadPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1a107f7446c423a94f8ae9d46a41d8c0f4923478/LivingAtlas1-main/client/src/ArcgisUploadPanel.js)
 * [ArcgisUploadPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1a107f7446c423a94f8ae9d46a41d8c0f4923478/LivingAtlas1-main/client/src/ArcgisUploadPanel.css)
 * [ArcgisRenameItem.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/main/LivingAtlas1-main/client/src/ArcgisRenameItem.js)
 * [ArcgisRenameItem.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/main/LivingAtlas1-main/client/src/ArcgisRenameItem.css)
 * [RemovedServicesPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/main/LivingAtlas1-main/client/src/RemovedServicesPanel.js)
 * [RemovedServicesPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/main/LivingAtlas1-main/client/src/RemovedServicesPanel.css)
 * [arcgisUpdateServices.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/main/LivingAtlas1-main/client/src/arcgisUpdateServices.js)
 * [arcgisServicesDb.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/826e2224c095ce177d0567fac402a95f3b049bc7/LivingAtlas1-main/client/src/arcgisServicesDb.js)
 * [arcgisDataUtils.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/826e2224c095ce177d0567fac402a95f3b049bc7/LivingAtlas1-main/client/src/arcgisDataUtils.js)
 * [arcgis.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/41b15b6d0cd1fdb178d6a09630e1ea22ad8b5f80/LivingAtlas1-main/backend/endpoint_files/arcgis.py)
 * [check_arcgis_data.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/41b15b6d0cd1fdb178d6a09630e1ea22ad8b5f80/LivingAtlas1-main/backend/check_arcgis_data.py)
 * [populate_arcgis_services.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/backend/populate_arcgis_services.py)
 * [fetchArcgisServices_direct_db.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/826e2224c095ce177d0567fac402a95f3b049bc7/LivingAtlas1-main/client/src/fetchArcgisServices_direct_db.js)
 * [main.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/41b15b6d0cd1fdb178d6a09630e1ea22ad8b5f80/LivingAtlas1-main/backend/main.py)
 * [Main.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Main.js)
 * [card.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/backend/endpoint_files/card.py)
 * [Card.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/src/Card.js)
 * [Card.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/src/Card.css)
 * [endpoint_files/card.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/17e2044bbb57ecb8accfe5f11f91c78654c731c4/LivingAtlas1-main/backend/endpoint_files/card.py)
 * [Content1.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Content1.js)
 * [Content1.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Content1.css)
 * [Content2.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Content2.js)
 * [Content2.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Content2.css)
 * [ServiceKey_GoogleCloud.json](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/backend/endpoint_files/ServiceKey_GoogleCloud.json)
 * [Home.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Home.js)
 * [FormModal.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/client/src/FormModal.js)
 * [FormModal.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/client/src/FormModal.css)
 * [UploadButton.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/client/src/UploadButton.js)
 * [Header.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/14ba52a591919a955004555f49ecaca122f01ed7/LivingAtlas1-main/client/src/Header.js)
 * [LayerPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/14ba52a591919a955004555f49ecaca122f01ed7/LivingAtlas1-main/client/src/LayerPanel.js)
 * [sidebars.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/sidebars.css)
 * [file_utils.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/backend/endpoint_files/file_utils.py)
 * [filterbar.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/backend/endpoint_files/filterbar.py)
 * [account.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/backend/account.py)
* [map.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/backend/endpoint_files/map.py)

## Retrospective Summary
Here's what went well:
  * The team successfully implemented major client-approved features such as bookmarking, ArcGIS synchronization, and map-based uploads.
  * UI redesigns improved clarity and usability and earned positive client feedback.
  * Collaboration and communication remained consistent.
 
Here's what we'd like to improve:
   * Some bugs still affect performance and reliability during initial load.
   * Deleted-service management need additional refinement and testing.
   * The admin-page user deletion bug requires prompt resolution to prevent crashes.
  
Here are changes we plan to implement in the next sprint:
   * Address reliability and startup performance issues.
   * Finalize removed-services functionality.
   * Improve search and sorting integration within the layer panel.
   * Conduct end-to-end testing to ensure all new features are stable and production-ready.
   * Fix the admin-page user deletion crash.

   * Meet with the client to review the development plans for the next sprint.
