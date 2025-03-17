
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'  // Development backend URL
  : 'https://your-vercel-url.vercel.app'; // Production backend URL

export default API_BASE_URL;
