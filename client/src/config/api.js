// client/src/config/api.js
// Configuration centralisée de l'URL de l'API

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper pour construire des URLs complètes
export const buildApiUrl = (endpoint) => {
  // Enlever le slash initial si présent
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${cleanEndpoint}`;
};

export default API_URL;