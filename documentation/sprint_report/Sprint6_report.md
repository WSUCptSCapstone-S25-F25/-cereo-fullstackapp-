# Sprint 6 Report (9/14/2025 - 10/11/2025)

 * [Sprint Demo Video](https://www.youtube.com/watch?v=LiVLH2pckq0)

## What's New (User Facing)
 * Cards can now support file attachments that can be downloaded by users as a zip file. Card owners can upload a file while creating the card or by editing the card later.
 * Bug with card editing where changes were reverted during the edit is fixed.
 * Bug with real name/author field not loading on cards is fixed.
 * Bug with navbar home button redirecting to a blank page is fixed.
 * Bug that loads card information into incorrect fields is partially fixed. Some fields now load correctly while other fields like the thumbnail do not.
 * Minor updates to the layers feature to improve data fetching and UI.

## Work Summary (Developer Facing)
During this sprint, our team heavily based our development plan on client feedback during weekly client meetings, as we have in past sprints. Because there are only a few sprints remaining in our development cycle, we have begun to shift our focus from new features to bug fixes for already existing features. Yaru mostly worked on the layers feature for this sprint. He wrote documentation for the client explaining how they could remove individual layers from the layers tab on their own after we are no longer developing for the Living Atlas. For software features, he added a local copy of the spatial data to be used when the normal data fetch fails, as well as some UI improvements to the layers tab. Zachary mostly worked on implementing file attachments for cards for this sprint by storing these files in our Google Cloud service. He ran into some challenges with storing file data in a zip folder, as this folder would be named after its location in memory when downloaded rather than the intended file name. Jonathan mostly worked on bug fixes for this sprint, particularly bugs related to how cards are edited and displayed. The card edit feature had many problems with bugs as edits to fields would be reverted in the middle of editing and the Author field would not appear at all, which has been fixed. There was also a bug fixed where bad redirects occurred when clicking the navigation bar at the top of the screen. 

## Unfinished Work
* We need to implement a feature allowing users to edit ArcGIS data through the frontend. This is a very complicated task that would be too much work to complete within this sprint, so we will continue work on this in future sprints.
* We need to implement a feature allowing users to rename or remove a folder in the layers tab. We prioritized other features during this sprint so we did not get to fixing this bug, but we  will work on this next sprint.
* There is a bug where thumbnails uploaded when editing a card do not save with the card. We ran out of time to address this bug, but will work on this next sprint.
* There is a bug where the website will sometimes load cards with rearranged fields when starting up. This is partially fixed, but some card fields still do not appear in this state, such as the thumbnail. We began working on this bug late in the sprint and ran out of time, but will work on this next sprint.
* There is a bug with sublayers in the layers tab where layers with multiple sublayers do not have a legend. We prioritized other features/fixes during this sprint so we did not get to fixing this bug, but we  will work on this next sprint.
* There is a bug where a user's favorites are not saved and reset when the page is refreshed. We prioritized other features/fixes during this sprint so we did not get to fixing this bug, but we  will work on this next sprint.
* There is an issue with the file attachment feature where files are not deleted from the cloud service when its corresponding card is deleted. We began working on this bug late in the sprint and ran out of time, but will work on this next sprint.
* We would like to add ArcGIS links to the layers tab showing the source of the data. This feature was not a priority for us this sprint but we will work on this next sprint.
* We would like to update the search functionality to allow users to search for website features. This feature was not a priority for us this sprint but we will work on this next sprint.
* We could not perform testing on website performance this sprint as we were working on other issues, but would like to focus on this in a future sprint.
* We could not improve website security this sprint as we were working on other issues, but would like to focus on this in a future sprint.

## Completed Issues/User Stories
Here are links to the issues that we completed in this sprint:
 * [Add admin edit of all card fields for other user's cards](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/62)
 * [Add Downloadable Files To Cards](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/86)
 * [Fix Page Redirecting Issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/89)
 * [Fix Real Name Field on Cards](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/94)
 * [Be able to upload files through edit tab](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/100)
 * [Put uploaded files into folder before zipping](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/101)
 * [Create a documentation demonstrating how to update local ArcGIS data](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/102)
 
 ## Incomplete Issues/User Stories
 Here are links to issues we worked on but did not complete in this sprint:
 * [Improve performance and loading times](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/63) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Improve App Security and Data Integrity](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/79) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Refine Search Modal](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/85) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Support for Renaming a Folder/Service](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/87) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Support for Removing Unwanted Folders/Services](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/88) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Fix Favorite State Resetting When Page is Refreshed](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/90) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Fix Sublayer Fetching Issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/93) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Include a link to ArcGIS page for each service](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/103) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Allow users to edit and update fetched ArcGIS data through frontend](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/104) <<We ran out of time in the sprint to complete this feature.>>
 * [Fix cards loading with mismatched fields](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/106) <<This feature is partially completed, as some fields can be corrected to load correctly while other fields are not returned in this state, such as the thumbnail. We ran out of time in the sprint to fully complete this fix.>>
 * [Change card delete function so that attached files are deleted from cloud service](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/107) <<We ran out of time in the sprint to fix this.>>
 * [Naming Bug with zipped files](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/108) <<We ran out of time in the sprint to fix this.>>
 * [Thumbnails not saving when edit card](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/109) <<We ran out of time in the sprint to fix this.>>

## Code Files for Review
Please review the following code files, which were actively developed during this sprint, for quality:
 * [fetchArcgisServices.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/3084708601ae132f04d860bb96951127ae644eab/LivingAtlas1-main/client/src/fetchArcgisServices.js)
 * [ArcgisUploadPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1a107f7446c423a94f8ae9d46a41d8c0f4923478/LivingAtlas1-main/client/src/ArcgisUploadPanel.css)
 * [ArcgisUploadPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1a107f7446c423a94f8ae9d46a41d8c0f4923478/LivingAtlas1-main/client/src/ArcgisUploadPanel.js)
 * [arcgisDataUtils.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1a107f7446c423a94f8ae9d46a41d8c0f4923478/LivingAtlas1-main/client/src/arcgisDataUtils.js)
 * [fetchArcgisServices_direct_db.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/e1a383d937764d54944651d72a9ec3aca1d6d84b/LivingAtlas1-main/client/src/fetchArcgisServices_direct_db.js)
 * [arcgis.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/41b15b6d0cd1fdb178d6a09630e1ea22ad8b5f80/LivingAtlas1-main/backend/endpoint_files/arcgis.py)
 * [arcgisServicesDb.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/826e2224c095ce177d0567fac402a95f3b049bc7/LivingAtlas1-main/client/src/arcgisServicesDb.js)
 * [check_arcgis_data.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1c80ebc88977592f8a70d7b6acf676ce5543b237/LivingAtlas1-main/backend/check_arcgis_data.py)
 * [create_arcgis_services_table.sql](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1c80ebc88977592f8a70d7b6acf676ce5543b237/LivingAtlas1-main/backend/create_arcgis_services_table.sql)
 * [main.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/41b15b6d0cd1fdb178d6a09630e1ea22ad8b5f80/LivingAtlas1-main/backend/main.py)
 * [Card.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/181feeeb01a6cd50696cb8141262c8b2dce3a832/LivingAtlas1-main/client/src/Card.js)
 * [endpoint_files/card.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/17e2044bbb57ecb8accfe5f11f91c78654c731c4/LivingAtlas1-main/backend/endpoint_files/card.py)
 * [Content2.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Content2.js)
 * [Home.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/fea7d4094c6d730e4464c8059f366fc68f894fec/LivingAtlas1-main/client/src/Home.js)
 * [FormModal.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/client/src/FormModal.js)
 * [Profile.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/client/src/Profile.js)
 * [UploadButton.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/client/src/UploadButton.js)
 * [filterbar.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/f74deb9e44152d5b3b61459ff484c0fd81d489ee/LivingAtlas1-main/backend/endpoint_files/filterbar.py)
 * [file_utils.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/17e2044bbb57ecb8accfe5f11f91c78654c731c4/LivingAtlas1-main/backend/endpoint_files/file_utils.py)
 * [backend/account.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/backend/account.py)
 * [endpoint_files/account.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/backend/endpoint_files/account.py)
 * [endpoint_files/filterbar.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/backend/endpoint_files/filterbar.py)
 * [endpoint_files/map.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5916974eae6d04a4fb5e1da88cc06b02c08ee7b2/LivingAtlas1-main/backend/endpoint_files/map.py)
 * [Navbar.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/14ba52a591919a955004555f49ecaca122f01ed7/LivingAtlas1-main/client/src/Navbar.js)
 
## Retrospective Summary
Here's what went well:
  * Our team began setting weekly team meetings on top of our weekly client meeting and mentor meeting, which allowed us to better coordinate our development plan.
  * We established a better agenda for each client meeting which gave these meetings a better structure for the client to see development progress and give feedback.
  * We began focusing on bug fixes rather than new features, which puts us on track to make the Living Atlas very reliable software by the end of development.
 
Here's what we'd like to improve:
   * We could be completing our tasks more efficiently to have more issues resolved by the end of the sprint.
   * We should focus more on testing the existing version of the Living Atlas.
  
Here are changes we plan to implement in the next sprint:
   * Allow frontend users to edit fetched ArcGIS data
   * Allow users to rename/remove ArcGIS data folders
   * Fix favorite state not saving bug 
   * Fix bug with thumbnails not saving to a card when uploaded during an edit
   * Implement deletion of file attachments when card is deleted
   * Fix bug with legend not appearing for sublayers
   * Fix cards not being returned with all fields when loading on startup
   * Add ArcGIS links to layers tab