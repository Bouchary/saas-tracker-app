// ============================================================================
// SCRIPT DE TEST - ENVOI EMAIL WORKFLOW
// ============================================================================
// Fichier : server/test-workflow-email.js
// Commande : node test-workflow-email.js
// ============================================================================

require('dotenv').config();
const emailService = require('./src/services/emailService');

async function test() {
    console.log('\n🧪 TEST : Envoi d\'un email de tâche assignée\n');
    console.log('='.repeat(60));
    
    try {
        // ⚠️ IMPORTANT : REMPLACER PAR VOTRE VRAIE ADRESSE EMAIL
        const testEmail = 'abbouchary@gmail.com'; // ← CHANGER ICI
        
        console.log(`\n📧 Destinataire : ${testEmail}`);
        console.log('⏳ Envoi en cours...\n');
        
        const result = await emailService.sendTaskAssignedEmail(
            testEmail,
            {
                title: 'Configurer l\'ordinateur de test',
                description: 'Installer les logiciels nécessaires pour le nouvel employé',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
                responsible_team: 'IT',
                is_mandatory: true,
                checklist_items: [
                    'Installer Windows 11',
                    'Installer Microsoft Office',
                    'Configurer le VPN',
                    'Créer le compte utilisateur'
                ]
            },
            {
                id: 1,
                workflow_type: 'onboarding'
            },
            {
                first_name: 'Jean',
                last_name: 'Dupont',
                job_title: 'Développeur Full Stack',
                department: 'IT',
                email: 'jean.dupont@example.com'
            }
        );
        
        console.log('='.repeat(60));
        
        if (result.success) {
            console.log('\n✅ EMAIL ENVOYÉ AVEC SUCCÈS !\n');
            console.log('📬 Vérifiez votre boîte email :', testEmail);
            console.log('📝 Message ID :', result.data?.id);
            console.log('\n💡 Sujet : 📋 Nouvelle tâche : Configurer l\'ordinateur de test');
            console.log('💡 Vérifiez aussi les spams si vous ne le voyez pas\n');
        } else {
            console.log('\n❌ ÉCHEC DE L\'ENVOI\n');
            console.error('Erreur :', result.error);
        }
        
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.error('\n❌ ERREUR :', error.message);
        console.error('Stack :', error.stack);
    }
    
    process.exit(0);
}

test();