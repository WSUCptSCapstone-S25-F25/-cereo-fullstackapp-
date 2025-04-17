import axios from "axios";

const api = axios.create({

  baseURL: 'https://cereo-backend.onrender.com', // New backend URL
  // baseURL: 'https://livingatlasbackend-36wl.onrender.com' //CEREO's Render.com Backend Link
  //baseURL: 'https://living-atlas-render.onrender.com', // Josh's Render.com Backend
  // baseURL: 'http://localhost:8000', 



  //https://verdant-smakager-ef450d.netlify.app    //Netlify Frontend Link
});

export default api; 