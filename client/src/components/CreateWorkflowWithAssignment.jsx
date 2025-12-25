// ============================================================================
// COMPOSANT REACT - CRÉATION WORKFLOW AVEC ASSIGNATION
// ============================================================================
// Fichier : client/src/components/CreateWorkflowWithAssignment.jsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, Briefcase, ChevronDown } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

const CreateWorkflowWithAssignment = ({ employee, onClose, onSuccess }) => {
    const { token } = useAuth();
    const [step, setStep] = useState(1); // 1 = Info de base, 2 = Assignation
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersByDepartment, setUsersByDepartment] = useState({});
    const [templateTasks, setTemplateTasks] = useState([]);
    const justChangedStep = React.useRef(false); // ✅ NOUVEAU : Protection contre double submit
    
    // Données du formulaire
    const [formData, setFormData] = useState({
        workflow_type: 'onboarding',
        target_date: '',
        template_id: null
    });
    
    // Assignations des tâches
    const [taskAssignments, setTaskAssignments] = useState({});

    // Charger les templates
    useEffect(() => {
        fetchTemplates();
        fetchUsers();
    }, [formData.workflow_type]);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/workflows/templates?type=${formData.workflow_type}&is_active=true`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Erreur chargement templates:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/workflows/users-for-assignment?exclude_employee_id=${employee.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setUsersByDepartment(data.byDepartment || {});
            }
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
        }
    };

    // Charger les tâches du template sélectionné
    const fetchTemplateTasks = async (templateId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/workflows/templates/${templateId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                setTemplateTasks(data.template.tasks || []);
                
                // Initialiser les assignations vides
                const initialAssignments = {};
                data.template.tasks.forEach(task => {
                    initialAssignments[task.id] = null;
                });
                setTaskAssignments(initialAssignments);
            }
        } catch (error) {
            console.error('Erreur chargement tâches template:', error);
        }
    };

    const handleTemplateChange = (templateId) => {
        setFormData({ ...formData, template_id: templateId });
        if (templateId) {
            fetchTemplateTasks(templateId);
        } else {
            setTemplateTasks([]);
            setTaskAssignments({});
        }
    };

    const handleAssignmentChange = (taskId, userId) => {
        setTaskAssignments({
            ...taskAssignments,
            [taskId]: userId ? parseInt(userId) : null
        });
    };

    const handleNext = (e) => {
        if (e) e.preventDefault(); // Empêcher la soumission du formulaire
        
        if (step === 1) {
            // Validation étape 1
            if (!formData.template_id || !formData.target_date) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            // ✅ NOUVEAU : Marquer qu'on vient de changer d'étape
            justChangedStep.current = true;
            setStep(2);
            
            // ✅ NOUVEAU : Réinitialiser après un délai court
            setTimeout(() => {
                justChangedStep.current = false;
            }, 300);
        }
    };

    const handleBack = (e) => {
        if (e) e.preventDefault(); // Empêcher tout comportement par défaut
        setStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // ✅ NOUVEAU : Empêcher la propagation de l'événement
        
        // ✅ NOUVEAU : Si on vient de changer d'étape, ignorer le submit
        if (justChangedStep.current) {
            console.log('⚠️ Submit ignoré : changement d\'étape récent');
            return;
        }
        
        // ✅ NOUVEAU : Ne rien faire si déjà en chargement
        if (loading) {
            console.log('⚠️ Submit ignoré : déjà en chargement');
            return;
        }
        
        // Si on est à l'étape 1, passer à l'étape 2 au lieu de soumettre
        if (step === 1) {
            console.log('📍 Étape 1 → Passage à l\'étape 2');
            handleNext();
            return;
        }
        
        // ✅ NOUVEAU : Double vérification qu'on est bien à l'étape 2
        if (step !== 2) {
            console.log('⚠️ Submit ignoré : pas à l\'étape 2 (étape actuelle:', step, ')');
            return;
        }
        
        console.log('✅ Soumission du workflow à l\'étape 2');
        
        // Sinon, on est à l'étape 2, on peut soumettre
        setLoading(true);

        try {
            // Préparer les assignations au format attendu par l'API
            const assignments = Object.entries(taskAssignments)
                .filter(([taskId, userId]) => userId !== null)
                .map(([taskId, userId]) => ({
                    task_template_id: parseInt(taskId),
                    assigned_to: userId
                }));

            const payload = {
                employee_id: employee.id,
                workflow_type: formData.workflow_type,
                target_date: formData.target_date,
                template_id: formData.template_id,
                task_assignments: assignments
            };

            const response = await fetch(`${API_URL}/api/workflows`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                onSuccess(data.workflow);
                onClose();
            } else {
                const error = await response.json();
                alert('Erreur: ' + (error.error || 'Erreur lors de la création du workflow'));
            }
        } catch (error) {
            console.error('Erreur création workflow:', error);
            alert('Erreur lors de la création du workflow');
        } finally {
            setLoading(false);
        }
    };

    // Obtenir les utilisateurs du département d'une tâche
    const getUsersForTask = (task) => {
        const dept = task.responsible_team;
        return usersByDepartment[dept] || [];
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">
                                Créer un workflow
                            </h2>
                            <p className="text-indigo-100">
                                {employee.first_name} {employee.last_name} - {employee.job_title}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-6 flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-indigo-100">
                        <span>1. Informations</span>
                        <span>2. Assignation des tâches</span>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* ÉTAPE 1 : Informations de base */}
                        {step === 1 && (
                            <div className="space-y-6">
                                {/* Type de workflow */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type de workflow *
                                    </label>
                                    <select
                                        value={formData.workflow_type}
                                        onChange={(e) => setFormData({ ...formData, workflow_type: e.target.value, template_id: null })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="onboarding">🎉 Onboarding (Arrivée)</option>
                                        <option value="offboarding">👋 Offboarding (Départ)</option>
                                    </select>
                                </div>

                                {/* Date cible */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date cible *
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={formData.target_date}
                                            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Date {formData.workflow_type === 'onboarding' ? "d'arrivée" : 'de départ'} de l'employé
                                    </p>
                                </div>

                                {/* Template */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Template de workflow *
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            value={formData.template_id || ''}
                                            onChange={(e) => handleTemplateChange(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                                            required
                                        >
                                            <option value="">Sélectionner un template...</option>
                                            {templates.map(template => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name} ({template.total_tasks} tâches)
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Aperçu des tâches */}
                                {templateTasks.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-3">
                                            📋 Aperçu des tâches ({templateTasks.length})
                                        </h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {templateTasks.map((task, index) => (
                                                <div key={task.id} className="flex items-start gap-3 text-sm">
                                                    <span className="text-gray-500 font-mono">{index + 1}.</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{task.title}</p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            {task.responsible_team} • J+{task.trigger_days}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ÉTAPE 2 : Assignation des tâches */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>💡 Astuce :</strong> Assignez chaque tâche à la personne responsable. 
                                        Les emails seront envoyés automatiquement aux personnes assignées.
                                    </p>
                                </div>

                                {templateTasks.map((task, index) => {
                                    const usersForTask = getUsersForTask(task);
                                    
                                    return (
                                        <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                                            <div className="flex items-start gap-3 mb-3">
                                                <span className="bg-indigo-100 text-indigo-700 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                        <span className="bg-gray-100 px-2 py-1 rounded">
                                                            {task.responsible_team}
                                                        </span>
                                                        <span>J+{task.trigger_days}</span>
                                                        {task.is_mandatory && (
                                                            <span className="text-red-600 font-semibold">Obligatoire</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sélecteur d'utilisateur */}
                                            <div className="ml-11">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <UserPlus className="w-4 h-4 inline mr-1" />
                                                    Assigner à :
                                                </label>
                                                <select
                                                    value={taskAssignments[task.id] || ''}
                                                    onChange={(e) => handleAssignmentChange(task.id, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                >
                                                    <option value="">Non assigné</option>
                                                    {usersForTask.length > 0 ? (
                                                        usersForTask.map((user, userIndex) => (
                                                            <option key={`${task.id}-${user.id}-${userIndex}`} value={user.id}>
                                                                {user.name} ({user.email})
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>
                                                            Aucun utilisateur dans {task.responsible_team}
                                                        </option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Résumé des assignations */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-900 mb-2">
                                        📊 Résumé
                                    </h4>
                                    <p className="text-sm text-green-800">
                                        {Object.values(taskAssignments).filter(v => v !== null).length} tâche(s) assignée(s) 
                                        sur {templateTasks.length} au total
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer avec boutons */}
                    <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between">
                        {step === 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!formData.template_id || !formData.target_date}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Suivant : Assigner les tâches →
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                                >
                                    ← Retour
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Création...
                                        </>
                                    ) : (
                                        <>
                                            ✓ Créer le workflow
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkflowWithAssignment;