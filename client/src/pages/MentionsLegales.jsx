// client/src/pages/MentionsLegales.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MentionsLegales = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Mentions Légales</h1>
          
          <div className="prose prose-indigo max-w-none space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Éditeur du site</h2>
              <p>
                Le site SaaS Tracker est édité par :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Raison sociale :</strong> [Votre entreprise]</li>
                <li><strong>Forme juridique :</strong> [SARL, SAS, etc.]</li>
                <li><strong>Capital social :</strong> [Montant] euros</li>
                <li><strong>Siège social :</strong> [Adresse complète]</li>
                <li><strong>RCS :</strong> [Ville] [Numéro]</li>
                <li><strong>SIRET :</strong> [Numéro]</li>
                <li><strong>TVA intracommunautaire :</strong> [Numéro]</li>
                <li><strong>Email :</strong> contact@saastracker.com</li>
                <li><strong>Téléphone :</strong> [Numéro]</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Directeur de la publication</h2>
              <p>
                Le directeur de la publication du site est : <strong>[Nom du responsable]</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Hébergement</h2>
              <p>
                Le site est hébergé par :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Hébergeur :</strong> Netlify, Inc.</li>
                <li><strong>Adresse :</strong> 2325 3rd Street, Suite 296, San Francisco, CA 94107, USA</li>
                <li><strong>Site web :</strong> <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.netlify.com</a></li>
              </ul>
              <p className="mt-4">
                Base de données hébergée par :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Hébergeur :</strong> Render Services, Inc.</li>
                <li><strong>Adresse :</strong> 525 Brannan St, San Francisco, CA 94107, USA</li>
                <li><strong>Site web :</strong> <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">render.com</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propriété intellectuelle</h2>
              <p>
                L'ensemble du contenu de ce site (structure, textes, logos, images, vidéos, etc.) est la propriété exclusive de [Votre entreprise], sauf mention contraire.
              </p>
              <p>
                Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments est strictement interdite sans l'accord exprès par écrit de [Votre entreprise].
              </p>
              <p>
                Les marques et logos présents sur le site sont déposés par [Votre entreprise] ou éventuellement par ses partenaires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Protection des données personnelles</h2>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
              </p>
              <p>
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse : <a href="mailto:contact@saastracker.com" className="text-indigo-600 hover:underline">contact@saastracker.com</a>
              </p>
              <p>
                Pour plus d'informations, consultez notre <Link to="/privacy" className="text-indigo-600 hover:underline font-medium">Politique de confidentialité</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
              <p>
                Le site utilise des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques de visites.
              </p>
              <p>
                Pour en savoir plus, consultez notre <Link to="/cookies" className="text-indigo-600 hover:underline font-medium">Politique de cookies</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation de responsabilité</h2>
              <p>
                [Votre entreprise] met tout en œuvre pour offrir aux utilisateurs des informations et des outils disponibles et vérifiés, mais ne saurait être tenue responsable des erreurs, d'une absence de disponibilité des informations et/ou de la présence de virus sur son site.
              </p>
              <p>
                Les informations fournies par [Votre entreprise] le sont à titre indicatif et ne sauraient dispenser l'utilisateur d'une analyse complémentaire et personnalisée.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Liens hypertextes</h2>
              <p>
                Le site peut contenir des liens hypertextes vers d'autres sites. [Votre entreprise] ne saurait être tenue responsable du contenu de ces sites externes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Droit applicable et juridiction compétente</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français.
              </p>
              <p>
                En cas de litige, les tribunaux français seront seuls compétents.
              </p>
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

export default MentionsLegales;