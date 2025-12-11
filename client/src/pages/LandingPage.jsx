// client/src/pages/LandingPage.jsx
// Page d'accueil publique moderne avec hero, features et footer

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  BarChart3, 
  Bell, 
  FileText, 
  Shield,
  Zap,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Détection du scroll pour le header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Suivi en temps réel",
      description: "Tableaux de bord intuitifs pour visualiser vos coûts et vos échéances en un coup d'œil."
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Alertes intelligentes",
      description: "Ne ratez plus jamais une date de renouvellement. Notifications automatiques personnalisées."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Gestion documentaire",
      description: "Centralisez tous vos contrats, licences et factures au même endroit."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Sécurité maximale",
      description: "Vos données sont cryptées et sauvegardées. Conformité RGPD garantie."
    }
  ];

  const stats = [
    { number: "500+", label: "Entreprises" },
    { number: "10k+", label: "Abonnements suivis" },
    { number: "30%", label: "Économies moyennes" },
    { number: "24/7", label: "Support disponible" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-xl shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SaaS Tracker
              </span>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                Tarifs
              </a>
              <a href="#about" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                À propos
              </a>
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-medium"
              >
                Se connecter
              </Link>
            </nav>

            {/* Burger Menu Mobile */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Menu Mobile */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4 animate-slide-down">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                Tarifs
              </a>
              <a href="#about" className="text-gray-700 hover:text-indigo-600 transition font-medium">
                À propos
              </a>
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-center font-medium"
              >
                Se connecter
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-4 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold">
              🚀 Période d'essai gratuite de 30 jours
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Reprenez le contrôle de
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                vos abonnements
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Centralisez la gestion de vos contrats, licences et abonnements. 
              Suivez vos coûts, recevez des alertes et ne ratez plus jamais une échéance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/login"
                className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:border-indigo-600 hover:text-indigo-600 transition-all"
              >
                Voir les fonctionnalités
              </a>
            </div>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="relative animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-4 border border-gray-200">
              <div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-24 h-24 text-indigo-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Aperçu du dashboard</p>
                  <p className="text-sm text-gray-400 mt-2">Interface intuitive et moderne</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-indigo-100 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une solution complète pour gérer l'ensemble de vos ressources d'entreprise
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-xl text-gray-600">
              Commencez gratuitement, évoluez quand vous le souhaitez
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan Gratuit */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Gratuit</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">0€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Jusqu'à 10 contrats</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Alertes basiques</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Support email</span>
                </li>
              </ul>
              <Link
                to="/login"
                className="block w-full py-3 px-6 bg-gray-100 text-gray-900 rounded-lg font-semibold text-center hover:bg-gray-200 transition"
              >
                Commencer
              </Link>
            </div>

            {/* Plan Pro (Recommandé) */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white transform scale-105 shadow-2xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                Recommandé
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">29€</span>
                <span className="text-indigo-100">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Contrats illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Alertes intelligentes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Gestion documentaire</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span>Support prioritaire</span>
                </li>
              </ul>
              <Link
                to="/login"
                className="block w-full py-3 px-6 bg-white text-indigo-600 rounded-lg font-semibold text-center hover:shadow-lg transition"
              >
                Essai gratuit 30 jours
              </Link>
            </div>

            {/* Plan Entreprise */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Entreprise</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">Sur mesure</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Tout du plan Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Support dédié</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Intégrations sur mesure</span>
                </li>
              </ul>
              <a
                href="mailto:contact@saastracker.com"
                className="block w-full py-3 px-6 bg-gray-100 text-gray-900 rounded-lg font-semibold text-center hover:bg-gray-200 transition"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à optimiser vos abonnements ?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Rejoignez des centaines d'entreprises qui ont déjà repris le contrôle de leurs dépenses SaaS.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
          >
            Commencer gratuitement
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Colonne 1 : À propos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SaaS Tracker</span>
              </div>
              <p className="text-sm leading-relaxed">
                La solution complète pour gérer vos abonnements, contrats et licences d'entreprise.
              </p>
            </div>

            {/* Colonne 2 : Produit */}
            <div>
              <h4 className="font-bold text-white mb-4">Produit</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
                <li><Link to="/login" className="hover:text-white transition">Démo</Link></li>
                <li><a href="#" className="hover:text-white transition">Changelog</a></li>
              </ul>
            </div>

            {/* Colonne 3 : Légal */}
            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/mentions-legales" className="hover:text-white transition">Mentions légales</Link></li>
                <li><Link to="/cgu" className="hover:text-white transition">CGU</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">Confidentialité</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition">Cookies</Link></li>
              </ul>
            </div>

            {/* Colonne 4 : Support */}
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:contact@saastracker.com" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2024 SaaS Tracker. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;