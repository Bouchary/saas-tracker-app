# ============================================================================
# INSTALLEUR MDM WINDOWS - 1-CLIC
# ============================================================================
# Script simplifié pour installation rapide de l'agent MDM
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$OrganizationToken
)

Write-Host ""
Write-Host "=========================================="
Write-Host "  INSTALLATION AGENT MDM SAAS TRACKER"
Write-Host "=========================================="
Write-Host ""

# Vérifier droits admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Droits administrateur requis!"
    Write-Host ""
    Write-Host "Clic droit sur ce script → 'Exécuter en tant qu'administrateur'"
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Demander URL API si non fournie
if (-not $ApiUrl) {
    Write-Host "📝 Configuration de l'agent"
    Write-Host ""
    $ApiUrl = Read-Host "URL de l'API (ex: https://api.saas-tracker.com)"
    if (-not $ApiUrl) {
        Write-Host "❌ URL API requise"
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
}

# Demander token si non fourni
if (-not $OrganizationToken) {
    $OrganizationToken = Read-Host "Token d'organisation (depuis le dashboard)"
    if (-not $OrganizationToken) {
        Write-Host "❌ Token organisation requis"
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Configuration:"
Write-Host "   API: $ApiUrl"
Write-Host "   Token: $($OrganizationToken.Substring(0, 8))..."
Write-Host ""

# Créer dossier installation
$installDir = "$env:ProgramData\SaaSTracker"
Write-Host "📁 Création dossier: $installDir"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Télécharger ou copier agent
$agentPath = "$installDir\mdm-agent-windows.ps1"
Write-Host "📥 Installation agent MDM..."

# Si agent est dans le même dossier, le copier
$currentDir = Split-Path -Parent $PSCommandPath
$sourceAgent = Join-Path $currentDir "mdm-agent-windows.ps1"

if (Test-Path $sourceAgent) {
    Copy-Item -Path $sourceAgent -Destination $agentPath -Force
    Write-Host "✅ Agent copié depuis dossier local"
} else {
    Write-Host "❌ Fichier mdm-agent-windows.ps1 non trouvé"
    Write-Host "Assurez-vous que mdm-agent-windows.ps1 est dans le même dossier que ce script"
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Configurer URL API dans l'agent
Write-Host "⚙️  Configuration URL API..."
$agentContent = Get-Content -Path $agentPath -Raw
$agentContent = $agentContent -replace 'YOUR_API_URL_HERE', $ApiUrl
Set-Content -Path $agentPath -Value $agentContent

# Exécuter enregistrement
Write-Host "📡 Enregistrement du device..."
Write-Host ""

try {
    & PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File $agentPath -Register -OrganizationToken $OrganizationToken
    
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "✅ INSTALLATION TERMINÉE AVEC SUCCÈS!"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "🎯 L'agent est maintenant actif et enverra:"
    Write-Host "   • Heartbeat toutes les 4 heures"
    Write-Host "   • Heartbeat à chaque démarrage"
    Write-Host ""
    Write-Host "📊 Vérifiez le dashboard MDM pour voir ce device"
    Write-Host "📝 Logs disponibles: $installDir\mdm-agent.log"
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERREUR lors de l'enregistrement:"
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Vérifiez:"
    Write-Host "  • URL API correcte"
    Write-Host "  • Token organisation valide"
    Write-Host "  • Connexion internet active"
    Write-Host ""
}

Read-Host "Appuyez sur Entrée pour quitter"