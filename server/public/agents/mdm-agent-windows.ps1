# ============================================================================
# AGENT MDM WINDOWS - PowerShell
# ============================================================================
# Collecte automatique des informations système et envoi au serveur MDM
# Version: 1.0.0
# ============================================================================

# Configuration
$API_URL =https://saas-tracker-api.onrender.com  # À remplacer par URL réelle (ex: https://api.saas-tracker.com)
$CONFIG_FILE = "$env:ProgramData\SaaSTracker\mdm-config.json"
$LOG_FILE = "$env:ProgramData\SaaSTracker\mdm-agent.log"

# ============================================================================
# FONCTION: Logger
# ============================================================================
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LOG_FILE -Value $logMessage
    Write-Host $logMessage
}

# ============================================================================
# FONCTION: Collecter Informations Système
# ============================================================================
function Get-SystemInventory {
    Write-Log "Début collecte inventaire système..."

    try {
        # Informations système de base
        $computerSystem = Get-WmiObject -Class Win32_ComputerSystem
        $operatingSystem = Get-WmiObject -Class Win32_OperatingSystem
        $processor = Get-WmiObject -Class Win32_Processor | Select-Object -First 1
        $bios = Get-WmiObject -Class Win32_BIOS
        
        # Disques
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
        $diskTotalGB = [math]::Round($disk.Size / 1GB, 2)
        $diskFreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)

        # RAM
        $ramGB = [math]::Round($computerSystem.TotalPhysicalMemory / 1GB, 2)

        # Réseau
        $networkAdapter = Get-WmiObject -Class Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
        $ipLocal = $networkAdapter.IPAddress | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+$' } | Select-Object -First 1
        $macAddress = $networkAdapter.MACAddress

        # IP publique
        try {
            $ipPublic = (Invoke-RestMethod -Uri "https://api.ipify.org?format=text" -TimeoutSec 5).Trim()
        } catch {
            $ipPublic = $null
            Write-Log "Impossible de récupérer IP publique" "WARNING"
        }

        # Dernier boot
        $lastBoot = $operatingSystem.ConvertToDateTime($operatingSystem.LastBootUpTime).ToString("yyyy-MM-ddTHH:mm:ssZ")

        # Logiciels installés (top 50 pour limiter taille)
        Write-Log "Collecte logiciels installés..."
        $installedSoftware = @()
        $registryPaths = @(
            "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
        )
        
        foreach ($path in $registryPaths) {
            Get-ItemProperty $path -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } | ForEach-Object {
                $installedSoftware += @{
                    name = $_.DisplayName
                    version = if ($_.DisplayVersion) { $_.DisplayVersion } else { "N/A" }
                    publisher = if ($_.Publisher) { $_.Publisher } else { "Unknown" }
                }
            }
        }
        
        # Limiter à 100 logiciels
        $installedSoftware = $installedSoftware | Select-Object -First 100

        # Utilisation CPU/RAM (moyenne sur 3 secondes)
        Write-Log "Mesure utilisation CPU/RAM..."
        $cpuUsage = (Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3).CounterSamples | Measure-Object -Property CookedValue -Average | Select-Object -ExpandProperty Average
        $cpuUsagePercent = [math]::Round($cpuUsage, 2)

        $ramUsedGB = [math]::Round(($computerSystem.TotalPhysicalMemory - $operatingSystem.FreePhysicalMemory * 1KB) / 1GB, 2)
        $ramUsagePercent = [math]::Round(($ramUsedGB / $ramGB) * 100, 2)

        # Construction inventaire
        $inventory = @{
            hostname = $env:COMPUTERNAME
            serial_number = $bios.SerialNumber
            mac_address = $macAddress
            os_type = "windows"
            os_version = "$($operatingSystem.Caption) $($operatingSystem.Version)"
            manufacturer = $computerSystem.Manufacturer
            model = $computerSystem.Model
            device_type = if ($computerSystem.PCSystemType -eq 2) { "laptop" } else { "desktop" }
            cpu_model = $processor.Name.Trim()
            cpu_cores = $processor.NumberOfCores
            ram_gb = $ramGB
            disk_total_gb = $diskTotalGB
            disk_free_gb = $diskFreeGB
            ip_local = $ipLocal
            ip_public = $ipPublic
            current_username = $env:USERNAME
            last_boot = $lastBoot
            cpu_usage_percent = $cpuUsagePercent
            ram_usage_percent = $ramUsagePercent
            installed_software = $installedSoftware
            agent_version = "1.0.0"
            location = "Unknown"
        }

        Write-Log "Inventaire collecté: $($installedSoftware.Count) logiciels, CPU: $cpuUsagePercent%, RAM: $ramUsagePercent%"
        return $inventory

    } catch {
        Write-Log "ERREUR lors de la collecte: $_" "ERROR"
        throw
    }
}

