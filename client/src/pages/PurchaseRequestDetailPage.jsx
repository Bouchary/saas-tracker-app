import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PurchaseRequestDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [approvers, setApprovers] = useState([]);
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const [contractData, setContractData] = useState({
  name: '',
  provider: '',
  monthly_cost: '',
  renewal_date: '',
  notice_period_days: 30,
  pricing_model: 'fixed',
  unit_cost: '',
  license_count: '',
  licenses_used: '',
  real_users: ''
});

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_approval: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800'
  };

  const statusLabels = {
    draft: 'Brouillon',
    pending: 'En attente',
    in_approval: 'En validation',
    approved: 'Approuvée',
    rejected: 'Rejetée',
    converted: 'Convertie'
  };

  const approvalStatusIcons = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
    skipped: '⏭️'
  };

  useEffect(() => {
    loadRequestDetails();
    loadHistory();
  }, [id]);

  const loadRequestDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequest(response.data.request);
      setApprovers(response.data.approvers || []);
      setFiles(response.data.files || []);
      
      setContractData({
        name: response.data.request.title,
        provider: response.data.request.supplier_name || '',
        monthly_cost: response.data.request.amount,
        renewal_date: response.data.request.needed_date || '',
        notice_period_days: 30,
        pricing_model: 'fixed',
        unit_cost: '',
        license_count: ''
      });
    } catch (error) {
      alert('Erreur chargement détails : ' + (error.response?.data?.error || error.message));
      navigate('/purchase-requests');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(response.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Soumettre cette demande pour validation ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Demande soumise !');
      loadRequestDetails();
      loadHistory();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}/approve`,
        { comments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Demande approuvée !');
      setShowApproveModal(false);
      setComments('');
      loadRequestDetails();
      loadHistory();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('La raison du rejet est obligatoire');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}/reject`,
        { rejection_reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Demande rejetée');
      setShowRejectModal(false);
      setRejectionReason('');
      loadRequestDetails();
      loadHistory();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleConvert = async () => {
  if (!contractData.name || !contractData.monthly_cost) {
    alert('Nom et montant sont requis');
    return;
  }

  if (contractData.pricing_model === 'per_user' && (!contractData.unit_cost || !contractData.license_count)) {
    alert('Coût unitaire et nombre de licences requis pour "Par utilisateur"');
    return;
  }

  try {
    setProcessing(true);
    const token = localStorage.getItem('token');
    
    const payload = {
      name: contractData.name,
      provider: contractData.provider,
      renewal_date: contractData.renewal_date,
      notice_period_days: contractData.notice_period_days,
      pricing_model: contractData.pricing_model
    };

    if (contractData.pricing_model === 'per_user') {
      payload.unit_cost = parseFloat(contractData.unit_cost);
      payload.license_count = parseInt(contractData.license_count);
      payload.monthly_cost = parseFloat(contractData.unit_cost) * parseInt(contractData.license_count);
      
      // ✅ AJOUTER licenses_used et real_users si renseignés
      if (contractData.licenses_used) {
        payload.licenses_used = parseInt(contractData.licenses_used);
      }
      if (contractData.real_users) {
        payload.real_users = parseInt(contractData.real_users);
      }
    } else {
      payload.monthly_cost = parseFloat(contractData.monthly_cost);
    }

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}/convert`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    alert('Demande convertie en contrat !');
    setShowConvertModal(false);
    navigate(`/contracts`);
  } catch (error) {
    alert('Erreur : ' + (error.response?.data?.error || error.message));
  } finally {
    setProcessing(false);
  }
};

  const handleDelete = async () => {
    if (!confirm('Supprimer cette demande ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Demande supprimée');
      navigate('/purchase-requests');
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    }
  };

  const calculatedCost = contractData.pricing_model === 'per_user' && contractData.license_count && contractData.unit_cost
  ? (parseFloat(contractData.license_count) * parseFloat(contractData.unit_cost)).toFixed(2)
  : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) return null;

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const canApprove = approvers.some(
    a => a.approver_id === currentUser?.id && 
         a.status === 'pending' && 
         a.order_position === request.current_approver_order
  );
  const canConvert = request.status === 'approved' && !request.contract_id && 
    ['owner', 'admin', 'super_admin', 'finance'].includes(currentUser?.role);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/purchase-requests')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Retour à la liste
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{request.request_number}</h1>
            <p className="text-xl text-gray-600 mt-1">{request.title}</p>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[request.status]}`}>
              {statusLabels[request.status]}
            </span>
            
            {request.status === 'draft' && (
              <>
                <Link
                  to={`/purchase-requests/${id}/edit`}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Modifier
                </Link>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Soumettre
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Supprimer
                </button>
              </>
            )}

            {canApprove && (
              <>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  ✓ Approuver
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  ✗ Rejeter
                </button>
              </>
            )}

            {canConvert && (
              <button
                onClick={() => setShowConvertModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                🔄 Convertir en contrat
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['details', 'validation', 'historique'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'details' && 'Détails'}
              {tab === 'validation' && `Validation (${approvers.length})`}
              {tab === 'historique' && `Historique (${history.length})`}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Montant</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: request.currency
                    }).format(request.amount)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Catégorie</div>
                  <div className="text-lg font-semibold text-gray-900">{request.category}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Urgence</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">{request.urgency}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Date souhaitée</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {request.needed_date 
                      ? new Date(request.needed_date).toLocaleDateString('fr-FR')
                      : 'Non spécifiée'
                    }
                  </div>
                </div>
              </div>

              {request.description && (
                <div className="mt-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{request.description}</div>
                </div>
              )}

              <div className="mt-6">
                <div className="text-sm font-medium text-gray-700 mb-2">Justification</div>
                <div className="text-gray-900 whitespace-pre-wrap bg-blue-50 p-4 rounded-lg">
                  {request.justification}
                </div>
              </div>
            </div>

            {(request.supplier_name || request.supplier_email) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fournisseur</h2>
                
                <div className="space-y-2">
                  {request.supplier_name && (
                    <div>
                      <span className="text-sm text-gray-600">Nom : </span>
                      <span className="text-gray-900">{request.supplier_name}</span>
                    </div>
                  )}
                  {request.supplier_contact && (
                    <div>
                      <span className="text-sm text-gray-600">Contact : </span>
                      <span className="text-gray-900">{request.supplier_contact}</span>
                    </div>
                  )}
                  {request.supplier_email && (
                    <div>
                      <span className="text-sm text-gray-600">Email : </span>
                      <a href={`mailto:${request.supplier_email}`} className="text-blue-600 hover:underline">
                        {request.supplier_email}
                      </a>
                    </div>
                  )}
                  {request.supplier_phone && (
                    <div>
                      <span className="text-sm text-gray-600">Téléphone : </span>
                      <span className="text-gray-900">{request.supplier_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600">Demandeur</div>
                  <div className="text-gray-900 font-medium">{request.requester_email}</div>
                </div>

                <div>
                  <div className="text-gray-600">Créée le</div>
                  <div className="text-gray-900">
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {request.submitted_at && (
                  <div>
                    <div className="text-gray-600">Soumise le</div>
                    <div className="text-gray-900">
                      {new Date(request.submitted_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && request.rejection_reason && (
                  <div>
                    <div className="text-red-600 font-medium">Raison du rejet</div>
                    <div className="text-gray-900 bg-red-50 p-3 rounded mt-2">
                      {request.rejection_reason}
                    </div>
                  </div>
                )}

                {request.contract_id && (
                  <div>
                    <div className="text-purple-600 font-medium">Contrat créé</div>
                    <Link to="/contracts" className="text-blue-600 hover:underline">
                      Voir le contrat
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {request.status === 'in_approval' && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">En cours de validation</h3>
                <div className="text-blue-700">
                  {request.approved_count || 0} / {request.total_approvers} validations
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${((request.approved_count || 0) / request.total_approvers) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'validation' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valideur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvers.map((approver) => (
                <tr key={approver.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {approver.order_position}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {approver.approver_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center">
                      <span className="mr-2">{approvalStatusIcons[approver.status]}</span>
                      <span className="capitalize">{approver.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {approver.decision_date 
                      ? new Date(approver.decision_date).toLocaleDateString('fr-FR')
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {approver.comments || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'historique' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex items-start pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 w-24 text-sm text-gray-600">
                    {new Date(item.performed_at).toLocaleDateString('fr-FR')}<br />
                    {new Date(item.performed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-grow ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.action === 'created' && '📝 Demande créée'}
                      {item.action === 'updated' && '✏️ Demande modifiée'}
                      {item.action === 'submitted' && '📤 Soumise pour validation'}
                      {item.action === 'approvers_assigned' && '👥 Valideurs assignés'}
                      {item.action === 'approved_by' && '✅ Approuvée'}
                      {item.action === 'rejected_by' && '❌ Rejetée'}
                      {item.action === 'fully_approved' && '✅ Entièrement approuvée'}
                      {item.action === 'file_uploaded' && '📎 Fichier ajouté'}
                      {item.action === 'converted_to_contract' && '🔄 Convertie en contrat'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Par {item.performed_by_email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Approuver la demande</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ajoutez un commentaire..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {processing ? 'Validation...' : 'Approuver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rejeter la demande</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                placeholder="Expliquez pourquoi vous rejetez cette demande..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {processing ? 'Rejet...' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConvertModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Convertir en contrat</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du contrat *</label>
          <input
            type="text"
            value={contractData.name}
            onChange={(e) => setContractData({...contractData, name: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
          <input
            type="text"
            value={contractData.provider}
            onChange={(e) => setContractData({...contractData, provider: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modèle de tarification</label>
          <select
            value={contractData.pricing_model}
            onChange={(e) => setContractData({...contractData, pricing_model: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="fixed">Fixe</option>
            <option value="per_user">Par utilisateur</option>
            <option value="usage_based">Basé sur l'utilisation</option>
            <option value="tiered">Échelonné</option>
          </select>
        </div>

        {contractData.pricing_model === 'fixed' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coût mensuel (€) *</label>
            <input
              type="number"
              step="0.01"
              value={contractData.monthly_cost}
              onChange={(e) => setContractData({...contractData, monthly_cost: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        )}

        {contractData.pricing_model === 'per_user' && (
          <div className="space-y-4 p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">Gestion des Licences</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Licences achetées *
                </label>
                <input
                  type="number"
                  value={contractData.license_count || ''}
                  onChange={(e) => setContractData({...contractData, license_count: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Ex: 100"
                />
                <p className="text-xs text-gray-600 mt-1">💼 Nombre de licences dans le contrat</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coût par licence (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={contractData.unit_cost || ''}
                  onChange={(e) => setContractData({...contractData, unit_cost: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Ex: 10.00"
                />
                <p className="text-xs text-gray-600 mt-1">💵 Prix par licence/utilisateur</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Licences attribuées
              </label>
              <input
                type="number"
                value={contractData.licenses_used || ''}
                onChange={(e) => setContractData({...contractData, licenses_used: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Ex: 85"
                max={contractData.license_count || undefined}
              />
              <p className="text-xs text-gray-600 mt-1">
                👥 Licences assignées légalement (max {contractData.license_count || '—'})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Utilisateurs réels <span className="text-gray-500">(optionnel)</span>
              </label>
              <input
                type="number"
                value={contractData.real_users || ''}
                onChange={(e) => setContractData({...contractData, real_users: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Ex: 120"
              />
              <p className="text-xs text-gray-600 mt-1">
                🔍 Nombre réel d'utilisateurs connectés (peut dépasser les licences achetées)
              </p>
            </div>

            {calculatedCost && (
              <div className="bg-white p-3 rounded-lg border-2 border-indigo-200">
                <div className="text-sm text-gray-700">
                  <strong>Coût mensuel total:</strong> {new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'}).format(calculatedCost)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {contractData.license_count} licences × {contractData.unit_cost}€
                </p>
              </div>
            )}
          </div>
        )}

        {(contractData.pricing_model === 'usage_based' || contractData.pricing_model === 'tiered') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coût mensuel estimé (€) *</label>
            <input
              type="number"
              step="0.01"
              value={contractData.monthly_cost}
              onChange={(e) => setContractData({...contractData, monthly_cost: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de renouvellement</label>
            <input
              type="date"
              value={contractData.renewal_date}
              onChange={(e) => setContractData({...contractData, renewal_date: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Préavis (jours)</label>
            <input
              type="number"
              value={contractData.notice_period_days}
              onChange={(e) => setContractData({...contractData, notice_period_days: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => setShowConvertModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onClick={handleConvert}
          disabled={processing || !contractData.name || !contractData.monthly_cost}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
        >
          {processing ? 'Conversion...' : 'Créer le contrat'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default PurchaseRequestDetailPage;