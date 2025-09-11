# Sprint 4 Report (04/03/2025 - 05/01/2025)

## Link to the demo video
[Sprint 4 Video](https://www.youtube.com/watch?v=iFYYRm5QUYY)

## What's New (User Facing)
 * New UI deployed, featuring a cleaner layout and more responsive design for improved usability across devices
 * General bug fixes to improve performance, loading consistency, and reduce UI glitches

## Work Summary (Developer Facing)
During Sprint 4, our team focused on refining the user interface and addressing bugs identified during internal testing and client feedback. We aimed to make the application more stable and user-friendly in preparation for feature additions in upcoming sprints.

Yaru contributed to finalizing the visual design and layout of the new user interface, including responsive card alignment and sidebar behavior.

Zachary implemented UI integration with backend APIs, ensured thumbnail links displayed correctly across views, and resolved several backend-related errors, especially those tied to thumbnail upload and display.

Jonathan handled bug fixes for card sorting and ensured proper behavior when switching between map views and list views. He also provided key input on finalizing UI tweaks from user testing sessions.

## Unfinished Work
* Some thumbnail display bugs persist in edge cases; these will be finalized next sprint.
* The card collapse/expand sidebar logic has not been fully implemented and will be the focus in early Sprint 5.

## Completed Issues/User Stories
* Deploy New UI
* Bug Fixes (Frontend and Backend)
* Fix Thumbnail Link Loading in Individual Card View
* General UI Responsiveness Fixes
* Card Grid Layout Adjustments

## Incomplete Issues/User Stories
* Collapse Card Section Feature <<Initial implementation attempted but caused layout issues; will be revisited with fresh approach next sprint.>>
* Thumbnail Display Edge Case Bugs <<Currently, some card thumbnails fail to load on slower networks. A loading fallback will be implemented.>>
* Map Resize on Sidebar Collapse <<Layout adjustment not working as intended; needs rework.>>
* UI Touch-Ups (padding, fonts, spacing) <<Pending final design pass.>>

## Code Files for Review
Please review the following files for major changes and improvements:
* [App.js]([LivingAtlas1-main/client/src)
* [Card.js](LivingAtlas1-main/client/src)
* [FormModal.js](LivingAtlas1-main/client/src)
* [Content2.js](LivingAtlas1-main/client/src)
* [styles/card.css](LivingAtlas1-main/client/src)
* [backend/endpoint/card.py](LivingAtlas1-main/backend/endpoint_files)
* [README.md](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-.git)

## Retrospective Summary
Here's what went well:
* New UI deployed successfully and integrated into the production workflow
* Backend bug fixes led to smoother operation of image-related features
* Improved team coordination and responsiveness to bug reports

## Here's what we'd like to improve:
* Avoid pushing unfinished UI changes that impact core layout stability
* More time allocated to regression testing when UI is significantly changed

## Here are changes we plan to implement in the next sprint:
* Reimplement the card collapse feature with working map resizing logic
* Polish remaining UI elements for final client feedback round
* Add map feature enhancements (toggleable layers, improved polygon drawing)
* Prepare testing plan for frontend display features
