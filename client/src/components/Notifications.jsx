// client/src/components/Notifications.jsx
// Version corrigée sans boucle infinie

import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

const Notifications = ({ onContractClick }) => {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const { token } = useAuth();

    // Fermer le dropdown si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Charger les contrats et calculer les alertes
    const fetchAlerts = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/contracts?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const contracts = data.contracts || [];

                // Calculer les alertes
                const today = new Date();
                const alertList = [];

                contracts.forEach(contract => {
                    if (!contract.renewal_date) return;

                    const renewalDate = new Date(contract.renewal_date);
                    const noticeDeadline = new Date(renewalDate);
                    noticeDeadline.setDate(renewalDate.getDate() - (contract.notice_period_days || 0));

                    const msInDay = 1000 * 60 * 60 * 24;
                    const daysUntilDeadline = Math.ceil((noticeDeadline.getTime() - today.getTime()) / msInDay);

                    // Alertes pour les contrats qui approchent de la deadline de préavis
                    if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
                        let severity = 'info';
                        let message = '';

                        if (daysUntilDeadline <= 7) {
                            severity = 'critical';
                            message = `Préavis expire dans ${daysUntilDeadline} jour(s) !`;
                        } else if (daysUntilDeadline <= 14) {
                            severity = 'warning';
                            message = `Préavis expire dans ${daysUntilDeadline} jours`;
                        } else {
                            severity = 'info';
                            message = `Préavis expire dans ${daysUntilDeadline} jours`;
                        }

                        alertList.push({
                            id: contract.id,
                            name: contract.name,
                            provider: contract.provider,
                            renewalDate: contract.renewal_date,
                            daysLeft: daysUntilDeadline,
                            severity,
                            message
                        });
                    } else if (daysUntilDeadline <= 0) {
                        alertList.push({
                            id: contract.id,
                            name: contract.name,
                            provider: contract.provider,
                            renewalDate: contract.renewal_date,
                            daysLeft: 0,
                            severity: 'critical',
                            message: 'Préavis dépassé ! Action urgente requise'
                        });
                    }
                });

                alertList.sort((a, b) => {
                    const severityOrder = { critical: 0, warning: 1, info: 2 };
                    return severityOrder[a.severity] - severityOrder[b.severity] || a.daysLeft - b.daysLeft;
                });

                setAlerts(alertList);
            }
        } catch (err) {
            console.error('Erreur récupération alertes:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Charger au montage + intervalle 5 min (PAS de dépendances problématiques)
    useEffect(() => {
        if (!token) return;
        
        fetchAlerts(); // Chargement initial
        
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // 5 minutes
        
        return () => clearInterval(interval);
    }, []); // ✅ Tableau vide = se déclenche UNE FOIS au montage

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const totalCount = alerts.length;

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'critical':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: 'text-red-500',
                    badge: 'bg-red-500'
                };
            case 'warning':
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    text: 'text-orange-800',
                    icon: 'text-orange-500',
                    badge: 'bg-orange-500'
                };
            default:
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: 'text-yellow-500',
                    badge: 'bg-yellow-500'
                };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
                <Bell className={`w-6 h-6 text-gray-700 ${totalCount > 0 ? 'animate-pulse' : ''}`} />
                
                {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                        {totalCount > 0 && (
                            <div className="flex gap-2 mt-2 text-xs">
                                {criticalCount > 0 && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                                        {criticalCount} Critique{criticalCount > 1 ? 's' : ''}
                                    </span>
                                )}
                                {warningCount > 0 && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                                        {warningCount} Attention
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                Chargement...
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Aucune notification</p>
                                <p className="text-sm text-gray-400 mt-1">Tous vos contrats sont à jour</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {alerts.map(alert => {
                                    const styles = getSeverityStyles(alert.severity);
                                    return (
                                        <div
                                            key={alert.id}
                                            onClick={() => {
                                                onContractClick(alert.id);
                                                setIsOpen(false);
                                            }}
                                            className={`p-4 ${styles.bg} border-l-4 ${styles.border} hover:bg-opacity-80 cursor-pointer transition`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={styles.icon}>
                                                    {alert.severity === 'critical' ? (
                                                        <AlertCircle className="w-5 h-5" />
                                                    ) : (
                                                        <Clock className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-semibold ${styles.text} truncate`}>
                                                        {alert.name}
                                                    </p>
                                                    {alert.provider && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {alert.provider}
                                                        </p>
                                                    )}
                                                    <p className={`text-sm ${styles.text} mt-1 font-medium`}>
                                                        {alert.message}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                        <Calendar className="w-3 h-3" />
                                                        Renouvellement : {formatDate(alert.renewalDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;