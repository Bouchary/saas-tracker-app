// ============================================================================
// MODAL - LIER EMPLOYÉ À UN UTILISATEUR
// ============================================================================
// Fichier : client/src/components/AssignUserModal.jsx
// Description : Modal pour créer un nouveau user ou lier à un user existant
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Link as LinkIcon, Loader } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

const AssignUserModal = ({ isOpen, onClose, employee, onSuccess }) => {
  const { token } = useAuth();
  const [mode, setMode] = useState('create'); // 'create' ou 'link'
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    email: employee?.email || '',
    password: '',
    role: 'user',
    user_id: ''
  });

  useEffect(() => {
    if (isOpen && mode === 'link') {
      fetchUsers();
    }
  }, [isOpen, mode]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer les users qui ne sont pas déjà liés
        const availableUsers = data.users.filter(u => 
          !u.linked_employees || u.linked_employees.length === 0 || 
          u.linked_employees[0]?.id === null
        );
        setUsers(availableUsers);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        // Créer un nouveau user et le lier
        const response = await fetch(`${API_URL}/api/employees/${employee.id}/create-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la création');
        }

        const data = await response.json();
        if (onSuccess) onSuccess(data);
        onClose();

      } else {
        // Lier à un user existant
        const response = await fetch(`${API_URL}/api/employees/${employee.id}/assign-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: parseInt(formData.user_id)
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la liaison');
        }

        const data = await response.json();
        if (onSuccess) onSuccess(data);
        onClose();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Lier un utilisateur</h2>
              <p className="text-purple-100">
                {employee?.first_name} {employee?.last_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'create'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className={`w-5 h-5 ${
                  mode === 'create' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <span className={`font-semibold ${
                  mode === 'create' ? 'text-purple-900' : 'text-gray-700'
                }`}>
                  Créer nouveau
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Créer un compte utilisateur
              </p>
            </button>

            <button
              onClick={() => setMode('link')}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'link'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <LinkIcon className={`w-5 h-5 ${
                  mode === 'link' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`font-semibold ${
                  mode === 'link' ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  Lier existant
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Lier à un compte existant
              </p>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'create' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    L'employé utilisera cet email pour se connecter
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un utilisateur *
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choisir un utilisateur...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email} ({user.role})
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    ⚠️ Aucun utilisateur disponible. Créez-en un nouveau.
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-800">
                ❌ {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || (mode === 'link' && users.length === 0)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {mode === 'create' ? 'Création...' : 'Liaison...'}
                  </>
                ) : (
                  <>
                    {mode === 'create' ? 'Créer et lier' : 'Lier'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignUserModal;