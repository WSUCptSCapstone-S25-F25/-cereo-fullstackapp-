# Sprint 2 Report (2/02/25 - 3/02/2025)

## Link to the demo video
* [Sprint 2 Video](https://youtu.be/2GDj7hvlmkg)

## What's New (User Facing)
 * Requirements and Specifications - A document outlining use cases, functional and non-functional requirements, and system evolution.
 * Soluton Approach Document - A document detailing the application's architecture, data structure, and UI design.
 * Fixed Card Display Issue - Cards are now properly displayed on the right side of the screen.
 * Fixed Resetting Passwords Issue - Users can now reset their passwords via a one-time verification link sent to their email.


## Work Summary (Developer Facing)
During this sprint, our team finalized the project implementation plan and assigned tasks to individual team members. We created a feedback survey for clients that included detailed proposals for planned implementations, providing specific descriptions of how each implementation would function. The survey asked clients to rate their need for each proposed feature and provide their opinions. After receiving client feedback, we converted each proposal from the survey into GitHub issues and prioritized implementing features that were deemed most important by clients.

Yaru resolved the card display issue by frequently restarting the Render backend service to address deployment limitations from the previous team. Yaru also fixed the password reset issue by using Bitly to ensure the password reset email links were not flagged as spam. Zachary took responsibility for developing a feature that allows users to add photos to cards, but this feature is still under development. Additionally, he created additional UI framework mock-up diagrams and demonstrated them to clients during a meeting. Jonathan worked on fixing file attachment issues and is still actively addressing this task

## Unfinished Work
The File Attachment Issue Fix and Adding Photos to Cards features could not be completed on time because these tasks involve Google Cloud access. The previous team has not responded to our requests for database access permissions. As a result, we are unable to view their data stored in Google Cloud, and we have yet to identify an alternative cloud service.

## Completed Issues/User Stories
Here are links to the issues that we completed in this sprint:
 * [Requirements and Specifications](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/9)
 * [Soluton Approach](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/20)
 * [Fix Card Display Issue](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/19)
 * [Resetting Passwords Through a One-Time Verification Link](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/18)
 * [Sprint 2](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/28)
 
 ## Incomplete Issues/User Stories
 * Fix File Attachment Issues <<[Database access issues prevent resolution; team members will follow up.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/6)>>
 * Adding Photo To Cards <<[Database access issues prevent resolution; team members will follow up.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/26)>>
 * Bookmarking Feature <<[Deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/5)>>
 * Living Atlas WinForms Executable Application <<[Deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/21)>>
 * Enhancing Polygon Features <<[Deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/22)>>
 * Advanced Search Functionality <<[Deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/23)>>
 * Collapse Card Section Feature <<[Deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/24)>>
 * Interactive Map Togglable Layers <<[Deferred to a subsequent sprint.](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/issues/29)>>

## Code Files for Review
Please review the following files, which were actively developed during this sprint, for quality:
 * [README.md](http://readme.md/)
 * [CLivingAtlas1-main](https://github.com/WSUCptSCapstone-S25-F25/-cereo-fullstackapp-/tree/main/LivingAtlas1-main)

## Retrospective Summary
Here's what went well:
  * Our team held productive meetings with clients and clearly identified their needs.
  * We communicated effectively, formulated implementation plans, and assigned tasks to individual team members.
  * We anticipated potential issues such as database access and Google Cloud limitations in advance.

Here's what we'd like to improve:
   * Accelerate the completion of assigned tasks to keep the project on schedule.
  
Here are changes we plan to implement in the next sprint:
   * Begin working on the unfinished issues as soon as possible.
   * Consider opening a new Aiven PostgreSQL cloud account if the previous team remains unresponsive.
   * Switch to an alternative cloud service to replace Google Cloud for file and image uploads.
