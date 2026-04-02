#!/bin/bash
# ============================================================================
# AGENT MDM UNIX - Bash
# ============================================================================
# Collecte automatique des informations système et envoi au serveur MDM
# Compatible: macOS, Ubuntu, Debian, CentOS, RHEL
# Version: 1.0.0
# ============================================================================

# Configuration
API_URL=https://saas-tracker-api.onrender.com  # À remplacer par URL réelle
CONFIG_FILE="/usr/local/etc/saas-tracker/mdm-config.json"
LOG_FILE="/var/log/saas-tracker-mdm.log"

# ============================================================================
# FONCTION: Logger
# ============================================================================
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# ============================================================================
# FONCTION: Détecter OS
# ============================================================================
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ -f /etc/os-release ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

# ============================================================================
# FONCTION: Collecter Informations Système
# ============================================================================
collect_inventory() {
    log_message "INFO" "Début collecte inventaire système..."

    local os_type=$(detect_os)
    
    # Hostname
    local hostname=$(hostname)
    
    # Serial Number
    local serial_number=""
    if [[ "$os_type" == "macos" ]]; then
        serial_number=$(system_profiler SPHardwareDataType | awk '/Serial Number/{print $4}')
    else
        # Linux: essayer dmidecode
        if command -v dmidecode &> /dev/null && [[ $EUID -eq 0 ]]; then
            serial_number=$(dmidecode -s system-serial-number 2>/dev/null | head -1)
        else
            serial_number="LINUX-$(hostname)-$(date +%s)"
        fi
    fi
    
    # MAC Address
    local mac_address=""
    if [[ "$os_type" == "macos" ]]; then
        mac_address=$(ifconfig en0 | awk '/ether/{print $2}')
    else
        mac_address=$(ip link show | awk '/ether/{print $2}' | head -1)
    fi
    
    # OS Version
    local os_version=""
    if [[ "$os_type" == "macos" ]]; then
        os_version="macOS $(sw_vers -productVersion)"
    else
        os_version=$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
    fi
    
    # Manufacturer & Model
    local manufacturer="Unknown"
    local model="Unknown"
    if [[ "$os_type" == "macos" ]]; then
        manufacturer="Apple"
        model=$(system_profiler SPHardwareDataType | awk '/Model Name/{print $3, $4, $5}')
    else
        if command -v dmidecode &> /dev/null && [[ $EUID -eq 0 ]]; then
            manufacturer=$(dmidecode -s system-manufacturer 2>/dev/null | head -1)
            model=$(dmidecode -s system-product-name 2>/dev/null | head -1)
        fi
    fi
    
    # CPU
    local cpu_model=""
    local cpu_cores=0
    if [[ "$os_type" == "macos" ]]; then
        cpu_model=$(sysctl -n machdep.cpu.brand_string)
        cpu_cores=$(sysctl -n hw.ncpu)
    else
        cpu_model=$(lscpu | grep "Model name" | cut -d':' -f2 | xargs)
        cpu_cores=$(nproc)
    fi
    
    # RAM
    local ram_gb=0
    if [[ "$os_type" == "macos" ]]; then
        ram_bytes=$(sysctl -n hw.memsize)
        ram_gb=$(echo "scale=2; $ram_bytes / 1073741824" | bc)
    else
        ram_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        ram_gb=$(echo "scale=2; $ram_kb / 1048576" | bc)
    fi
    
    # Disque
    local disk_total_gb=0
    local disk_free_gb=0
    if [[ "$os_type" == "macos" ]]; then
        disk_info=$(df -g / | tail -1)
        disk_total_gb=$(echo $disk_info | awk '{print $2}')
        disk_free_gb=$(echo $disk_info | awk '{print $4}')
    else
        disk_info=$(df -BG / | tail -1)
        disk_total_gb=$(echo $disk_info | awk '{print $2}' | sed 's/G//')
        disk_free_gb=$(echo $disk_info | awk '{print $4}' | sed 's/G//')
    fi
    
    # IP locale
    local ip_local=""
    if [[ "$os_type" == "macos" ]]; then
        ip_local=$(ifconfig en0 | grep "inet " | awk '{print $2}')
    else
        ip_local=$(hostname -I | awk '{print $1}')
    fi
    
    # IP publique
    local ip_public=""
    ip_public=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "")
    
    # Username
    local current_username=$(whoami)
    
    # Last boot
    local last_boot=""
    if [[ "$os_type" == "macos" ]]; then
        last_boot=$(sysctl -n kern.boottime | awk '{print $4}' | sed 's/,//')
        last_boot=$(date -r $last_boot -u '+%Y-%m-%dT%H:%M:%SZ')
    else
        last_boot=$(uptime -s 2>/dev/null || date -d "$(who -b | awk '{print $3, $4}')" '+%Y-%m-%dT%H:%M:%SZ')
    fi
    
    # Utilisation CPU (moyenne 3 secondes)
    local cpu_usage_percent=0
    if [[ "$os_type" == "macos" ]]; then
        cpu_usage_percent=$(ps -A -o %cpu | awk '{s+=$1} END {printf "%.2f", s}')
    else
        cpu_usage_percent=$(top -bn3 -d1 | grep "Cpu(s)" | tail -1 | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{printf "%.2f", 100 - $1}')
    fi
    
    # Utilisation RAM
    local ram_usage_percent=0
    if [[ "$os_type" == "macos" ]]; then
        ram_used=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
        ram_used_gb=$(echo "scale=2; $ram_used * 4096 / 1073741824" | bc)
        ram_usage_percent=$(echo "scale=2; ($ram_used_gb / $ram_gb) * 100" | bc)
    else
        ram_used_kb=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        ram_used_gb=$(echo "scale=2; ($ram_kb - $ram_used_kb) / 1048576" | bc)
        ram_usage_percent=$(echo "scale=2; ($ram_used_gb / $ram_gb) * 100" | bc)
    fi
    
    # Logiciels installés (limité pour performance)
    log_message "INFO" "Collecte logiciels installés..."
    local installed_software="[]"
    if [[ "$os_type" == "macos" ]]; then
        # macOS: Applications dans /Applications
        installed_software=$(find /Applications -maxdepth 2 -name "*.app" -print0 2>/dev/null | xargs -0 -I {} basename {} .app | head -50 | jq -R -s -c 'split("\n")[:-1] | map({name: ., version: "N/A", publisher: "Unknown"})')
    else
        # Linux: dpkg ou rpm selon distribution
        if command -v dpkg &> /dev/null; then
            installed_software=$(dpkg -l | grep "^ii" | awk '{print $2, $3}' | head -50 | jq -R -s -c 'split("\n")[:-1] | map(split(" ")) | map({name: .[0], version: .[1], publisher: "Unknown"})')
        elif command -v rpm &> /dev/null; then
            installed_software=$(rpm -qa --queryformat "%{NAME} %{VERSION}\n" | head -50 | jq -R -s -c 'split("\n")[:-1] | map(split(" ")) | map({name: .[0], version: .[1], publisher: "Unknown"})')
        fi
    fi
    
    # Construction JSON
    cat <<EOF
{
    "hostname": "$hostname",
    "serial_number": "$serial_number",
    "mac_address": "$mac_address",
    "os_type": "$os_type",
    "os_version": "$os_version",
    "manufacturer": "$manufacturer",
    "model": "$model",
    "device_type": "computer",
    "cpu_model": "$cpu_model",
    "cpu_cores": $cpu_cores,
    "ram_gb": $ram_gb,
    "disk_total_gb": $disk_total_gb,
    "disk_free_gb": $disk_free_gb,
    "ip_local": "$ip_local",
    "ip_public": "$ip_public",
    "current_username": "$current_username",
    "last_boot": "$last_boot",
    "cpu_usage_percent": $cpu_usage_percent,
    "ram_usage_percent": $ram_usage_percent,
    "installed_software": $installed_software,
    "agent_version": "1.0.0",
    "location": "Unknown"
}
EOF
}

# ============================================================================
# FONCTION: Enregistrer Device
# ============================================================================
register_device() {
    local org_token=$1
    
    log_message "INFO" "Enregistrement du device..."
    
    local inventory=$(collect_inventory)
    
    local registration_data=$(echo "$inventory" | jq -c "{
        organization_token: \"$org_token\",
        hostname: .hostname,
        serial_number: .serial_number,
        mac_address: .mac_address,
        os_type: .os_type,
        manufacturer: .manufacturer,
        model: .model,
        os_version: .os_version
    }")
    
    local response=$(curl -s -X POST "$API_URL/api/mdm/register" \
        -H "Content-Type: application/json" \
        -d "$registration_data")
    
    local success=$(echo "$response" | jq -r '.success')
    
    if [[ "$success" == "true" ]]; then
        local device_id=$(echo "$response" | jq -r '.device_id')
        local device_token=$(echo "$response" | jq -r '.device_token')
        
        log_message "INFO" "✅ Device enregistré! ID: $device_id"
        
        # Sauvegarder config
        local config_dir=$(dirname "$CONFIG_FILE")
        sudo mkdir -p "$config_dir"
        
        echo "{
            \"device_id\": \"$device_id\",
            \"device_token\": \"$device_token\",
            \"organization_token\": \"$org_token\",
            \"registered_at\": \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"
        }" | sudo tee "$CONFIG_FILE" > /dev/null
        
        log_message "INFO" "Configuration sauvegardée: $CONFIG_FILE"
        return 0
    else
        local error=$(echo "$response" | jq -r '.error')
        log_message "ERROR" "Erreur enregistrement: $error"
        return 1
    fi
}

