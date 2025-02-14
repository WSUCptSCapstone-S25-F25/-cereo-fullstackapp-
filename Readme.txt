How to Run the Living Atlas Web Application:


*** URL where app is deployed: ***
https://verdant-beignet-476e34.netlify.app/ 


TO RUN THE APP LOCALLY:
Open a new terminal and check that the following libraries are installed:
   * python3
   * pip (used for installing required libraries to run backend)
   * node.js (this enables npm commands)

Running the Frontend:
   1. Go into the "/client" directory
   2. Open this directory in a terminal
   3. Type in "npm install" to enable React and all of the node modules used.
   4. Run the command “npm start” to initialize the front end in port 3000.

Running the Backend:
   1. Open a new terminal and navigate to the “/backend” directory.
   2. Use “pip install -r requirements.txt” in order to install all of the requirements.
   3. Use “uvicorn main:app --reload” to locally host the back end in port 8000 (“--reload” makes the backend restart anytime an update happens to a file; you can choose to leave this part out).
         3.a. If the above command doesn’t work, then you can try running “python .\main.py” instead
   4. In order to run the docs for the backend and test each individual endpoint, go to http://localhost:8000/docs in your browser.

Connecting The Frontend And Local Backend:
   1. By default, the frontend should be connected to the hosted backend on Render. This can be checked by looking into the JavaScript file named “api.js” found inside of the /client/src directory.
   2. Each baseURL found in this file will have a comment describing where it is deployed. Comment out all of these hosted baseURL statements.
   3. To switch to the local backend, simply uncomment “baseURL: ‘http://localhost:8000’”. 

To close the application, you can go back to each terminal and do the command Ctrl+C in order to end the process and free up localhost port 3000 and 8000 (if you forget to do this its not the end of the world but it might not let you delete files in the project without restarting your pc. Also if you do "npm start" again it will now ask you to open it in port 3001 instead since 3000 is busy.)
