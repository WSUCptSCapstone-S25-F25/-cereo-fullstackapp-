# LivingAtlas1


## To use 
- Make sure you have these installed
    - Python3
    - Node.js
    - npm
- Create a virtual environment
    - `python -m venv myenv`
    - On Windows `myenv/Scripts/activate`
    - On macOS and Linux `source myenv/bin/activate`
- Managing the virtual environment
    - When you want to leave use `deactivate`
    - Make sure to upgrade pip `python -m pip install --upgrade pip`
- Install packages from requirements.txt before running the Living Atlas
    - `pip install -r requirements.txt`


### To Run the Living Atlas
- In 1st terminal navigate to the /LivingAtlas1/client folder 
    - Use `npm start`
- In 2nd terminal navigate to the /LivingAtlas1/backend folder
    - Use `uvicorn main:app --reload`


---
**Developed by Students at WSU**