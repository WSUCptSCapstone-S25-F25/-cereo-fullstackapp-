import axios from "axios";

const api = axios.create({


  baseURL: 'https://cereo-backend.onrender.com', // New backend URL
  // baseURL: 'http://localhost:8000', //Local Backend (Uncommit if running locally)



  //https://verdant-smakager-ef450d.netlify.app    //Netlify Frontend Link
});

export default api; 
