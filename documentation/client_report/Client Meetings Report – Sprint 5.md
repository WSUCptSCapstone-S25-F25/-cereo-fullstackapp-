# Client Meetings Report Sprint 5

## Agenda (08/25/2025)
 * We would like to communicate with the client about what features they would like to be added and what bug fixes they have noticed with the current state of the application.
 * We would like to demonstrate recent progress made in development, specifically the new toggleable layers feature.
 * We would like to follow up about unfinished issues from the previous sprint, such as map resizing, and ask if these features should be prioritized over any new features.
 * We would like to assess the client's availability and establish a regular meeting time that will work for everyone.

## Minutes (08/25/2025)
Our team met with Julie and Jan. We started the meeting by demonstrating the new layers tab feature, which could toggle hydrological or city boundaries on the map on or off. The client members were happy with this feature and would like to see it expanded with additional data layers. They would prefer that users would be able to upload GIS data as a layer, but they are okay with GIS data only being uploadable by an admin. The client suggested a new feature for cards where the name on the card was able to be edited, as this is the only field on cards that are not editable. During the meeting, we noticed that thumbnails were not showing up on cards, so we agreed to look into why this is occurring. We agreed that our meeting time on Mondays would work for everyone, so we scheduled a regular weekly meeting with the exception of the following week because of Labor Day.

## Retrospective Summary (08/25/2025)
Here's what went well:
  * Our team now has a good idea of what features the client wants most, and we will prioritize development of these features in the upcoming sprint.
  * Demonstrating the application with the client helped us both gain a better understanding of the current state of the application.
  * We established a regular meeting schedule.
 
Here's what we'd like to improve:
   * Because there has been a lot of time since our previous meeting, some time needed to be spent refamiliarizing our team with the application. This will naturally improve as the sprint progresses.
  
Here are changes we plan to implement as soon as possible:
   * Add GIS data as layers from external databases and allow users to toggle these layers on or off.
   * Add name as an editable field for cards.
   * Fix the bug causing thumbnails to not appear.

## Agenda (09/02/2025)
 * We would like to demonstrate the new external geospatial data in Washington state added as a toggleable layer, and demonstrate the new feature to edit names on cards.
 * We would like to continue our follow up on unfinished issues such as map resizing and ask if these features are a priority.
 * We would like to communicate with the client about additional features they have thought of or bug fixes they have encountered as they use the application.

## Minutes (09/02/2025)
Our team met with Julie and Jan. We started the meeting by demonstrating the new name editing feature on the cards. This feature wasn't exactly what the client wanted as they were expecting a user's real name to be able to be displayed in the name field rather than their username. Since accounts do not include a user's real name, the database will need to be updated to make this change. Next, we demonstrated the Washington state geological data added as toggleable layers. The client was happy with this feature but they would like users to be able to upload their own GIS data. They would also like more external geological data to be added from the backend. We also discussed the map resizing feature started in the previous sprint, and the client agreed that this would be a good addition for this sprint.

## Retrospective Summary (09/02/2025)
Here's what went well:
  * We received good feedback on our sprint development and we learned about any adjustments to our work that need to be made.
  * We learned which features should be prioritized in development before our next meeting.
 
Here's what we'd like to improve:
   * Some of our features developed weren't what the client was expecting or they needed to be developed further. We could communicate with the client better about what the expectations for each feature are.
  
Here are changes we plan to implement as soon as possible:
   * Add more toggleable layers by adding GIS data from more geodatabases
   * Edit database schema for accounts so that they include a user's real name, then add real name as a field on cards
   * Resize the map to be smaller when any sidebars are open so no part of the map is blocked
   * Continue work on fixing the thumbnail bug

## Agenda (09/08/2025)
 * We would like to demonstrate an added search function for layers, the map resizing functionality for sidebars, and some bug fixes with the bookmarking feature.
 * We would like to receive feedback from the client on our development and ask for ideas for features to add to the application.

## Minutes (09/08/2025)
Our team met with Julie and Jan. We started the meeting by demonstrating a new search feature in the layers tab that allows users to easily find certain layers. We also mentioned that we encountered a bug with the bookmarking features but demonstrated that this bug has been fixed. Then, we demonstrated that the map would resize when any sidebars covering the map were opened. The client did not have much feedback for our team this meeting as our changes had not been deployed to the server, so they were not able to test our new features for potential bugs. However, they suggested that we work on adding file attachments for cards.

## Retrospective Summary (09/08/2025)
Here's what went well:
  * We communicated our progress to the client well so that they could understand the progress our team has made.
  * The client was satisfied with our development since the previous meeting.
 
Here's what we'd like to improve:
   * We should deploy our changes to the web server more often. This way, the client is able to test our new features soon after we implement them and give our team feedback sooner as well.
  
Here are changes we plan to implement as soon as possible:
   * Continue work on fixing the thumbnail bug
   * Add file attachments to cards
   * Wrap up sprint by writing end-of-sprint documentation and have all working branches merged into main


