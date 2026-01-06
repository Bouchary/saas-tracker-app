// client/src/pages/PurchaseRequestsToApprovePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PurchaseRequestsToApprovePage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const urgencyColors = {
    normal: 'text-gray-600',
    urgent: 'text-orange-600',
    critical: 'text-red-600'
  };

  const urgencyIcons = {
    normal: '🟢',
    urgent: '🟠',
    critical: '🔴'
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/to-approve`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Demandes à valider</h1>
        <p className="text-gray-600 mt-1">
          {requests.length} demande{requests.length > 1 ? 's' : ''} en attente de votre validation
        </p>
      </div>

      {/* Liste */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune demande en attente
          </h3>
          <p className="text-gray-600">
            Vous n'avez aucune demande à valider pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              onClick={() => navigate(`/purchase-requests/${request.id}`)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{urgencyIcons[request.urgency]}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.request_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Par {request.requester_email} • {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {request.title}
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-600">Montant</div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: request.currency
                        }).format(request.amount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-600">Catégorie</div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.category}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-600">Urgence</div>
                      <div className={`text-sm font-medium capitalize ${urgencyColors[request.urgency]}`}>
                        {request.urgency}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-600">Ma position</div>
                      <div className="text-sm font-medium text-gray-900">
                        Valideur #{request.order_position}
                      </div>
                    </div>
                  </div>

                  {request.justification && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="text-xs font-medium text-blue-900 mb-1">Justification</div>
                      <div className="text-sm text-blue-900 line-clamp-3">
                        {request.justification}
                      </div>
                    </div>
                  )}

                  {request.needed_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📅</span>
                      Date souhaitée : {new Date(request.needed_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/purchase-requests/${request.id}`);
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg whitespace-nowrap"
                  >
                    Voir détails
                  </button>

                  {request.urgency === 'critical' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full text-center">
                      CRITIQUE
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note :</strong> Les demandes s'affichent ici uniquement lorsque c'est votre tour de valider. 
              Les validations se font dans l'ordre défini par les règles d'approbation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestsToApprovePage;