#!/bin/bash
# ============================================================================
# INSTALLEUR MDM UNIX - 1-CLIC
# ============================================================================
# Script simplifié pour installation rapide de l'agent MDM
# Compatible: macOS, Ubuntu, Debian, CentOS, RHEL
# ============================================================================

echo ""
echo "=========================================="
echo "  INSTALLATION AGENT MDM SAAS TRACKER"
echo "=========================================="
echo ""

# Vérifier droits root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Ce script doit être exécuté en tant que root"
   echo "Utilisez: sudo $0"
   exit 1
fi

# Demander URL API
echo "📝 Configuration de l'agent"
echo ""
read -p "URL de l'API (ex: https://api.saas-tracker.com): " api_url
if [[ -z "$api_url" ]]; then
    echo "❌ URL API requise"
    exit 1
fi

# Demander token
read -p "Token d'organisation (depuis le dashboard): " org_token
if [[ -z "$org_token" ]]; then
    echo "❌ Token organisation requis"
    exit 1
fi

echo ""
echo "🔧 Configuration:"
echo "   API: $api_url"
echo "   Token: ${org_token:0:8}..."
echo ""

# Créer dossier installation
install_dir="/usr/local/bin"
echo "📁 Dossier installation: $install_dir"

# Installer agent
agent_path="$install_dir/saas-tracker-mdm"
echo "📥 Installation agent MDM..."

# Copier agent depuis dossier local
current_dir=$(dirname "$(realpath "$0")")
source_agent="$current_dir/mdm-agent-unix.sh"

if [[ -f "$source_agent" ]]; then
    cp "$source_agent" "$agent_path"
    chmod +x "$agent_path"
    echo "✅ Agent installé: $agent_path"
else
    echo "❌ Fichier mdm-agent-unix.sh non trouvé"
    echo "Assurez-vous que mdm-agent-unix.sh est dans le même dossier que ce script"
    exit 1
fi

# Configurer URL API dans l'agent
echo "⚙️  Configuration URL API..."
sed -i.bak "s|YOUR_API_URL_HERE|$api_url|g" "$agent_path"

# Vérifier dépendances
echo "🔍 Vérification dépendances..."
missing_deps=()

if ! command -v curl &> /dev/null; then
    missing_deps+=("curl")
fi

if ! command -v jq &> /dev/null; then
    missing_deps+=("jq")
fi

if [[ ${#missing_deps[@]} -gt 0 ]]; then
    echo "⚠️  Dépendances manquantes: ${missing_deps[*]}"
    echo "Installation automatique..."
    
    # Détecter gestionnaire de paquets
    if command -v apt-get &> /dev/null; then
        apt-get update -qq
        apt-get install -y "${missing_deps[@]}"
    elif command -v yum &> /dev/null; then
        yum install -y "${missing_deps[@]}"
    elif command -v brew &> /dev/null; then
        brew install "${missing_deps[@]}"
    else
        echo "❌ Gestionnaire de paquets non reconnu"
        echo "Installez manuellement: ${missing_deps[*]}"
        exit 1
    fi
fi

# Exécuter enregistrement
echo "📡 Enregistrement du device..."
echo ""

if $agent_path register "$org_token"; then
    echo ""
    echo "=========================================="
    echo "✅ INSTALLATION TERMINÉE AVEC SUCCÈS!"
    echo "=========================================="
    echo ""
    echo "🎯 L'agent est maintenant actif et enverra:"
    echo "   • Heartbeat toutes les 4 heures (cron)"
    echo ""
    echo "📊 Vérifiez le dashboard MDM pour voir ce device"
    echo "📝 Logs disponibles: /var/log/saas-tracker-mdm.log"
    echo ""
    echo "🛠️  Commandes utiles:"
    echo "   • Heartbeat manuel: sudo $agent_path heartbeat"
    echo "   • Voir logs: tail -f /var/log/saas-tracker-mdm.log"
    echo "   • Voir cron: crontab -l"
    echo ""
else
    echo ""
    echo "❌ ERREUR lors de l'enregistrement"
    echo ""
    echo "Vérifiez:"
    echo "  • URL API correcte"
    echo "  • Token organisation valide"
    echo "  • Connexion internet active"
    echo ""
    echo "Logs: tail -f /var/log/saas-tracker-mdm.log"
    exit 1
fi