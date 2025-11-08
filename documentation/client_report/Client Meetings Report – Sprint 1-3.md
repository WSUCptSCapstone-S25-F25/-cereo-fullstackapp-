# Client Meetings Report

## Agenda (01/23/2025)
-	We would like to discuss further details concerning the Living Atlas’ performance issues.
-	We would like to discuss usability issues with the Living Atlas and steps we can take to make the application more user-friendly.
-	We would like to set goals for our team such that accomplishing these goals would allow us to consider our project successful.
-	We would like to discuss which problems with the Living Atlas are the most critical so that our team can put a greater priority towards fixing these problems.
-	We would like to discuss any useful technologies and tools utilized by the previous team so that we can continue to use these resources during development.
-	We would like to discuss the goals for the Living Atlas and its user base so that we can keep these plans in mind during development.
-	We would like to plan future meetings with the client.

## Minutes (01/23/2025)
Our team met with Jan Boll. First, we discussed current problems with the Living Atlas. During a demonstration of the application during our meeting, the website experienced significant performance issues, which we believe will be the highest priority problem to solve for this project. We also discussed potential improvements that could be made. This includes updates to the user interface, the ability for users to upload custom photos, and to allow students, faculty, and external communities to contribute data. Jan did not have knowledge of the technical details of the application, but provided us with the project
report of the previous team which includes these details. We established that a goal for the application was to scale up its user base to communities outside of WSU and expand the focus of the app internationally. We discussed that an upgrade to hosting services may be necessary to accommodate this goal. At the end of the meeting, we set a plan for a second meeting to take place on February 3rd.

## Retrospective Summary (01/23/2025)
Here's what went well:
 
-	Our team gained a much better understanding of the current problems with the Living Atlas and can establish a series of objectives to improve the application.
-	We received the project report of the previous team which contains more technical knowledge of the application and allows our team to continue development from where they left off.
-	We established a goal of developing the application to handle a scaled up userbase.
-	We made plans for future meetings with the client.

Here's what we'd like to improve:
-	Our access to the application is currently non-functional, so development cannot yet begin. We will resolve this problem with the client during the next meeting.
-	The client is not knowledgeable in the technical details of the application, so there may be some challenges in the future as the only technical knowledge we will have available to us are the details presented in the previous team’s project report.

Here are changes we plan to implement as soon as possible:
-	We will establish the cause of the website’s performance and reliability issues.
-	We will implement the ability for users with certain permissions to contribute data to the map, along with support for uploading custom photos.
-	We will redesign the user interface to become more user-friendly.

## Agenda (02/03/2025)

-	We would like to discuss the feasibility of implementing some of the features we have considered.
-	We would like to revisit key points raised by the client in the previous meeting.
-	We would like to begin planning future improvements accordingly.
-	We would like to present some of our own ideas and ask if the client would find them useful.

## Minutes (02/03/2025)

Our team met with Julie Padowski. First, Julie introduced the current shortcomings of the Living Atlas, such as limited scalability, usability issues, and multiple bugs. Julie then provided suggestions for improvements, including enhancing the design, adding a password reset feature, and increasing the platform’s capacity to support more users. Most of these concerns aligned with those discussed with Jan in the previous meeting. Each team member proposed ideas to Julie , and we discussed their feasibility and necessity for the project.

## Retrospective Summary (02/03/2025)

Here's what we'd like to improve:
-	We forgot to record the meeting, so we may have missed some details regarding the client's suggestions for improvements.

Here are changes we plan to implement as soon as possible:
-	We will draft proposals for planned improvements based on our understanding of the client's needs.
-	We will create a feedback survey form to gather client opinions on our proposals.
-	We will prioritize each proposal based on urgency and importance, ensuring that high-priority tasks are addressed first.

## Agenda (02/20/2025)

-	We will review the details of the planned implementations that the clients want to understand.
-	We would like to discuss the feasibility of implementing these features.
-	We would like to gather suggestions for additional features the clients may want to add.
-	We would like to include frontend refinements in our plan and present mockup images of the updated design to the clients.

## Minutes (02/20/2025)
Our team met with Jan and Julie to present our planned implementations, which were developed based on the features outlined in the client survey. We reviewed each feature in detail, discussing feasibility, potential constraints, and areas for improvement. The conversation focused on refining key functionalities and ensuring the proposed features aligned with client expectations. Clients provided feedback on usability and requested additional enhancements, particularly in data visualization and filtering capabilities. The discussion also covered frontend improvements, including UI refinements and the ability to toggle various layers for better clarity.

Clients also requested additional functionality such as the ability to toggle layers for different data categories like communities and watersheds. They emphasized the need for better filtering options, allowing users to filter polygons based on watershed and other environmental factors. Users should also be able to search for a watershed and view all relevant data points within its boundaries. Furthermore, the system should support displaying watershed boundary data on the map with a toggle option for visibility. Another major request was an enhancement to the file attachment feature, which should support multiple formats, including PDFs, images, and Excel (XLS) files.


## Retrospective Summary (02/20/2025)
Here's what we'd like to improve:
-	We need to speed up the development process to ensure timely implementation of the planned features.

Here are changes we plan to implement as soon as possible:
-	We would like to start to work on the planned improvements and complete them as soon as possible.
-	We would like to refine the frontend to better support the requested functionality.
-	We would like to implement togglable layers for different data categories, such as communities and watersheds.
-	We would like to improve filtering options to allow users to filter polygons based on watershed and other environmental factors, ensuring polygons associated with specific factors are easily identifiable.
-	We would like to enhance search functionality to support searching by environmental factors such as watershed, allowing users to locate a watershed and view all relevant data pins within its boundaries.
-	We would like to improve map features so that watershed boundary data is viewable and users can toggle the visibility of these boundaries on and off.
-	We would like to upgrade the file attachment feature to support multiple formats, including PDF, images, and Excel (XLS).

## Agenda (03/06/2025)
 * Problems with Accessing the Database
We will mention our team's attempts to contact previous team for account information.
We want to discuss plans to recreate database: File information can be manually reentered, but passwords may be lost.
We want to discuss how these problems with the database will impact development timeline of thumbnail and file attachment features.

 * Testing and Acceptance Plans
We want to discuss what tests must be passed to consider the project successful.
We want to brainstorm ideas for tests.
Examples: User with correct authorization can add new data from the frontend, user is able to reset their account password, user can view thumbnails on cards, user can download file attachments to their device, user can bookmark a card, and general performance testing while loading data

## Minutes (03/06/2025)
Our team met with Julie. We first discussed our plans to recreate the database from scratch as we continued to have no response from the previous development team. In addition, we discussed how cards sometimes do not appear on the application and the Render backend must be restarted in order to fix this issue. This may be due to Render service limitations which would require a backend upgrade. When asked what tests the application must be able to pass, Julie told the team that we should test for the project requirements that have been previously established.

## Retrospective Summary (03/06/2025)
Here's what went well:
  * We established our plans to overcome database issues.
  * We communicated with the client to establish what we must test for
  * We addressed potential backend issues
 
Here's what we'd like to improve:
   * We aren't sure of what causes issues with the backend, so a backend upgrade may not fix these problems. More investigation into the cause of these problems are needed in the future.
  
Here are changes we plan to implement as soon as possible:
   * We will create a new database with new cards
   * We will write testing plans and establish a schedule to begin testing
   * We will continue development of features such as bookmarking and sorting as best we can without functional cards.
     
## Agenda (03/20/2025)
 * Progress with New Database (Zachary)
 We want to discuss switching database to Microsoft Azure.
 We will mention new account created to manage database, and share account credentials with client.
 We want to discuss server power scalability of new database and new advantages of using Azure.

* Progress with Bookmarks/Favorites (Yaru)
We will show demo of current functionality

* Progress with Sorting Cards (Jonathan)
We will show demo of current functionality

## Minutes (03/20/2025)
Our team met with Julie. We discussed our plans to use Microsoft Azure for our new database rather than Aiven because of its scalability, and we shared account credentials for the database with her. We also discussed our loss of access to the old database. Julie mentioned that most of the cards contained in the old database were fake test cards, and she offered to get in contact with the owners of any real cards so that the card information could be recovered and copied into the new database. We discussed how all account information on the old database was also lost, and anyone who had an account must make a new account to be added to the new database. Our team also shared plans to add new test cards. As the new database is still being developed, we could not demo any new features without any cards, but we shared our progress for the bookmarking and card sorting features.

## Retrospective Summary (03/20/2025)
Here's what went well:
  * We established a more detailed plan for the new database and informed the client of our plan.
  * We gave the client access to the new database.
  * We established a method to retrieve lost data.
 
Here's what we'd like to improve:
   * Because the client is not knowledgeable on the technical side of this project, it has been difficult to convey how exactly database problems will affect the development schedule. We can improve their understanding of the project.
  
Here are changes we plan to implement as soon as possible:
   * We will begin running the new database.
   * We will add new test data and old real data into the database.
   * We will continue development of features such as bookmarking and sorting as best we can without functional cards.

## Agenda (03/27/2025)
 * Data Storage
 We want to discuss creating a new Google Cloud data storage for files/images.
 We want to discuss necessary storage and pricing plan to meet project goals.

 * Thumbnails
 We will update client on card thumbnail development progress.
 
 * Bookmarks
 We will update client on bookmark feature development progress.

 * Testing Plans
 We will inform client of testing plans documentation in the GitHub repository.

## Minutes (03/27/2025)
Our team met with Julie and Jan. We discussed how the previous Google Cloud data storage used for the project was no longer being paid for, so our team planned on creating new cloud storage. This would allow for cards to feature thumbnails and file attachments. Our team initially selected a storage capacity of 500 GiB, however the client suggested starting at 100 GiB storage capacity and scaling up as needed, meaning the data storage could operate using only $2 per month. As the new database is still being developed, we could not demo any new features without any cards, but we shared our progress for the thumbnail and bookmarking features. We informed the client of our testing plans available in the GitHub repository.

## Retrospective Summary (03/27/2025)
Here's what went well:
  * We established a plan to recreate the data storage service.
  * The clients informed us of the storage size that would be needed to hold all application files.
 
Here's what we'd like to improve:
   * The client is not knowledgeable with the technical side of this project, so we can better communicate what gets stored in the database compared to what gets stored in Google Cloud.
  
Here are changes we plan to implement as soon as possible:
   * We will begin running the new database and Google Cloud storage.
   * We will add new test data and old real data into the database.
   * We will continue development of features such as bookmarking and sorting as best we can without functional cards.


