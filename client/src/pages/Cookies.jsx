// client/src/pages/Cookies.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';

const Cookies = () => {
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
              <Cookie className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Politique de Cookies</h1>
          </div>
          
          <div className="prose prose-indigo max-w-none space-y-6 text-gray-700 leading-relaxed">
            <p className="text-lg text-gray-600 mb-8">
              Cette politique explique comment SaaS Tracker utilise les cookies et technologies similaires pour améliorer votre expérience sur notre plateforme.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Qu'est-ce qu'un cookie ?</h2>
              <p>
                Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette) lors de votre visite sur un site web.
              </p>
              <p>
                Les cookies permettent au site de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Reconnaître votre appareil lors de vos visites</li>
                <li>Mémoriser vos préférences et paramètres</li>
                <li>Améliorer votre navigation</li>
                <li>Analyser l'utilisation du site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types de cookies utilisés</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Cookies strictement nécessaires</h3>
              <p>
                Ces cookies sont essentiels au fonctionnement de la plateforme. Sans eux, certaines fonctionnalités ne peuvent pas être proposées.
              </p>
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 my-4">
                <p className="font-semibold text-indigo-900 mb-2">Exemples :</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-indigo-800 ml-4">
                  <li><strong>auth_token :</strong> Cookie de session pour maintenir votre connexion</li>
                  <li><strong>csrf_token :</strong> Protection contre les attaques CSRF</li>
                  <li><strong>Durée :</strong> Session ou 7 jours</li>
                </ul>
              </div>
              <p>
                <strong>Base légale :</strong> Intérêt légitime (nécessaire au fonctionnement du service)
              </p>
              <p>
                <strong>⚠️ Ces cookies ne peuvent pas être refusés</strong> car ils sont indispensables.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Cookies de préférences</h3>
              <p>
                Ces cookies permettent de mémoriser vos choix (langue, thème, etc.) pour personnaliser votre expérience.
              </p>
              <div className="bg-green-50 border-l-4 border-green-600 p-4 my-4">
                <p className="font-semibold text-green-900 mb-2">Exemples :</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800 ml-4">
                  <li><strong>user_preferences :</strong> Vos paramètres d'affichage</li>
                  <li><strong>theme :</strong> Thème clair/sombre (si applicable)</li>
                  <li><strong>Durée :</strong> 1 an</li>
                </ul>
              </div>
              <p>
                <strong>Base légale :</strong> Votre consentement
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Cookies analytiques</h3>
              <p>
                Ces cookies nous aident à comprendre comment vous utilisez la plateforme pour l'améliorer.
              </p>
              <div className="bg-purple-50 border-l-4 border-purple-600 p-4 my-4">
                <p className="font-semibold text-purple-900 mb-2">Exemples :</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-purple-800 ml-4">
                  <li><strong>_ga, _gid :</strong> Google Analytics (si utilisé)</li>
                  <li><strong>analytics_session :</strong> Statistiques d'utilisation</li>
                  <li><strong>Durée :</strong> 2 ans</li>
                </ul>
              </div>
              <p>
                <strong>Base légale :</strong> Votre consentement
              </p>
              <p>
                Les données collectées sont anonymisées et ne permettent pas de vous identifier personnellement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cookies tiers</h2>
              <p>
                Nous n'utilisons actuellement <strong>aucun cookie publicitaire ou de réseaux sociaux tiers</strong>.
              </p>
              <p>
                Si cela devait changer, nous mettrons à jour cette politique et vous en informerons.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Gestion de vos cookies</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Via notre plateforme</h3>
              <p>
                Lors de votre première visite, une bannière vous permet d'accepter ou de refuser les cookies non essentiels.
              </p>
              <p>
                Vous pouvez modifier vos préférences à tout moment depuis les paramètres de votre compte.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Via votre navigateur</h3>
              <p>
                Vous pouvez également gérer les cookies directement depuis votre navigateur :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
                <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies</li>
                <li><strong>Safari :</strong> Préférences → Confidentialité → Cookies</li>
                <li><strong>Edge :</strong> Paramètres → Confidentialité → Cookies</li>
              </ul>
              <p className="mt-4">
                <strong>⚠️ Attention :</strong> Bloquer tous les cookies peut empêcher certaines fonctionnalités de la plateforme de fonctionner correctement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Durée de conservation</h2>
              <table className="min-w-full border border-gray-300 mt-4">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Type de cookie</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Session (auth_token)</td>
                    <td className="border border-gray-300 px-4 py-2">7 jours ou fin de session</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Préférences</td>
                    <td className="border border-gray-300 px-4 py-2">1 an</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Analytiques</td>
                    <td className="border border-gray-300 px-4 py-2">2 ans</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies et vie privée</h2>
              <p>
                Les cookies ne contiennent pas de données personnelles identifiables. Ils ne peuvent pas :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Accéder à vos fichiers personnels</li>
                <li>Installer de logiciels malveillants</li>
                <li>Espionner vos activités sur d'autres sites</li>
                <li>Voler votre identité</li>
              </ul>
              <p className="mt-4">
                Pour plus d'informations sur la protection de vos données, consultez notre <Link to="/privacy" className="text-indigo-600 hover:underline font-medium">Politique de confidentialité</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Mises à jour</h2>
              <p>
                Cette politique peut être mise à jour pour refléter les changements dans notre utilisation des cookies.
              </p>
              <p>
                Nous vous informerons de toute modification significative par une notification sur la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
              <p>
                Pour toute question concernant notre utilisation des cookies :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Email :</strong> <a href="mailto:contact@saastracker.com" className="text-indigo-600 hover:underline">contact@saastracker.com</a></li>
                <li><strong>DPO :</strong> <a href="mailto:dpo@saastracker.com" className="text-indigo-600 hover:underline">dpo@saastracker.com</a></li>
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

export default Cookies;