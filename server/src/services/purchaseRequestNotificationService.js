// server/src/services/purchaseRequestNotificationService.js - ✅ CORRIGÉ
// ============================================================================
// SERVICE NOTIFICATIONS - Emails workflow demandes d'achat
// ============================================================================

const db = require('../db');
const nodemailer = require('nodemailer');

// Configuration mailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Envoyer email au valideur - ✅ CORRIGÉ
 */
const notifyApprover = async (requestId, approverId, order) => {
    try {
        const query = `
            SELECT 
                pr.*,
                u_requester.email as requester_email,
                u_approver.email as approver_email,
                o.name as organization_name
            FROM purchase_requests pr
            LEFT JOIN users u_requester ON pr.requester_id = u_requester.id
            LEFT JOIN users u_approver ON u_approver.id = $2
            LEFT JOIN organizations o ON pr.organization_id = o.id
            WHERE pr.id = $1
        `;
        
        const result = await db.query(query, [requestId, approverId]);
        
        if (result.rows.length === 0) {
            console.log(`NotificationService: Demande ${requestId} non trouvée`);
            return;
        }
        
        const data = result.rows[0];
        
        const approvalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/purchase-requests/${requestId}`;
        
        const emailSubject = `[${data.organization_name}] Demande d'achat à valider - ${data.request_number}`;
        
        const emailBody = `
            <h2>Demande d'achat en attente de votre validation</h2>
            
            <p>Bonjour,</p>
            
            <p><strong>${data.requester_email}</strong> a soumis une demande d'achat nécessitant votre approbation.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                <h3 style="margin-top: 0;">Détails de la demande</h3>
                <p><strong>Numéro :</strong> ${data.request_number}</p>
                <p><strong>Titre :</strong> ${data.title}</p>
                <p><strong>Montant :</strong> ${parseFloat(data.amount).toFixed(2)} ${data.currency}</p>
                <p><strong>Catégorie :</strong> ${data.category}</p>
                <p><strong>Urgence :</strong> ${data.urgency === 'critical' ? '🔴 Critique' : data.urgency === 'urgent' ? '🟠 Urgente' : '🟢 Normale'}</p>
                ${data.supplier_name ? `<p><strong>Fournisseur :</strong> ${data.supplier_name}</p>` : ''}
            </div>
            
            <p><strong>Justification :</strong></p>
            <p style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb;">${data.justification}</p>
            
            <p style="margin-top: 30px;">
                <strong>Vous êtes le valideur n°${order} sur ${data.total_approvers}</strong>
            </p>
            
            <p>
                <a href="${approvalUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                    Consulter et valider la demande
                </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
                Cet email a été envoyé automatiquement par ${data.organization_name}.<br>
                Pour toute question, contactez ${data.requester_email}.
            </p>
        `;
        
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"SaaS Tracker" <noreply@saastracker.com>',
            to: data.approver_email,
            subject: emailSubject,
            html: emailBody
        });
        
        await db.query(`
            UPDATE purchase_request_approvers
            SET notified_at = CURRENT_TIMESTAMP
            WHERE purchase_request_id = $1 AND approver_id = $2
        `, [requestId, approverId]);
        
        console.log(`NotificationService: Email valideur envoyé à ${data.approver_email} pour demande ${requestId}`);
        
    } catch (error) {
        console.error('NotificationService: Erreur notifyApprover:', error);
        // Ne pas bloquer le workflow si email échoue
    }
};

/**
 * Notifier demandeur (approbation ou rejet) - ✅ CORRIGÉ
 */
const notifyRequester = async (requestId, action, rejectionReason = null) => {
    try {
        const query = `
            SELECT 
                pr.*,
                u.email as requester_email,
                o.name as organization_name
            FROM purchase_requests pr
            LEFT JOIN users u ON pr.requester_id = u.id
            LEFT JOIN organizations o ON pr.organization_id = o.id
            WHERE pr.id = $1
        `;
        
        const result = await db.query(query, [requestId]);
        
        if (result.rows.length === 0) {
            return;
        }
        
        const data = result.rows[0];
        
        const requestUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/purchase-requests/${requestId}`;
        
        let emailSubject, emailBody;
        
        if (action === 'approved') {
            emailSubject = `[${data.organization_name}] ✅ Demande approuvée - ${data.request_number}`;
            
            emailBody = `
                <h2 style="color: #059669;">✅ Votre demande a été approuvée</h2>
                
                <p>Bonjour,</p>
                
                <p>Bonne nouvelle ! Votre demande d'achat a été <strong>entièrement approuvée</strong>.</p>
                
                <div style="background-color: #f0fdf4; padding: 20px; margin: 20px 0; border-left: 4px solid #059669;">
                    <p><strong>Numéro :</strong> ${data.request_number}</p>
                    <p><strong>Titre :</strong> ${data.title}</p>
                    <p><strong>Montant :</strong> ${parseFloat(data.amount).toFixed(2)} ${data.currency}</p>
                </div>
                
                <p>Votre demande peut maintenant être convertie en contrat par l'équipe administrative.</p>
                
                <p>
                    <a href="${requestUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                        Voir la demande
                    </a>
                </p>
            `;
            
        } else if (action === 'rejected') {
            emailSubject = `[${data.organization_name}] ❌ Demande rejetée - ${data.request_number}`;
            
            emailBody = `
                <h2 style="color: #dc2626;">❌ Votre demande a été rejetée</h2>
                
                <p>Bonjour,</p>
                
                <p>Nous vous informons que votre demande d'achat a été <strong>rejetée</strong>.</p>
                
                <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p><strong>Numéro :</strong> ${data.request_number}</p>
                    <p><strong>Titre :</strong> ${data.title}</p>
                    <p><strong>Montant :</strong> ${parseFloat(data.amount).toFixed(2)} ${data.currency}</p>
                </div>
                
                ${rejectionReason ? `
                    <p><strong>Raison du rejet :</strong></p>
                    <p style="background-color: #ffffff; padding: 15px; border: 1px solid #fecaca;">
                        ${rejectionReason}
                    </p>
                ` : ''}
                
                <p>Si vous avez des questions, n'hésitez pas à contacter votre responsable.</p>
                
                <p>
                    <a href="${requestUrl}" style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                        Voir la demande
                    </a>
                </p>
            `;
        }
        
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"SaaS Tracker" <noreply@saastracker.com>',
            to: data.requester_email,
            subject: emailSubject,
            html: emailBody
        });
        
        console.log(`NotificationService: Email ${action} envoyé à ${data.requester_email} pour demande ${requestId}`);
        
    } catch (error) {
        console.error('NotificationService: Erreur notifyRequester:', error);
    }
};

/**
 * Envoyer rappel valideur - ✅ CORRIGÉ
 */
const sendReminder = async (requestId, approverId) => {
    try {
        const query = `
            SELECT 
                pr.*,
                pra.order_position,
                pra.notified_at,
                u.email as approver_email
            FROM purchase_requests pr
            JOIN purchase_request_approvers pra ON pr.id = pra.purchase_request_id
            JOIN users u ON pra.approver_id = u.id
            WHERE pr.id = $1 AND pra.approver_id = $2
        `;
        
        const result = await db.query(query, [requestId, approverId]);
        
        if (result.rows.length === 0) {
            return;
        }
        
        const data = result.rows[0];
        
        const approvalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/purchase-requests/${requestId}`;
        
        const emailSubject = `🔔 Rappel : Demande d'achat en attente - ${data.request_number}`;
        
        const emailBody = `
            <h2>Rappel : Demande d'achat en attente</h2>
            
            <p>Bonjour,</p>
            
            <p>Cette demande d'achat est en attente de votre validation depuis ${Math.floor((Date.now() - new Date(data.notified_at)) / (1000 * 60 * 60 * 24))} jours.</p>
            
            <div style="background-color: #fef3c7; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>Numéro :</strong> ${data.request_number}</p>
                <p><strong>Titre :</strong> ${data.title}</p>
                <p><strong>Montant :</strong> ${parseFloat(data.amount).toFixed(2)} ${data.currency}</p>
            </div>
            
            <p>
                <a href="${approvalUrl}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Consulter et valider
                </a>
            </p>
        `;
        
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"SaaS Tracker" <noreply@saastracker.com>',
            to: data.approver_email,
            subject: emailSubject,
            html: emailBody
        });
        
        await db.query(`
            UPDATE purchase_request_approvers
            SET reminded_at = CURRENT_TIMESTAMP
            WHERE purchase_request_id = $1 AND approver_id = $2
        `, [requestId, approverId]);
        
        console.log(`NotificationService: Rappel envoyé à ${data.approver_email}`);
        
    } catch (error) {
        console.error('NotificationService: Erreur sendReminder:', error);
    }
};

module.exports = {
    notifyApprover,
    notifyRequester,
    sendReminder
};