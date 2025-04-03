# Sprint 3 Report (03/03/2025 - 04/02/2025)

## Link to the demo video
[Sprint 3 Video](https://www.youtube.com/watch?v=VFDPqKfC03Y)

## What's New (User Facing)
 * Cards are able to be sorted by closest to your current location or recently added
 * Testing and acceptance plans documentation detailing software that will be used while testing the application and a schedule for future testing

## Work Summary (Developer Facing)
Our team consulted the client on what tests would need to be completed for the final product to be considered acceptable, we considered the best methods on how to test the application, and we used this information to complete our testing and acceptance plans.

Yaru worked on the bookmarking feature, including the bookmark icon design and the ability to show all favorited cards. 

Zachary worked on creating a new database in Microsoft Azure to replace the old Aiven database that the team has lost access to, as well as creating a new Google Cloud data storage account for files and images. He also worked on implementing uploading thumbnails for cards.

Jonathan worked on implementing file attachments for each card. He also worked on sorting features that can sort cards by nearest to current location or recently posted.

## Unfinished Work
 * Thumbnail and file attachment features for cards are non-functional because the Google Cloud data service has not been paid for yet. Further meetings with the client are needed to begin running the Google Cloud service on client payment.
 * Bookmark feature development was delayed due to database issues. The new database is now operational, so this feature will be implemented early in the next sprint.

## Completed Issues/User Stories
 * [Create New Database Account](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/30)
 * [Advanced Search Functionality](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/23)

## Incomplete Issues/user Stories
 * Fix File Attachment Issues <<[This bug will be fixed soon after the new Google Cloud account is launched.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/6)>>
 * Adding Photo To Cards <<[This feature will be implemented soon after the new Google Cloud account is launched.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/26)>>
 * Bookmarking Feature <<[Almost complete, development delayed due to database issues.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/5)>>
 * Interactive Map Toggleable Layers <<[Development will begin next sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/29)>>
 * Refine User Interface <<[Development will begin next sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/31)>>
 * Enhancing Polygon Features <<[Development deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/22)>>
 * Collapse Card Section Feature <<[Development deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/24)>>
 * Living Atlas WinForms Executable Application <<[Development deferred to a subsequent sprint, but this feature may not be necessary to meet client requirements.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/21)>>


## Code Files for Review
Please review the following code files, which were actively developed during this sprint, for quality:
 * [README.md](http://readme.md/)
 * [CLivingAtlas1-main](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/tree/main/LivingAtlas1-main)
 * [CEREO_ATLAS_Testing_and_Acceptance_Plans](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/blob/main/documentation/CEREO_ATLAS_Testing_and_Acceptance_Plans.pdf)

## Retrospective Summary
Here's what went well:
* Our team dealt with the database issues well and limited the roadblock to development progress
* We had good communication with the clients and we relayed all necessary information to them efficiently
* We had quicker development of features compared to the previous sprint because of better familiarity with the code

Here's what we'd like to improve:
* Better organize division of work between team members to provide clear goals for each member
* Complete each task more efficiently

Here are changes we plan to implement in the next sprint:
* Implement more map features such as toggleable layers and custom polygons
* UI enhancements to refine user friendliness
* Begin looking for ways to improve application performance
* Begin testing of previously implemented features