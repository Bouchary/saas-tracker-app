// server/src/templates/contractExpirationEmail.js

module.exports = (contract, daysLeft, appUrl) => {
    // Définir la couleur selon l'urgence
    let urgencyColor = '#10b981'; // Vert par défaut
    let urgencyText = 'Rappel';
    let urgencyIcon = '📅';
    
    if (daysLeft <= 7) {
        urgencyColor = '#ef4444'; // Rouge
        urgencyText = 'URGENT';
        urgencyIcon = '🚨';
    } else if (daysLeft <= 14) {
        urgencyColor = '#f59e0b'; // Orange
        urgencyText = 'Attention';
        urgencyIcon = '⚠️';
    }

    const renewalDate = contract.renewal_date 
        ? new Date(contract.renewal_date).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })
        : 'Non définie';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerte Contrat</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: ${urgencyColor}; border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: white; font-size: 32px;">
                                ${urgencyIcon}
                            </h1>
                            <h2 style="margin: 8px 0 0; color: white; font-size: 24px;">
                                ${urgencyText}
                            </h2>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px;">
                                Le préavis de votre contrat expire bientôt
                            </h2>
                            
                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Il ne vous reste que <strong style="color: ${urgencyColor}; font-size: 20px;">${daysLeft} jour(s)</strong> 
                                pour résilier votre contrat avant son renouvellement automatique.
                            </p>
                            
                            <!-- Contract Details -->
                            <div style="background: #f9fafb; padding: 24px; border-radius: 8px; border-left: 4px solid ${urgencyColor}; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px;">
                                    Détails du contrat
                                </h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                                            <strong>Nom :</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            ${contract.name}
                                        </td>
                                    </tr>
                                    ${contract.provider ? `
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                            <strong>Fournisseur :</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            ${contract.provider}
                                        </td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                            <strong>Coût mensuel :</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            ${parseFloat(contract.monthly_cost).toFixed(2)} €
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                            <strong>Date de renouvellement :</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            ${renewalDate}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                            <strong>Préavis :</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            ${contract.notice_period_days} jour(s)
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Action reminder -->
                            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    💡 <strong>Action requise :</strong> Si vous souhaitez résilier ce contrat, 
                                    n'oubliez pas de contacter votre fournisseur avant l'expiration du délai de préavis.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 8px; background: ${urgencyColor};">
                                        <a href="${appUrl}" 
                                           style="display: inline-block; padding: 16px 32px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
                                            Voir mes contrats
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                                Vous recevez cet email car vous avez activé les notifications pour vos contrats.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 SaaS Tracker - Gestion intelligente de vos contrats
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};