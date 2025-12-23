// ============================================================================
// ASSETS VIEW - VERSION RÉELLE AVEC APPELS API
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Package, Shield, DollarSign, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import API_URL from '../../config/api';

const AssetsView = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`${API_URL}/api/dashboard/assets`, { headers });
            
            if (!response.ok) {
                throw new Error('Erreur chargement données assets');
            }

            const result = await response.json();
            setData(result);

        } catch (err) {
            console.error('Erreur fetch assets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-900 mb-2">Erreur</h2>
                <p className="text-red-700">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (!data && !loading) {
        return <div className="text-center py-12">Aucune donnée disponible</div>;
    }

    const totalAssets = data?.byType?.reduce((sum, t) => sum + parseInt(t.count || 0), 0) || 0;
    const underWarranty = data?.warranty?.under_warranty || 0;
    const expiredWarranty = data?.warranty?.expired_warranty || 0;
    const expiringWarranty = data?.expiringWarranty?.length || 0;

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Assets"
                    value={formatNumber(totalAssets)}
                    subtitle="dans le parc"
                    icon={Package}
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="Valeur Totale"
                    value={formatCurrency(data?.value?.total || 0, 0)}
                    subtitle={`Moy: ${formatCurrency(data?.value?.average || 0, 0)}`}
                    icon={DollarSign}
                    color="indigo"
                    loading={loading}
                />
                <StatCard
                    title="Sous Garantie"
                    value={formatNumber(underWarranty)}
                    subtitle={`${expiredWarranty} expirées`}
                    icon={Shield}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Garanties Expirant"
                    value={formatNumber(expiringWarranty)}
                    subtitle="sous 30 jours"
                    icon={AlertTriangle}
                    color={expiringWarranty > 0 ? 'orange' : 'green'}
                    loading={loading}
                />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets par type */}
                <ChartCard
                    title="Assets par Type"
                    subtitle="Répartition du parc"
                    icon={Package}
                    loading={loading}
                >
                    {data?.byType && data.byType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={data.byType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="asset_type" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: '2px solid #E5E7EB' }}
                                />
                                <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} name="Nombre" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Aucun asset
                        </div>
                    )}
                </ChartCard>

                {/* Assets par statut */}
                <ChartCard
                    title="Assets par Statut"
                    subtitle="Distribution"
                    icon={Package}
                    loading={loading}
                >
                    {data?.byStatus && data.byStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={data.byStatus}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    label={(entry) => `${entry.status}: ${entry.count}`}
                                >
                                    {data.byStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Aucun statut
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Alertes garanties */}
            {data?.expiringWarranty && data.expiringWarranty.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                            Garanties expirant sous 30 jours
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {data.expiringWarranty.map((asset, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">{asset.model || 'Sans modèle'}</p>
                                    <p className="text-sm text-gray-600">
                                        {asset.asset_type} - S/N: {asset.serial_number}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-orange-600">
                                        {new Date(asset.warranty_end_date).toLocaleDateString('fr-FR')}
                                    </p>
                                    <p className="text-sm text-gray-600">Expiration</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetsView;