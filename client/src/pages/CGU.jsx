// client/src/pages/CGU.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CGU = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Conditions Générales d'Utilisation</h1>
          
          <div className="prose prose-indigo max-w-none space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions d'utilisation de la plateforme SaaS Tracker (ci-après « la Plateforme »), ainsi que les droits et obligations des utilisateurs (ci-après « l'Utilisateur » ou « les Utilisateurs »).
              </p>
              <p>
                L'accès et l'utilisation de la Plateforme impliquent l'acceptation sans réserve des présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du service</h2>
              <p>
                SaaS Tracker est une plateforme de gestion et de suivi des abonnements, contrats et licences d'entreprise. Elle permet notamment de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Centraliser tous les contrats et abonnements</li>
                <li>Suivre les dates de renouvellement et les échéances</li>
                <li>Recevoir des alertes automatiques</li>
                <li>Gérer les documents associés (contrats, factures)</li>
                <li>Analyser les coûts et optimiser les dépenses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Accès à la Plateforme</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Inscription</h3>
              <p>
                L'accès à la Plateforme nécessite la création d'un compte utilisateur. L'Utilisateur s'engage à fournir des informations exactes et à jour lors de son inscription.
              </p>
              <p>
                L'Utilisateur est responsable de la confidentialité de ses identifiants de connexion et s'engage à ne pas les communiquer à des tiers.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Suspension et résiliation</h3>
              <p>
                [Votre entreprise] se réserve le droit de suspendre ou de résilier l'accès à la Plateforme en cas de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Non-respect des présentes CGU</li>
                <li>Utilisation frauduleuse ou abusive de la Plateforme</li>
                <li>Non-paiement des frais d'abonnement (pour les comptes payants)</li>
                <li>Demande de l'Utilisateur</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Obligations de l'Utilisateur</h2>
              <p>
                L'Utilisateur s'engage à :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utiliser la Plateforme conformément à sa destination et aux lois en vigueur</li>
                <li>Ne pas tenter de contourner les mesures de sécurité</li>
                <li>Ne pas utiliser la Plateforme à des fins illégales ou frauduleuses</li>
                <li>Ne pas porter atteinte aux droits de tiers</li>
                <li>Respecter la confidentialité des données auxquelles il a accès</li>
                <li>Signaler toute anomalie ou faille de sécurité détectée</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Propriété intellectuelle</h2>
              <p>
                L'ensemble des éléments de la Plateforme (design, code, textes, logos, etc.) est protégé par le droit de la propriété intellectuelle.
              </p>
              <p>
                L'Utilisateur dispose d'un droit d'utilisation personnel, non exclusif et non cessible de la Plateforme, uniquement pour ses besoins propres.
              </p>
              <p>
                Toute reproduction, représentation, modification ou exploitation non autorisée de la Plateforme est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Données personnelles</h2>
              <p>
                Les données personnelles collectées font l'objet d'un traitement informatique conformément au RGPD.
              </p>
              <p>
                Pour plus d'informations sur le traitement de vos données, consultez notre <Link to="/privacy" className="text-indigo-600 hover:underline font-medium">Politique de confidentialité</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Tarification et paiement</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Offre gratuite</h3>
              <p>
                L'offre gratuite permet d'utiliser la Plateforme avec des fonctionnalités limitées (jusqu'à 10 contrats).
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.2 Offres payantes</h3>
              <p>
                Les offres payantes sont facturées mensuellement ou annuellement selon l'option choisie.
              </p>
              <p>
                Une période d'essai gratuite de 30 jours est offerte pour toute nouvelle souscription à une offre payante.
              </p>
              <p>
                Le paiement s'effectue par carte bancaire via un processeur de paiement sécurisé.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.3 Résiliation</h3>
              <p>
                L'Utilisateur peut résilier son abonnement à tout moment depuis son compte. La résiliation prend effet à la fin de la période d'abonnement en cours.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disponibilité et maintenance</h2>
              <p>
                [Votre entreprise] s'efforce d'assurer une disponibilité optimale de la Plateforme, mais ne peut garantir une accessibilité 24h/24 et 7j/7.
              </p>
              <p>
                Des opérations de maintenance peuvent être effectuées, entraînant une interruption temporaire du service. [Votre entreprise] s'efforcera d'en informer les Utilisateurs à l'avance dans la mesure du possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation de responsabilité</h2>
              <p>
                [Votre entreprise] ne saurait être tenue responsable :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Des dommages directs ou indirects résultant de l'utilisation de la Plateforme</li>
                <li>De la perte de données résultant d'un dysfonctionnement</li>
                <li>Des interruptions de service pour maintenance ou cas de force majeure</li>
                <li>De l'inexactitude des informations saisies par l'Utilisateur</li>
              </ul>
              <p>
                L'Utilisateur reste seul responsable de l'utilisation qu'il fait de la Plateforme et des décisions prises sur la base des informations fournies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications des CGU</h2>
              <p>
                [Votre entreprise] se réserve le droit de modifier les présentes CGU à tout moment.
              </p>
              <p>
                Les Utilisateurs seront informés de toute modification substantielle par email ou notification sur la Plateforme.
              </p>
              <p>
                La poursuite de l'utilisation de la Plateforme après modification des CGU vaut acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Droit applicable et litiges</h2>
              <p>
                Les présentes CGU sont régies par le droit français.
              </p>
              <p>
                En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant les tribunaux compétents.
              </p>
            </section>

            <section className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Pour toute question concernant ces CGU, contactez-nous à : <a href="mailto:contact@saastracker.com" className="text-indigo-600 hover:underline">contact@saastracker.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGU;