import axios from "axios";

const api = axios.create({
  baseURL: 'https://cereo-backend.onrender.com', // New backend URL UNCOMENT IF DEPLOYING TO WEBAPP!!!!!!
  //baseURL: 'http://localhost:8000', //Local Backend (Uncommit if running locally)
  timeout: 30000, // 30 second timeout
  //https://verdant-smakager-ef450d.netlify.app    //Netlify Frontend Link
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('DEBUG: API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('DEBUG: API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('DEBUG: API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('DEBUG: API Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      }
    });
    return Promise.reject(error);
  }
);

export default api; 
