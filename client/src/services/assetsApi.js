// ============================================================================
// ASSETS API SERVICE
// ============================================================================
// Module : Matériel IT (Phase 10)
// Description : Service pour communiquer avec l'API assets
// Adapté pour VITE (utilise import.meta.env)
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper pour gérer les erreurs
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Une erreur est survenue');
  }
  return response.json();
};

// Helper pour les headers avec token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ============================================================================
// API ASSETS
// ============================================================================

export const assetsApi = {
  
  // GET /api/assets - Liste avec filtres et pagination
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.asset_type) params.append('asset_type', filters.asset_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.manufacturer) params.append('manufacturer', filters.manufacturer);
    if (filters.search) params.append('search', filters.search);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    
    const url = `${API_URL}/api/assets${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // GET /api/assets/stats - Statistiques
  getStats: async () => {
    const response = await fetch(`${API_URL}/api/assets/stats`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // GET /api/assets/:id - Détails d'un asset
  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/assets/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // POST /api/assets - Créer un asset
  create: async (assetData) => {
    const response = await fetch(`${API_URL}/api/assets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assetData)
    });
    
    return handleResponse(response);
  },
  
  // PUT /api/assets/:id - Mettre à jour un asset
  update: async (id, assetData) => {
    const response = await fetch(`${API_URL}/api/assets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(assetData)
    });
    
    return handleResponse(response);
  },
  
  // DELETE /api/assets/:id - Supprimer (soft delete)
  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/assets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // POST /api/assets/:id/assign - Assigner à un employé
  assign: async (id, assignmentData) => {
    const response = await fetch(`${API_URL}/api/assets/${id}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assignmentData)
    });
    
    return handleResponse(response);
  },
  
  // POST /api/assets/:id/unassign - Retourner un asset
  unassign: async (id, returnData) => {
    const response = await fetch(`${API_URL}/api/assets/${id}/unassign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(returnData)
    });
    
    return handleResponse(response);
  },
  
  // GET /api/assets/:id/history - Historique des assignations
  getHistory: async (id) => {
    const response = await fetch(`${API_URL}/api/assets/${id}/history`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  }
};

export default assetsApi;