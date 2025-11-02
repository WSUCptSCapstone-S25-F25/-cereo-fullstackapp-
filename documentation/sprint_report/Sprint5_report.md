# Sprint 5 Report (8/18/25 - 9/13/2025)

 * [Sprint Demo Video](https://www.youtube.com/watch?v=AWtopZvuxoo)

## What's New (User Facing)
 * Added layers menu to show/hide external data layers on map
 * Hydrological and city boundary data can be hidden in layers menu
 * Clicking cards zooms map to its corresponding pin location
 * Name on cards can be edited by an admin
 * New field on cards for adding a user's real name
 * Map resizes smaller when sidebars are open
 * Card container sidebar is resizable
 * Thumbnail, bookmarking, and card editing features fixed

## Work Summary (Developer Facing)
During this sprint, our team mainly focused on implementing features suggested by the client during our weekly client meeting. There were also some previously implemented features that no longer functioned as intended. Yaru worked on a new layers menu that contains current and external GIS spatial data that can be shown or hidden by the user. He is working on also adding data from the HydroShare website and will add this next sprint. Zachary worked on fixing the thumbnail feature for cards and editing the database schema to allow accounts to be registered with the user's real name. Jonathan worked on allowing names to be changed on cards and map resizing for when sidebars are opened. We experienced some challenges reaccessing our account for the Render, Netlify, and Google Cloud services after our long break in development but we were able to regain access, and we also experienced challenges with deploying our repository to the web server. Overall, we believe we made significant progress in development this sprint and have a good understanding of work that still needs to be completed in future sprints.

## Unfinished Work
* The thumbnail feature is still broken and do not appear on cards. We ran out of time and will fix this next sprint.
* There are additional geodatabases containing data that we would like to add as optional layers on the map, such as HydroShare and ArcGIS REST. The client informed us that they wanted this feature to be added late in this sprint so it will not be done in time for this sprint.
* The option to attach a file to cards still needs to be implemented. We ran out of time working on other features and will prioritize this feature next sprint.
* Editing the name on a card was implemented this sprint, but the client would like a real name to be attached to the card rather than an account username. Edits to the database schema must be done before this can be completed.
* We could not perform testing on website performance this sprint as we were working on other issues, but would like to focus on this in a future sprint.
* We could not improve website security this sprint as we were working on other issues, but would like to focus on this in a future sprint.

## Completed Issues/User Stories
Here are links to the issues that we completed in this sprint: 
* [Interactive Map Toggleable Layers](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/29)
* [Refine Frontend](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/31)
* [Enhance Map Display Functionalities](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/33)
* [Implement Clickable Cards to Navigate Map View](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/48)
* [Allow Map to Display all cards When Homepage is Accessed](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/49)
* [Filter map to show only favorited cards](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/51)
* [Edit Card Bug](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/55)
* [Fix Broken Thumbnail Attachments](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/61)
* [Load Spatial Data from arcGIS webserver and display it on map](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/64)
* [Fix Missing CardID bug for Bookmark feature](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/65)
* [Resize the Mapbox map when specific modals are opened](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/80)

 Reminders (Remove this section when you save the file):
  * Each issue should be assigned to a milestone
  * Each completed issue should be assigned to a pull request
  * Each completed pull request should include a link to a "Before and After" video
  * All team members who contributed to the issue should be assigned to it on GitHub
  * Each issue should be assigned story points using a label
  * Story points contribution of each team member should be indicated in a comment
 
 ## Incomplete Issues/User Stories
 Here are links to issues we worked on but did not complete in this sprint:
 
 * [Fix File Attachment Issues](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/6) <<We did not get to this issue because we prioritized other issues requested by the client.>>
 * [Add admin edit of all card fields for other user's cards](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/62) <<This feature is mostly completed, but the feature that allows for real names to be entered on a card was implemented at the end of this sprint, so we did not have time to reformat cards to real names.>>
 * [Improve performance and loading times](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/63) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Load Spatial Data from Other Geodatabases](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/66) <<We ran out of time as the base toggleable layers feature needed to be implemented before we could expand the amount of external geodatabase data.>>
 * [Improve App Security and Data Integrity](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/79) <<We decided that other features needed to be prioritized as they were requested by the client.>>
 * [Refine Search Modal](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/85) <<We began working on this feature very late into the sprint, and ran out of time.>>
 
 Examples of explanations (Remove this section when you save the file):
  * "We ran into a complication we did not anticipate (explain briefly)." 
  * "We decided that the feature did not add sufficient value for us to work on it in this sprint (explain briefly)."
  * "We could not reproduce the bug" (explain briefly).
  * "We did not get to this issue because..." (explain briefly)

## Code Files for Review
Please review the following code files, which were actively developed during this sprint, for quality:
 * [Content1.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/6cfc19e1b67a3ac3156fd1b02056214961ebee9e/LivingAtlas1-main/client/src/Content1.js)
 * [Content1.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/9f9589da03c91e11f3579198db69b41dbc7d2a8d/LivingAtlas1-main/client/src/Content1.css)
 * [Content2.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/6cfc19e1b67a3ac3156fd1b02056214961ebee9e/LivingAtlas1-main/client/src/Content2.js)
 * [Content2.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/43b811770d85b5acc01afa82f884ef351dbcfd6d/LivingAtlas1-main/client/src/Content2.css)
 * [Home.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/6cfc19e1b67a3ac3156fd1b02056214961ebee9e/LivingAtlas1-main/client/src/Home.js)
 * [Main.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/6cfc19e1b67a3ac3156fd1b02056214961ebee9e/LivingAtlas1-main/client/src/Main.js)
 * [main.py](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/b5fa243198aa9cc8cfd23ce064707e337c670996/LivingAtlas1-main/backend/main.py)
 * [Card.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/b7a7cd8f57855d3a575a2157c011587082e74ef2/LivingAtlas1-main/client/src/Card.js)
 * [Card.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/b7a7cd8f57855d3a575a2157c011587082e74ef2/LivingAtlas1-main/client/src/Card.css)
 * [card.py]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/3fd05f4768ed1513e23dd2c8d880297b761f01bf/LivingAtlas1-main/backend/endpoint_files/card.py)
 * [LayerPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/9bed4820501253b5bfd4615800238d5933a6df99/LivingAtlas1-main/client/src/LayerPanel.js)
 * [LayerPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/a02d709fa9cc0ae684b757e32c0b57e1fceede23/LivingAtlas1-main/client/src/LayerPanel.css)
 * [Sidebars.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/a02d709fa9cc0ae684b757e32c0b57e1fceede23/LivingAtlas1-main/client/src/Sidebars.css)
 * [Navbar.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/c2a3cb6f099a7b6112c4aefe6178f35ad074f210/LivingAtlas1-main/client/src/Navbar.js)
 * [AreaFilter.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/9bed4820501253b5bfd4615800238d5933a6df99/LivingAtlas1-main/client/src/AreaFilter.js)
 * [ArcgisUploadPanel.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/5797da2c02d9a497f5b8a34d20a5ef6b371dd532/LivingAtlas1-main/client/src/ArcgisUploadPanel.js)
 * [ArcgisUploadPanel.css](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/13d36df6323cbbe6eabf3a515a218ab05d1b46d7/LivingAtlas1-main/client/src/ArcgisUploadPanel.css)
 * [fetch-all-arcgis-authoritative.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/3d1530a8cb01f73fd588968285e85a3f97906d1c/LivingAtlas1-main/fetch-all-arcgis-authoritative.js)
 * [arcgisVectorUtils.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/43612c8023a122704b7b02349fd2c50ca7fc42ff/LivingAtlas1-main/client/src/arcgisVectorUtils.js)
 * [arcgisPopupUtils.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/a42ca96d3d96ecaea17682cf053dbfe1d79be446/LivingAtlas1-main/client/src/arcgisPopupUtils.js)
* [arcgisDataUtils.js]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1822c2fc399e4cc3d66c323044452d65aa2532c2/LivingAtlas1-main/client/src/arcgisDataUtils.js)
* [fetchArcgisServices.js]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/c59cb641f1fd2eedba0a9fa21042488d1fd8dd0c/LivingAtlas1-main/client/src/fetchArcgisServices.js)
* [api.js](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/7faa99fb044a3553634b0f451d6215ff9db7046e/LivingAtlas1-main/client/src/api.js)
* [api.py]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/3fd05f4768ed1513e23dd2c8d880297b761f01bf/LivingAtlas1-main/backend/app/api.py)
* [FormModal.js]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/3fd05f4768ed1513e23dd2c8d880297b761f01bf/LivingAtlas1-main/client/src/FormModal.js)
* [prefetchArcgisData.js]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/1f6830726d36ae7be64b58b8c40466849bc3c9ea/LivingAtlas1-main/client/src/prefetchArcgisData.js)
* [arcgisUploadSearchUtils.js]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/bfbbfc7e71e164eef1c6358c9672044e42a08f12/LivingAtlas1-main/client/src/arcgisUploadSearchUtils.js)
* [arcgisUploadMessageUtils.js]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/13d36df6323cbbe6eabf3a515a218ab05d1b46d7/LivingAtlas1-main/client/src/arcgisUploadMessageUtils.js)
* [map.py]( https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/e94a860905e2dfc790938f0e9be1eeadcc4e7bca/LivingAtlas1-main/backend/endpoint_files/map.py)

## Retrospective Summary
Here's what went well:
  * We made progress on issues that we had difficulty implementing in previous sprints, such as the toggleable layers feature.
  * We had good communication with the client and received clear guidance from them.
 
Here's what we'd like to improve:
   * We should improve team communication to prevent compatibility issues between commits to main.
   * We should focus more on bug fixes rather than implementing new features.
  
Here are changes we plan to implement in the next sprint:
   * Implement file attachment to cards feature
   * Add spatial data layers from more geodatabases
   * Improve performance

   * Improve security protections
