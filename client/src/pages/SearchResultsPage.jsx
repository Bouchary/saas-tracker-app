import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, FileText, Users, Package, ShoppingCart, Calendar, DollarSign, TrendingUp } from 'lucide-react';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
    } else {
      setLoading(false);
    }
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'contract': return <FileText className="w-5 h-5" />;
      case 'employee': return <Users className="w-5 h-5" />;
      case 'asset': return <Package className="w-5 h-5" />;
      case 'purchase_request': return <ShoppingCart className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  const getLink = (item) => {
    switch (item.type) {
      case 'contract': return `/contracts`;
      case 'employee': return `/employees/${item.id}`;
      case 'asset': return `/assets/${item.id}`;
      case 'purchase_request': return `/purchase-requests/${item.id}`;
      default: return '#';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      in_approval: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatValue = (item) => {
    if (item.value && item.type === 'contract') {
      return `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.value)}/mois`;
    }
    if (item.value && item.type === 'asset') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.value);
    }
    if (item.value && item.type === 'purchase_request') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.value);
    }
    return item.value || '';
  };

  const ResultCard = ({ item }) => (
    <Link
      to={getLink(item)}
      className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          {getIcon(item.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{item.title}</h3>
              {item.subtitle && (
                <p className="text-sm text-gray-600 truncate">{item.subtitle}</p>
              )}
            </div>
            {item.status && getStatusBadge(item.status)}
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            {item.value && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {formatValue(item)}
              </span>
            )}
            {item.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(item.date).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  if (query.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recherche globale</h2>
        <p className="text-gray-600">Saisissez au moins 2 caractères pour lancer la recherche</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-red-600 mb-4">⚠️ {error}</div>
      </div>
    );
  }

  if (!results || results.totalResults === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun résultat</h2>
        <p className="text-gray-600">Aucun résultat trouvé pour "{query}"</p>
      </div>
    );
  }

  const tabs = [
    { key: 'all', label: 'Tout', count: results.totalResults },
    { key: 'contracts', label: 'Contrats', count: results.results.contracts.length },
    { key: 'employees', label: 'Employés', count: results.results.employees.length },
    { key: 'assets', label: 'Matériel', count: results.results.assets.length },
    { key: 'purchaseRequests', label: 'Demandes', count: results.results.purchaseRequests.length }
  ];

  const filteredResults = activeTab === 'all' 
    ? [
        ...results.results.contracts,
        ...results.results.employees,
        ...results.results.assets,
        ...results.results.purchaseRequests
      ]
    : results.results[activeTab] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Résultats de recherche
        </h1>
        <p className="text-gray-600">
          {results.totalResults} résultat{results.totalResults > 1 ? 's' : ''} pour "{query}"
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredResults.map((item, index) => (
          <ResultCard key={`${item.type}-${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
};

export default SearchResultsPage;