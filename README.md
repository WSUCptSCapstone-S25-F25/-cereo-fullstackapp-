# CEREO Living Atlas Enhancements
## Project Summary
### One-sentence description of the project:
Enhancing the CEREO Living Atlas to improve scalability, performance, and usability for environmental data visualization and collaboration.

### Elevator Pitch:
The CEREO Living Atlas is a geospatial web application designed to support researchers, tribal communities, and government agencies in monitoring and sharing environmental data, particularly water quality in the Columbia River Basin. This project focuses on improving the system's scalability, automating workflows, and refining its user interface to create a more robust and user-friendly platform for environmental collaboration.

### Additional Information About the Project
The Living Atlas is a vital tool developed by the Center for Environmental Research, Education, and Outreach (CEREO) at Washington State University. It enables dynamic, user-contributed geospatial data visualization and serves as a platform for fostering collaboration on environmental issues. This enhancement project will address limitations in the current system, such as performance bottlenecks and usability challenges, while introducing new features and optimizing the backend for handling larger datasets.

## Installation
### Prerequisites
Git: Ensure Git is installed on your machine.
Python: Python 3.8 or higher is required.
PostgreSQL: Version 13 or higher with PostGIS extension enabled.
Node.js: Version 16 or higher for frontend dependencies.
pipenv: For managing Python dependencies.
### Add-ons
Mapbox: For geospatial data visualization and advanced mapping features.
React: Frontend framework for building a dynamic and responsive user interface.
FastAPI: Backend framework for efficient server-side operations.
PostGIS: Geospatial database extension for PostgreSQL to store and query spatial data.
### Installation Steps
Clone the repository:
bash
Copy
Edit
git clone https://github.com/yourusername/cereo-living-atlas.git
cd cereo-living-atlas
Set up the backend:
bash
Copy
Edit
cd backend
pipenv install
pipenv shell
python manage.py migrate
python manage.py runserver
Set up the frontend:
bash
Copy
Edit
cd frontend
npm install
npm start
Seed the database (optional):
bash
Copy
Edit
python manage.py loaddata seed_data.json

### Running the Application Locally

Ensure the following are installed:
- Python 3.12 or higher
- Pip (for backend dependencies)  
- Node.js (enables npm commands)
- PostgreSQL 17

#### Starting the Frontend  
1. Navigate to `/client` and open a terminal.  
2. Run `npm install` to install dependencies.  
3. Start the frontend with `npm start` (runs on port 3000).  

#### Starting the Backend  
1. Open a terminal and go to `/backend`.  
2. Run `pip install -r requirements.txt` to install dependencies. 
   - If it prompts pg_config-related errors, make sure PostgreSQL is installed, then run `setx PATH "%PATH%;C:\Program Files\PostgreSQL\17\bin` in terminal.
3. Start the backend with `uvicorn main:app --reload` (runs on port 8000).  
   - If this fails, try `python .\main.py` instead.  
4. Access API docs at http://localhost:8000/docs.  

#### Connecting Frontend to Local Backend  
1. Open `/client/src/api.js`.  
2. Comment out hosted `baseURL` lines.  
3. Uncomment `baseURL: 'http://localhost:8000'`.  

#### Stopping the Application  
Press **Ctrl + C** in each terminal to free ports 3000 and 8000. If not stopped, `npm start` may prompt using port 3001 instead.  


## Functionality
The Living Atlas supports the following features:

Interactive map visualization for water quality and environmental datasets.
User-contributed data with dynamic updates.
Advanced filtering options for geospatial data.
Automated workflows for user account management and data input.
Scalability to handle larger datasets and more concurrent users.
Usage Instructions
Launch the application by running the backend and frontend servers.
Access the application via http://localhost:3000 in your browser.
Log in or create an account to contribute data.
Use the map interface to explore datasets or upload new geospatial information.
## Known Problems
Performance under high load: Scaling tests are in progress to address potential issues with large datasets.
UI responsiveness: Some pages may load slowly during heavy operations; optimizations are planned.
Map rendering bugs: Occasional glitches with rendering layers; debugging in progress.
## Contributing
Fork it!
Create your feature branch:
bash
Copy
Edit
git checkout -b my-new-feature
Commit your changes:
bash
Copy
Edit
git commit -am 'Add some feature'
Push to the branch:
bash
Copy
Edit
git push origin my-new-feature
Submit a pull request! 🎉
## Additional Documentation
Sprint Reports: docs/sprint-reports.md
User Manual: docs/user-manual.md
## License