# ============================================================================
# FONCTION: Enregistrer Device (première fois)
# ============================================================================
function Register-Device {
    param([string]$OrganizationToken)

    Write-Log "Enregistrement du device..."

    try {
        $inventory = Get-SystemInventory

        $body = @{
            organization_token = $OrganizationToken
            hostname = $inventory.hostname
            serial_number = $inventory.serial_number
            mac_address = $inventory.mac_address
            os_type = $inventory.os_type
            manufacturer = $inventory.manufacturer
            model = $inventory.model
            os_version = $inventory.os_version
        } | ConvertTo-Json -Depth 5

        $response = Invoke-RestMethod -Uri "$API_URL/api/mdm/register" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30

        if ($response.success) {
            Write-Log "✅ Device enregistré avec succès! Device ID: $($response.device_id)"
            
            # Sauvegarder configuration
            $config = @{
                device_id = $response.device_id
                device_token = $response.device_token
                organization_token = $OrganizationToken
                registered_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
            
            $configDir = Split-Path -Parent $CONFIG_FILE
            if (-not (Test-Path $configDir)) {
                New-Item -ItemType Directory -Path $configDir -Force | Out-Null
            }
            
            $config | ConvertTo-Json | Set-Content -Path $CONFIG_FILE
            Write-Log "Configuration sauvegardée dans: $CONFIG_FILE"

            return $config
        } else {
            throw "Erreur enregistrement: $($response.error)"
        }

    } catch {
        Write-Log "ERREUR enregistrement: $_" "ERROR"
        throw
    }
}

# ============================================================================
# FONCTION: Envoyer Heartbeat
# ============================================================================
function Send-Heartbeat {
    Write-Log "Envoi heartbeat..."

    try {
        # Charger configuration
        if (-not (Test-Path $CONFIG_FILE)) {
            Write-Log "Config manquante. Exécutez d'abord Register-Device." "ERROR"
            throw "Configuration non trouvée"
        }

        $config = Get-Content -Path $CONFIG_FILE | ConvertFrom-Json

        # Collecter inventaire
        $inventory = Get-SystemInventory

        # Envoyer heartbeat
        $headers = @{
            "X-Device-Token" = $config.device_token
            "Content-Type" = "application/json"
        }

        $body = $inventory | ConvertTo-Json -Depth 5

        $response = Invoke-RestMethod -Uri "$API_URL/api/mdm/heartbeat" -Method POST -Headers $headers -Body $body -TimeoutSec 30

        if ($response.success) {
            Write-Log "✅ Heartbeat envoyé avec succès"
            if ($response.has_changes) {
                Write-Log "⚠️  Changements détectés: $($response.changes_count) modifications"
            }
            if ($response.alerts_generated -gt 0) {
                Write-Log "🔔 $($response.alerts_generated) alertes générées"
            }
        } else {
            Write-Log "Heartbeat échoué: $($response.error)" "WARNING"
        }

    } catch {
        Write-Log "ERREUR heartbeat: $_" "ERROR"
        throw
    }
}

# ============================================================================
# FONCTION: Installation Tâche Planifiée
# ============================================================================
function Install-ScheduledTask {
    Write-Log "Installation tâche planifiée..."

    try {
        $taskName = "SaaSTracker-MDM-Heartbeat"
        $scriptPath = $PSCommandPath
        
        # Vérifier si tâche existe déjà
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Write-Log "Tâche existe déjà, suppression..." "WARNING"
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }

        # Créer action
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -Heartbeat"

        # Créer trigger (toutes les 4 heures)
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 4) -RepetitionDuration ([TimeSpan]::MaxValue)

        # Créer trigger supplémentaire (au démarrage)
        $triggerStartup = New-ScheduledTaskTrigger -AtStartup

        # Paramètres
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

        # Créer tâche
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($trigger, $triggerStartup) -Principal $principal -Settings $settings -Description "Agent MDM SaaS Tracker - Heartbeat automatique" | Out-Null

        Write-Log "✅ Tâche planifiée créée: toutes les 4h + au démarrage"

    } catch {
        Write-Log "ERREUR création tâche: $_" "ERROR"
        throw
    }
}

# ============================================================================
# MAIN
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$OrganizationToken,
    
    [Parameter(Mandatory=$false)]
    [switch]$Register,
    
    [Parameter(Mandatory=$false)]
    [switch]$Heartbeat,
    
    [Parameter(Mandatory=$false)]
    [switch]$InstallTask
)

# Créer dossier logs si nécessaire
$logDir = Split-Path -Parent $LOG_FILE
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

Write-Log "=========================================="
Write-Log "Agent MDM SaaS Tracker - v1.0.0"
Write-Log "=========================================="

try {
    if ($Register) {
        # Mode enregistrement
        if (-not $OrganizationToken) {
            Write-Host "❌ Token organisation requis pour enregistrement"
            Write-Host "Usage: .\mdm-agent-windows.ps1 -Register -OrganizationToken YOUR_TOKEN"
            exit 1
        }
        
        Register-Device -OrganizationToken $OrganizationToken
        Install-ScheduledTask
        
        Write-Host ""
        Write-Host "✅ Installation terminée avec succès!"
        Write-Host "📊 Le heartbeat sera envoyé automatiquement toutes les 4 heures"
        Write-Host "📝 Logs disponibles dans: $LOG_FILE"
        
    } elseif ($Heartbeat) {
        # Mode heartbeat (appelé par tâche planifiée)
        Send-Heartbeat
        
    } elseif ($InstallTask) {
        # Réinstaller uniquement la tâche
        Install-ScheduledTask
        Write-Host "✅ Tâche planifiée réinstallée"
        
    } else {
        # Mode par défaut: afficher aide
        Write-Host "Agent MDM SaaS Tracker - Windows"
        Write-Host ""
        Write-Host "Usage:"
        Write-Host "  Installation initiale:"
        Write-Host "    .\mdm-agent-windows.ps1 -Register -OrganizationToken YOUR_TOKEN"
        Write-Host ""
        Write-Host "  Heartbeat manuel:"
        Write-Host "    .\mdm-agent-windows.ps1 -Heartbeat"
        Write-Host ""
        Write-Host "  Réinstaller tâche planifiée:"
        Write-Host "    .\mdm-agent-windows.ps1 -InstallTask"
    }

} catch {
    Write-Log "ERREUR FATALE: $_" "ERROR"
    Write-Host "❌ Erreur: $_"
    exit 1
}