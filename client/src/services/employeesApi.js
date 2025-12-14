// ============================================================================
// EMPLOYEES API SERVICE - VERSION COMPLÈTE AVEC ASSETS
// ============================================================================
// Module : Employés (Phase 9 + Phase 10 Jour 4)
// Description : Service pour communiquer avec l'API employés
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
// API EMPLOYEES
// ============================================================================

export const employeesApi = {
  
  // GET /api/employees - Liste avec filtres et pagination
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.status) params.append('status', filters.status);
    if (filters.department) params.append('department', filters.department);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    
    const url = `${API_URL}/api/employees${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // GET /api/employees/:id - Détails d'un employé
  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // 🆕 GET /api/employees/:id/assets - Assets assignés à l'employé
  // PHASE 10 - JOUR 4 : INTÉGRATION EMPLOYÉS ↔ MATÉRIEL
  getEmployeeAssets: async (employeeId) => {
    const response = await fetch(`${API_URL}/api/employees/${employeeId}/assets`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // POST /api/employees - Créer un employé
  create: async (employeeData) => {
    const response = await fetch(`${API_URL}/api/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(employeeData)
    });
    
    return handleResponse(response);
  },
  
  // PUT /api/employees/:id - Mettre à jour un employé
  update: async (id, employeeData) => {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(employeeData)
    });
    
    return handleResponse(response);
  },
  
  // DELETE /api/employees/:id - Supprimer (soft delete)
  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  },
  
  // GET /api/employees/stats - Statistiques
  getStats: async () => {
    const response = await fetch(`${API_URL}/api/employees/stats`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse(response);
  }
};

export default employeesApi;