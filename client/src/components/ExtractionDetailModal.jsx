// ============================================================================
// MODAL DÉTAILS EXTRACTION - VERSION PROPRE
// ============================================================================
// Composant séparé pour affichage lisible des données extraites
// ============================================================================

import React from 'react';
import { 
    FileText, Building, User, Calendar, DollarSign, 
    Package, Shield, AlertTriangle, Check, X,
    Mail, Phone, CreditCard, Clock
} from 'lucide-react';

const ExtractionDetailModal = ({ extraction, onClose }) => {
    if (!extraction) return null;

    const data = typeof extraction.extracted_data === 'string' 
        ? JSON.parse(extraction.extracted_data)
        : extraction.extracted_data;

    const Section = ({ title, icon: Icon, children }) => (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                {Icon && <Icon className="w-5 h-5 text-purple-600" />}
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="pl-7 space-y-2">
                {children}
            </div>
        </div>
    );

    const Field = ({ label, value }) => {
        if (!value || value === 'null' || value === null) return null;
        return (
            <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-600">{label}</dt>
                <dd className="col-span-2 text-sm text-gray-900">{value}</dd>
            </div>
        );
    };

    const Badge = ({ children, color = 'gray' }) => {
        const colors = {
            gray: 'bg-gray-100 text-gray-800',
            green: 'bg-green-100 text-green-800',
            blue: 'bg-blue-100 text-blue-800',
            purple: 'bg-purple-100 text-purple-800',
            red: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors[color]}`}>
                {children}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">{data.name || 'Document'}</h2>
                            <p className="text-purple-100 text-sm mt-1">
                                {extraction.original_filename}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                                <Badge color={extraction.document_type === 'invoice' ? 'green' : 'blue'}>
                                    {extraction.document_type === 'contract' ? 'Contrat' :
                                     extraction.document_type === 'invoice' ? 'Facture' :
                                     extraction.document_type === 'quote' ? 'Devis' : 'Autre'}
                                </Badge>
                                <span className="text-purple-100 text-sm">
                                    Confiance: {extraction.confidence_score}%
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center ml-4"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* Informations générales */}
                    {(data.provider || data.client || data.contract_number || data.description) && (
                        <Section title="Informations générales" icon={FileText}>
                            <dl className="space-y-3">
                                <Field label="Fournisseur" value={data.provider} />
                                <Field label="Client" value={data.client} />
                                <Field label="Numéro" value={data.contract_number || data.invoice_numbers?.[0] || data.po_numbers?.[0]} />
                                {data.description && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-600 mb-1">Description</dt>
                                        <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                            {data.description}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </Section>
                    )}

                    {/* Informations financières */}
                    {(data.monthly_cost || data.yearly_cost || data.total_contract_value || data.currency) && (
                        <Section title="Informations financières" icon={DollarSign}>
                            <dl className="space-y-3">
                                <Field 
                                    label="Coût mensuel" 
                                    value={data.monthly_cost ? `${data.monthly_cost} ${data.currency || 'EUR'}` : null} 
                                />
                                <Field 
                                    label="Coût annuel" 
                                    value={data.yearly_cost ? `${data.yearly_cost} ${data.currency || 'EUR'}` : null} 
                                />
                                <Field 
                                    label="Valeur totale" 
                                    value={data.total_contract_value ? `${data.total_contract_value} ${data.currency || 'EUR'}` : null} 
                                />
                                <Field label="Devise" value={data.currency} />
                                <Field 
                                    label="Modèle tarifaire" 
                                    value={
                                        data.pricing_model === 'per_user' ? 'Par utilisateur' :
                                        data.pricing_model === 'flat_fee' ? 'Prix fixe' :
                                        data.pricing_model === 'usage_based' ? 'Basé sur usage' :
                                        data.pricing_model === 'tiered' ? 'Paliers' :
                                        data.pricing_model
                                    } 
                                />
                                <Field label="Conditions paiement" value={data.payment_terms} />
                            </dl>

                            {/* Tableau des prix */}
                            {data.price_table && data.price_table.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-600 mb-2">Détail des prix</p>
                                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-gray-700">Palier</th>
                                                    <th className="px-3 py-2 text-left text-gray-700">Quantité</th>
                                                    <th className="px-3 py-2 text-right text-gray-700">Prix unitaire</th>
                                                    <th className="px-3 py-2 text-right text-gray-700">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.price_table.map((row, idx) => (
                                                    <tr key={idx} className="border-t border-gray-200">
                                                        <td className="px-3 py-2">{row.tier}</td>
                                                        <td className="px-3 py-2">{row.quantity}</td>
                                                        <td className="px-3 py-2 text-right">{row.unit_price} {data.currency || 'EUR'}</td>
                                                        <td className="px-3 py-2 text-right font-semibold">{row.total_price} {data.currency || 'EUR'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* Licences */}
                    {(data.license_count || data.license_type) && (
                        <Section title="Licences" icon={Package}>
                            <dl className="space-y-3">
                                <Field label="Nombre de licences" value={data.license_count} />
                                <Field label="Type de licence" value={data.license_type} />
                                <Field label="Minimum" value={data.minimum_licenses} />
                                <Field label="Maximum" value={data.maximum_licenses} />
                            </dl>
                        </Section>
                    )}

                    {/* Dates importantes */}
                    {(data.start_date || data.end_date || data.renewal_date || data.signature_date) && (
                        <Section title="Dates importantes" icon={Calendar}>
                            <dl className="space-y-3">
                                <Field label="Date signature" value={data.signature_date ? new Date(data.signature_date).toLocaleDateString('fr-FR') : null} />
                                <Field label="Date début" value={data.start_date ? new Date(data.start_date).toLocaleDateString('fr-FR') : null} />
                                <Field label="Date fin" value={data.end_date ? new Date(data.end_date).toLocaleDateString('fr-FR') : null} />
                                <Field label="Date renouvellement" value={data.renewal_date ? new Date(data.renewal_date).toLocaleDateString('fr-FR') : null} />
                                <Field label="Échéance préavis" value={data.notice_deadline ? new Date(data.notice_deadline).toLocaleDateString('fr-FR') : null} />
                            </dl>
                        </Section>
                    )}

                    {/* Conditions du contrat */}
                    {(data.contract_duration_months || data.notice_period_days || data.auto_renewal !== null) && (
                        <Section title="Conditions du contrat" icon={Clock}>
                            <dl className="space-y-3">
                                <Field 
                                    label="Durée" 
                                    value={data.contract_duration_months ? `${data.contract_duration_months} mois` : null} 
                                />
                                <Field 
                                    label="Préavis" 
                                    value={data.notice_period_days ? `${data.notice_period_days} jours` : null} 
                                />
                                {data.auto_renewal !== null && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-sm font-medium text-gray-600">Renouvellement auto</dt>
                                        <dd className="col-span-2">
                                            {data.auto_renewal ? (
                                                <Badge color="green">Oui</Badge>
                                            ) : (
                                                <Badge color="red">Non</Badge>
                                            )}
                                        </dd>
                                    </div>
                                )}
                                <Field label="Conditions renouvellement" value={data.renewal_conditions} />
                            </dl>
                        </Section>
                    )}

                    {/* Contacts */}
                    {data.contacts && (data.contacts.provider_contact || data.contacts.client_contact) && (
                        <Section title="Contacts" icon={User}>
                            {data.contacts.provider_contact && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Contact fournisseur</p>
                                    <dl className="space-y-2 pl-4">
                                        <Field label="Nom" value={data.contacts.provider_contact.name} />
                                        <Field label="Email" value={data.contacts.provider_contact.email} />
                                        <Field label="Téléphone" value={data.contacts.provider_contact.phone} />
                                    </dl>
                                </div>
                            )}
                            {data.contacts.client_contact && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Contact client</p>
                                    <dl className="space-y-2 pl-4">
                                        <Field label="Nom" value={data.contacts.client_contact.name} />
                                        <Field label="Email" value={data.contacts.client_contact.email} />
                                        <Field label="Téléphone" value={data.contacts.client_contact.phone} />
                                    </dl>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* Services */}
                    {data.services && (data.services.included_services?.length > 0 || data.services.optional_services?.length > 0) && (
                        <Section title="Services" icon={Package}>
                            {data.services.included_services?.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Services inclus</p>
                                    <ul className="space-y-1">
                                        {data.services.included_services.map((service, idx) => (
                                            <li key={idx} className="text-sm text-gray-900 flex items-start gap-2">
                                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{service}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.services.optional_services?.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Services optionnels</p>
                                    <ul className="space-y-1">
                                        {data.services.optional_services.map((service, idx) => (
                                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                <span className="w-4 h-4 mt-0.5">•</span>
                                                <span>{service}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.services.excluded_services?.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Services exclus</p>
                                    <ul className="space-y-1">
                                        {data.services.excluded_services.map((service, idx) => (
                                            <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                                                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{service}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* Support */}
                    {data.support && (data.support.support_level || data.support.support_hours || data.support.response_time) && (
                        <Section title="Support" icon={Shield}>
                            <dl className="space-y-3">
                                <Field label="Niveau support" value={data.support.support_level} />
                                <Field label="Horaires" value={data.support.support_hours} />
                                <Field label="Temps de réponse" value={data.support.response_time} />
                            </dl>
                        </Section>
                    )}

                    {/* Clauses importantes */}
                    {data.clauses && Object.values(data.clauses).some(arr => arr?.length > 0) && (
                        <Section title="Clauses importantes" icon={Shield}>
                            {data.clauses.termination?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Résiliation</p>
                                    <ul className="space-y-1">
                                        {data.clauses.termination.map((clause, idx) => (
                                            <li key={idx} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                                {clause}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.clauses.sla?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">SLA / Garanties</p>
                                    <ul className="space-y-1">
                                        {data.clauses.sla.map((clause, idx) => (
                                            <li key={idx} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                                {clause}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.clauses.liability?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Responsabilité</p>
                                    <ul className="space-y-1">
                                        {data.clauses.liability.map((clause, idx) => (
                                            <li key={idx} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                                {clause}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.clauses.data_protection?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Protection des données</p>
                                    <ul className="space-y-1">
                                        {data.clauses.data_protection.map((clause, idx) => (
                                            <li key={idx} className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                                {clause}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* Conditions spéciales */}
                    {data.special_conditions?.length > 0 && (
                        <Section title="Conditions spéciales" icon={AlertTriangle}>
                            <ul className="space-y-2">
                                {data.special_conditions.map((condition, idx) => (
                                    <li key={idx} className="text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        {condition}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtractionDetailModal;