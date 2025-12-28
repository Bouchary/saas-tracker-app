// ============================================================================
// PAGE - GESTION DES UTILISATEURS
// ============================================================================
// Fichier : client/src/pages/UsersPage.jsx
// Description : Page complète de gestion des utilisateurs (super_admin/admin/owner)
// ✅ TOUTES FONCTIONNALITÉS : Stats, filtres, modal, linked employees
// ✅ CORRECTION : Support du rôle 'owner' dans badges et icônes
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Search, UserCheck, UserX, Crown, User as UserIcon, Award } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

const UsersPage = () => {
  const { token, user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.status === 403) {
        setError('Accès refusé : vous devez être administrateur');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingUser
        ? `${API_URL}/api/users/${editingUser.id}`
        : `${API_URL}/api/users`;

      const method = editingUser ? 'PUT' : 'POST';

      // Si mode édition et pas de nouveau mot de passe, ne pas l'envoyer
      const payload = { ...formData };
      if (editingUser && !formData.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur');
      }

      // Recharger la liste
      await fetchUsers();

      // Réinitialiser le formulaire
      setFormData({ email: '', password: '', role: 'user' });
      setEditingUser(null);
      setShowForm(false);

    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (selectedUser) => {
    setEditingUser(selectedUser);
    setFormData({
      email: selectedUser.email,
      password: '',
      role: selectedUser.role
    });
    setShowForm(true);
  };

  const handleDelete = async (selectedUser) => {
    if (!confirm(`Supprimer l'utilisateur ${selectedUser.email} ?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de suppression');
      }

      await fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'super_admin') return <Crown className="w-5 h-5 text-yellow-600" />;
    if (role === 'owner') return <Award className="w-5 h-5 text-purple-600" />;
    if (role === 'admin') return <Shield className="w-5 h-5 text-blue-600" />;
    return <UserIcon className="w-5 h-5 text-gray-600" />;
  };

  const getRoleBadge = (role) => {
    const styles = {
      super_admin: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      owner: 'bg-purple-100 text-purple-800 border-purple-300',
      admin: 'bg-blue-100 text-blue-800 border-blue-300',
      user: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const labels = {
      super_admin: 'Super Admin',
      owner: 'Propriétaire',
      admin: 'Admin',
      user: 'Utilisateur'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 ${styles[role] || styles.user}`}>
        {getRoleIcon(role)}
        {labels[role] || 'Utilisateur'}
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
        <p className="text-red-800 font-semibold mb-2">❌ Erreur</p>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
              <p className="text-gray-600">Créer et gérer les comptes utilisateurs</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingUser(null);
              setFormData({ email: '', password: '', role: 'user' });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <p className="text-gray-600 text-sm mb-1">Total utilisateurs</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <p className="text-purple-600 text-sm mb-1">Propriétaires</p>
            <p className="text-2xl font-bold text-purple-900">
              {users.filter(u => u.role === 'owner').length}
            </p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-600 text-sm mb-1">Super Admins</p>
            <p className="text-2xl font-bold text-yellow-900">
              {users.filter(u => u.role === 'super_admin').length}
            </p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-blue-600 text-sm mb-1">Admins</p>
            <p className="text-2xl font-bold text-blue-900">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <p className="text-gray-600 text-sm mb-1">Utilisateurs</p>
            <p className="text-2xl font-bold text-gray-900">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                required
                disabled={editingUser}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe {editingUser && '(laisser vide pour ne pas modifier)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                required={!editingUser}
                minLength={6}
                placeholder={editingUser ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
              />
              {!editingUser && <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                required
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
                {['owner', 'super_admin'].includes(user?.role) && <option value="super_admin">Super Admin</option>}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105"
              >
                {editingUser ? 'Enregistrer' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ email: '', password: '', role: 'user' });
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 mb-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
          >
            <option value="">Tous les rôles</option>
            <option value="owner">Propriétaire</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">Utilisateur</option>
          </select>
        </div>
        
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-semibold text-indigo-600">{filteredUsers.length}</span> utilisateur(s) trouvé(s)
        </p>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rôle</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employés liés</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Créé le</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="px-6 py-4">
                    {u.employees_count > 0 ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <UserCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">{u.employees_count} employé(s)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <UserX className="w-4 h-4" />
                        <span className="text-sm">Aucun</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;