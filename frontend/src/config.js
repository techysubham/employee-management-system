// API configuration
// In production (Vercel), use relative paths
// In development, use the proxy configured in package.json
const API_URL = process.env.REACT_APP_API_URL || '/api';

export default API_URL;
