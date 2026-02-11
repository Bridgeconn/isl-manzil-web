import axios from 'axios';

export const API = axios.create({
  baseURL: import.meta.env.VITE_FASTAPI_BASE_URL || "http://localhost:8000",
  withCredentials: true
});