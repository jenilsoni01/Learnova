import axios from 'axios';

const backend_url = import.meta.env.VITE_SERVER;
const api = axios.create({
  baseURL: backend_url || 'http://localhost:3000/api',
  withCredentials: true,
});
export default api;