# ============================================================================
# FONCTION: Envoyer Heartbeat
# ============================================================================
send_heartbeat() {
    log_message "INFO" "Envoi heartbeat..."
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_message "ERROR" "Config manquante. Exécutez d'abord register."
        return 1
    fi
    
    local device_token=$(jq -r '.device_token' "$CONFIG_FILE")
    
    local inventory=$(collect_inventory)
    
    local response=$(curl -s -X POST "$API_URL/api/mdm/heartbeat" \
        -H "X-Device-Token: $device_token" \
        -H "Content-Type: application/json" \
        -d "$inventory")
    
    local success=$(echo "$response" | jq -r '.success')
    
    if [[ "$success" == "true" ]]; then
        log_message "INFO" "✅ Heartbeat envoyé avec succès"
        
        local has_changes=$(echo "$response" | jq -r '.has_changes')
        if [[ "$has_changes" == "true" ]]; then
            local changes_count=$(echo "$response" | jq -r '.changes_count')
            log_message "INFO" "⚠️  Changements détectés: $changes_count modifications"
        fi
        
        return 0
    else
        local error=$(echo "$response" | jq -r '.error')
        log_message "ERROR" "Erreur heartbeat: $error"
        return 1
    fi
}

# ============================================================================
# FONCTION: Installer Cron Job
# ============================================================================
install_cron() {
    log_message "INFO" "Installation cron job..."
    
    local script_path=$(realpath "$0")
    local cron_line="0 */4 * * * $script_path heartbeat >> $LOG_FILE 2>&1"
    
    # Ajouter au crontab
    (crontab -l 2>/dev/null | grep -v "$script_path"; echo "$cron_line") | crontab -
    
    log_message "INFO" "✅ Cron job installé (toutes les 4 heures)"
}

# ============================================================================
# MAIN
# ============================================================================

# Créer dossier logs
sudo mkdir -p $(dirname "$LOG_FILE")
sudo chmod 666 "$LOG_FILE" 2>/dev/null || true

log_message "INFO" "=========================================="
log_message "INFO" "Agent MDM SaaS Tracker - v1.0.0"
log_message "INFO" "=========================================="

case "$1" in
    register)
        if [[ -z "$2" ]]; then
            echo "❌ Token organisation requis"
            echo "Usage: sudo $0 register YOUR_TOKEN"
            exit 1
        fi
        
        if register_device "$2"; then
            install_cron
            echo ""
            echo "✅ Installation terminée avec succès!"
            echo "📊 Le heartbeat sera envoyé automatiquement toutes les 4 heures"
            echo "📝 Logs disponibles dans: $LOG_FILE"
        else
            echo "❌ Erreur lors de l'enregistrement"
            exit 1
        fi
        ;;
        
    heartbeat)
        send_heartbeat
        ;;
        
    install-cron)
        install_cron
        echo "✅ Cron job réinstallé"
        ;;
        
    *)
        echo "Agent MDM SaaS Tracker - Unix"
        echo ""
        echo "Usage:"
        echo "  Installation initiale:"
        echo "    sudo $0 register YOUR_TOKEN"
        echo ""
        echo "  Heartbeat manuel:"
        echo "    sudo $0 heartbeat"
        echo ""
        echo "  Réinstaller cron:"
        echo "    sudo $0 install-cron"
        ;;
esac