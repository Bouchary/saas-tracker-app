// server/src/templates/welcomeEmail.js

module.exports = (userName, appUrl) => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur SaaS Tracker</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header avec gradient -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: white; font-size: 48px;">
                                🎉
                            </h1>
                            <h2 style="margin: 8px 0 0; color: white; font-size: 28px; font-weight: 600;">
                                Bienvenue sur SaaS Tracker !
                            </h2>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 24px; color: #1f2937; font-size: 18px; line-height: 1.6;">
                                Bonjour <strong style="color: #6366f1;">${userName}</strong> ! 👋
                            </p>
                            
                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Nous sommes ravis de vous accueillir parmi nous ! Votre compte a été créé avec succès.
                            </p>
                            
                            <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Avec SaaS Tracker, vous allez pouvoir gérer tous vos contrats en un seul endroit et 
                                ne plus jamais manquer une date de résiliation importante.
                            </p>
                            
                            <!-- Features -->
                            <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
                                <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 18px; font-weight: 600;">
                                    Ce que vous pouvez faire :
                                </h3>
                                
                                <div style="margin-bottom: 16px;">
                                    <div style="display: inline-block; width: 32px; height: 32px; background: #6366f1; border-radius: 50%; text-align: center; line-height: 32px; margin-right: 12px; vertical-align: middle;">
                                        📋
                                    </div>
                                    <span style="color: #4b5563; font-size: 15px; vertical-align: middle;">
                                        <strong>Centraliser</strong> tous vos contrats SaaS
                                    </span>
                                </div>
                                
                                <div style="margin-bottom: 16px;">
                                    <div style="display: inline-block; width: 32px; height: 32px; background: #8b5cf6; border-radius: 50%; text-align: center; line-height: 32px; margin-right: 12px; vertical-align: middle;">
                                        🔔
                                    </div>
                                    <span style="color: #4b5563; font-size: 15px; vertical-align: middle;">
                                        <strong>Recevoir des alertes</strong> avant les renouvellements
                                    </span>
                                </div>
                                
                                <div style="margin-bottom: 16px;">
                                    <div style="display: inline-block; width: 32px; height: 32px; background: #10b981; border-radius: 50%; text-align: center; line-height: 32px; margin-right: 12px; vertical-align: middle;">
                                        💰
                                    </div>
                                    <span style="color: #4b5563; font-size: 15px; vertical-align: middle;">
                                        <strong>Suivre vos dépenses</strong> en temps réel
                                    </span>
                                </div>
                                
                                <div>
                                    <div style="display: inline-block; width: 32px; height: 32px; background: #f59e0b; border-radius: 50%; text-align: center; line-height: 32px; margin-right: 12px; vertical-align: middle;">
                                        📊
                                    </div>
                                    <span style="color: #4b5563; font-size: 15px; vertical-align: middle;">
                                        <strong>Analyser</strong> vos abonnements avec des graphiques
                                    </span>
                                </div>
                            </div>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
                                        <a href="${appUrl}" 
                                           style="display: inline-block; padding: 16px 40px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
                                            Commencer maintenant 🚀
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Quick tip -->
                            <div style="margin-top: 32px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    💡 <strong>Conseil :</strong> Commencez par ajouter vos premiers contrats pour voir 
                                    instantanément vos dépenses mensuelles et recevoir des alertes personnalisées.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                Besoin d'aide ? Nous sommes là pour vous accompagner !
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
