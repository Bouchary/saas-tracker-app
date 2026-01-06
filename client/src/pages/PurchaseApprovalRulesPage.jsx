// client/src/pages/PurchaseApprovalRulesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PurchaseApprovalRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_amount: '',
    max_amount: '',
    approver_1_id: '',
    approver_2_id: '',
    approver_3_id: '',
    priority: 1,
    is_active: true,
    applicable_categories: []
  });

  const [testData, setTestData] = useState({
    amount: '',
    category: ''
  });
  const [testResult, setTestResult] = useState(null);

  const categories = [
    'Équipement informatique',
    'Logiciels & Licences',
    'Mobilier',
    'Services',
    'Formation',
    'Fournitures',
    'Autre'
  ];

  useEffect(() => {
    loadRules();
    loadUsers();
  }, []);

  const loadRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchase-approval-rules`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRules(response.data);
    } catch (error) {
      console.error('Erreur chargement règles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // ✅ FIX : Gérer si response.data est un objet avec users dedans
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        console.error('Format users incorrect:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]); // ✅ FIX : Array vide par défaut
    }
  };

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        min_amount: rule.min_amount,
        max_amount: rule.max_amount || '',
        approver_1_id: rule.approver_1_id,
        approver_2_id: rule.approver_2_id || '',
        approver_3_id: rule.approver_3_id || '',
        priority: rule.priority,
        is_active: rule.is_active,
        applicable_categories: rule.applicable_categories || []
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        min_amount: '',
        max_amount: '',
        approver_1_id: '',
        approver_2_id: '',
        approver_3_id: '',
        priority: 1,
        is_active: true,
        applicable_categories: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        applicable_categories: formData.applicable_categories.length > 0 
          ? formData.applicable_categories 
          : null
      };

      if (editingRule) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/purchase-approval-rules/${editingRule.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/purchase-approval-rules`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setShowModal(false);
      loadRules();
      alert(editingRule ? 'Règle mise à jour !' : 'Règle créée !');
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleActive = async (ruleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/purchase-approval-rules/${ruleId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadRules();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Supprimer cette règle ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/purchase-approval-rules/${ruleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadRules();
      alert('Règle supprimée');
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTestRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/purchase-approval-rules/test`,
        testData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResult(response.data);
    } catch (error) {
      console.error('Erreur test:', error);
      alert('Erreur test : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const categories = [...prev.applicable_categories];
      const index = categories.indexOf(category);
      
      if (index > -1) {
        categories.splice(index, 1);
      } else {
        categories.push(category);
      }
      
      return { ...prev, applicable_categories: categories };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Règles d'approbation</h1>
          <p className="text-gray-600 mt-1">Configurez le workflow de validation des demandes</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          + Nouvelle règle
        </button>
      </div>

      {/* Test Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Tester une règle</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              value={testData.amount}
              onChange={(e) => setTestData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Ex: 2500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              value={testData.category}
              onChange={(e) => setTestData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Sélectionnez...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleTestRule}
              disabled={!testData.amount || !testData.category}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Tester
            </button>
          </div>
        </div>

        {testResult && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            {testResult.matched ? (
              <div>
                <div className="text-green-600 font-semibold mb-2">✓ Règle trouvée</div>
                <div className="text-sm text-gray-900">
                  <strong>{testResult.rule.name}</strong>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {testResult.approvers_count} valideur(s) :
                </div>
                <div className="mt-2 space-y-1">
                  {testResult.approvers && testResult.approvers.map((approver, index) => (
                    <div key={index} className="text-sm">
                      {index + 1}. {approver.email}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                ✗ Aucune règle ne correspond
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Règle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valideurs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                  <div className="text-sm text-gray-600">{rule.description}</div>
                  {rule.applicable_categories && rule.applicable_categories.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      Catégories : {rule.applicable_categories.join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rule.min_amount}€ - {rule.max_amount ? `${rule.max_amount}€` : '∞'}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm">
                    {rule.approver_1_email && (
                      <div>1. {rule.approver_1_email}</div>
                    )}
                    {rule.approver_2_email && (
                      <div>2. {rule.approver_2_email}</div>
                    )}
                    {rule.approver_3_email && (
                      <div>3. {rule.approver_3_email}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rule.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rule.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(rule)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune règle configurée
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingRule ? 'Modifier la règle' : 'Nouvelle règle'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant min (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant max (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Laisser vide = illimité"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valideur 1 *</label>
                <select
                  value={formData.approver_1_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, approver_1_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valideur 2 (optionnel)</label>
                <select
                  value={formData.approver_2_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, approver_2_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Aucun</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valideur 3 (optionnel)</label>
                <select
                  value={formData.approver_3_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, approver_3_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Aucun</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégories applicables (laisser vide = toutes)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.applicable_categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="mr-2"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Plus la priorité est haute, plus la règle est prioritaire</p>
                </div>

                <div>
                  <label className="flex items-center mt-8">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Règle active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingRule ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseApprovalRulesPage;