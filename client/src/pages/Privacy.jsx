// client/src/pages/Privacy.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Bouton retour */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </Link>

        {/* Contenu */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Politique de Confidentialité</h1>
          </div>
          
          <div className="prose prose-indigo max-w-none space-y-6 text-gray-700 leading-relaxed">
            <p className="text-lg text-gray-600 mb-8">
              Chez SaaS Tracker, nous prenons très au sérieux la protection de vos données personnelles. Cette politique explique comment nous collectons, utilisons et protégeons vos informations conformément au RGPD (Règlement Général sur la Protection des Données).
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement des données est :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Nom :</strong> [Votre entreprise]</li>
                <li><strong>Adresse :</strong> [Adresse complète]</li>
                <li><strong>Email :</strong> contact@saastracker.com</li>
                <li><strong>DPO (Délégué à la Protection des Données) :</strong> dpo@saastracker.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données collectées</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Données d'identification</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email (obligatoire pour la création de compte)</li>
                <li>Prénom et nom (optionnel)</li>
                <li>Mot de passe (hashé et crypté)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.2 Données d'utilisation</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Informations sur vos contrats et abonnements</li>
                <li>Documents uploadés (contrats, factures)</li>
                <li>Logs de connexion et d'utilisation</li>
                <li>Préférences utilisateur</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.3 Données techniques</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Adresse IP</li>
                <li>Type de navigateur et système d'exploitation</li>
                <li>Cookies (voir notre <Link to="/cookies" className="text-indigo-600 hover:underline font-medium">Politique de cookies</Link>)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalités du traitement</h2>
              <p>Vos données sont collectées pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Gestion de votre compte :</strong> création, authentification, gestion du profil</li>
                <li><strong>Fourniture du service :</strong> stockage et gestion de vos contrats et documents</li>
                <li><strong>Envoi d'alertes :</strong> notifications de renouvellement et résumés hebdomadaires</li>
                <li><strong>Support client :</strong> réponse à vos demandes et assistance technique</li>
                <li><strong>Amélioration du service :</strong> analyse d'utilisation et développement de nouvelles fonctionnalités</li>
                <li><strong>Facturation :</strong> gestion des abonnements payants (si applicable)</li>
                <li><strong>Sécurité :</strong> prévention de la fraude et des abus</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base légale du traitement</h2>
              <p>Le traitement de vos données repose sur :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>L'exécution du contrat :</strong> pour fournir le service demandé</li>
                <li><strong>Votre consentement :</strong> pour l'envoi de communications marketing (révocable à tout moment)</li>
                <li><strong>L'intérêt légitime :</strong> pour améliorer notre service et assurer la sécurité</li>
                <li><strong>Obligations légales :</strong> pour la conservation de certaines données (facturation, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Destinataires des données</h2>
              <p>Vos données sont accessibles à :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personnel autorisé :</strong> nos équipes techniques et support</li>
                <li><strong>Sous-traitants :</strong> 
                  <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                    <li>Netlify (hébergement frontend)</li>
                    <li>Render (hébergement backend et base de données)</li>
                    <li>Resend (envoi d'emails)</li>
                  </ul>
                </li>
                <li><strong>Autorités :</strong> uniquement sur réquisition judiciaire</li>
              </ul>
              <p className="mt-4">
                Nous ne vendons ni ne louons vos données à des tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Transferts de données hors UE</h2>
              <p>
                Certains de nos sous-traitants (Netlify, Render, Resend) sont basés aux États-Unis. Ces transferts sont encadrés par :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Des clauses contractuelles types approuvées par la Commission européenne</li>
                <li>Des mesures de sécurité supplémentaires (cryptage, pseudonymisation)</li>
                <li>Le respect des principes du Privacy Shield ou équivalent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Durée de conservation</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Données de compte actif :</strong> pendant toute la durée d'utilisation du service</li>
                <li><strong>Données de compte inactif :</strong> 3 ans après la dernière connexion, puis suppression</li>
                <li><strong>Logs de connexion :</strong> 12 mois</li>
                <li><strong>Documents uploadés :</strong> jusqu'à suppression par l'utilisateur ou fermeture du compte</li>
                <li><strong>Données de facturation :</strong> 10 ans (obligation légale)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Sécurité des données</h2>
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cryptage SSL/TLS pour toutes les communications</li>
                <li>Hashage des mots de passe (bcrypt)</li>
                <li>Sauvegardes régulières et chiffrées</li>
                <li>Accès restreint aux données (principe du moindre privilège)</li>
                <li>Surveillance et détection des incidents de sécurité</li>
                <li>Tests de sécurité réguliers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Vos droits</h2>
              <p>
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement :</strong> supprimer vos données (« droit à l'oubli »)</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Comment exercer vos droits ?</h3>
              <p>
                Pour exercer l'un de ces droits, contactez-nous à : <a href="mailto:dpo@saastracker.com" className="text-indigo-600 hover:underline font-medium">dpo@saastracker.com</a>
              </p>
              <p>
                Nous répondrons à votre demande dans un délai maximum d'un mois.
              </p>
              <p className="mt-4">
                Vous avez également le droit de déposer une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.cnil.fr</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
              <p>
                Nous utilisons des cookies pour améliorer votre expérience. Pour plus d'informations, consultez notre <Link to="/cookies" className="text-indigo-600 hover:underline font-medium">Politique de cookies</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modifications de la politique</h2>
              <p>
                Nous pouvons modifier cette politique de confidentialité. En cas de modification substantielle, nous vous en informerons par email ou notification sur la Plateforme.
              </p>
              <p>
                La version en vigueur est toujours accessible sur cette page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
              <p>
                Pour toute question concernant cette politique ou vos données personnelles :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Email :</strong> <a href="mailto:dpo@saastracker.com" className="text-indigo-600 hover:underline">dpo@saastracker.com</a></li>
                <li><strong>Courrier :</strong> [Votre entreprise] - Service DPO - [Adresse]</li>
              </ul>
            </section>

            <section className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;