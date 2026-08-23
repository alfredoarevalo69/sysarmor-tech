---
title: "Hardening Mínimo de Endpoints Windows 11 con Microsoft Intune"
description: "Aprende a desplegar políticas de hardening básico en Windows 11 utilizando Microsoft Intune y Entra ID: BitLocker, ASR Rules, Schannel, Defender AV, WUfB y control de USB."
pubDate: 2026-08-23
category: "Ciberseguridad"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/Hardening_Endpoints/Hardening_Endpoints.png"
pdfUrl: "/docs/Hardening-Endpoints-con-MS-Intune.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Seguridad de la Información, Operación e Innovación  

---

## Objetivo del documento

Este manual reúne un conjunto de recomendaciones mínimas de seguridad para estaciones de trabajo con Windows 11 administradas mediante Microsoft Intune y Microsoft Entra ID. No reemplaza políticas corporativas más completas, sino que ofrece un punto de partida práctico para fortalecer la seguridad básica de los equipos.

Las configuraciones incluyen: cifrado de disco, reducción de superficie de ataque, mitigación de protocolos obsoletos, firewall, actualizaciones de seguridad y control de dispositivos externos. Cada organización puede ampliar o ajustar estas medidas según sus necesidades y nivel de riesgo.

El valor principal de este documento es detallar por dónde se configuran las opciones en Intune y explicar su impacto en la protección del endpoint. Aunque existen otras configuraciones más avanzadas o críticas, estas recomendaciones mínimas garantizan un nivel de seguridad razonable y fácil de implementar, incluso en entornos de prueba o laboratorios.

---

## Arquitectura y Recursos Previos

Para la elaboración de las pruebas se utilizó la siguiente arquitectura:

*   **Consola de Gestión:** Microsoft Intune Admin Center (`intune.microsoft.com`).
*   **DC 2025:** Controlador de dominio.
*   **Servicio de Identidad:** Windows Server 2025 con Microsoft Entra ID (`entra.microsoft.com`).
*   **Repositorio CDN Público:** Repositorio GitHub (`recursos-publicos`) para el alojamiento de assets HTTP/HTTPS.
*   **Equipo Cliente:** Windows 11 Enterprise/Pro.

![Arquitectura Laboratorio Intune y Windows 11](/images/Hardening_Endpoints/Hardening_Endpoints1.png)

---

## Personalización Corporativa (Branding)

Mantener un branding uniforme en estaciones de trabajo refuerza la identidad corporativa y evita configuraciones no autorizadas.

### Configuración en Intune
*   **Ruta:** `Devices` → `Configuration profiles` → `Templates` → `Device restrictions`.
*   **Perfil:** `WIN11-PR-Personalization-SysArmor`.
*   **Desktop target wallpaper URL:** `https://raw.githubusercontent.com/alfredoarevalo69/recursos-publicos/main/WallPaper_SysArmorTech.png`
*   **Lock screen background image URL:** `https://raw.githubusercontent.com/alfredoarevalo69/recursos-publicos/main/WallPaper_SysArmorTech.png`

![Personalización de pantalla de bloqueo](/images/Hardening_Endpoints/Hardening_Endpoints2.png)

---

## Cifrado y Custodia de Claves (BitLocker)

BitLocker cifra discos y protege datos en reposo. Al habilitarlo de forma centralizada desde Intune, se asegura que todos los datos estén cifrados y que las claves de recuperación se custodien en un repositorio seguro (Microsoft Entra ID).

### Configuración en Intune
*   **Ruta:** `Endpoint security` → `Disk encryption` → `BitLocker`.
*   **Perfil:** `BitLocker_SysArmor.
*   **Método:** XTS-AES 256-bit.
*   **Custodia:** Guardar claves en Entra ID / AD DS.

![Configuración de BitLocker en Intune](/images/Hardening_Endpoints/Hardening_Endpoints3.png)

---

## Reducción de Superficie de Ataque (ASR Rules)

Las ASR Rules son un conjunto de políticas de Microsoft Defender que limitan comportamientos comunes utilizados por malware, como macros maliciosas, scripts sospechosos o procesos que intentan modificar configuraciones críticas.

### Modos de Aplicación
*   **No configurado:** Usa la configuración predeterminada de Windows Defender.
*   **Desactivado:** La regla se apaga explícitamente.
*   **Bloque:** Aplica en modo estricto e impide la acción.
*   **Auditoría:** Registra los eventos en el log de seguridad sin bloquear.
*   **Advertir:** Notifica al usuario, permitiéndole continuar si lo desea.

> **Estrategia de Despliegue Recomendada:**
> 1. Configurar la regla en modo **Auditoría** para evaluar impacto en aplicaciones legítimas.
> 2. Auditar eventos en el portal de Microsoft Defender.
> 3. Definir exclusiones si es necesario.
> 4. Cambiar la regla a modo **Bloque**.

![Reglas de reducción de superficie expuesta a ataques](/images/Hardening_Endpoints/Hardening_Endpoints4.png)

---

## Hardening de Red y Protección LSASS (Settings Catalog)

El hardening de red reduce la exposición de servicios obsoletos y protege el proceso LSASS (*Local Security Authority Subsystem Service*) contra el robo de credenciales en memoria.

| Categoría en Catálogo | Nombre de la Regla | Valor Requerido | Objetivo de Seguridad |
| :--- | :--- | :--- | :--- |
| **Administrative Templates > Network > DNS Client** | Turn off multicast name resolution | Enabled | Inhabilita LLMNR contra ataques de envenenamiento (Responder). |
| **Administrative Templates > Network > Lanman Server** | Enable SMB v1 protocol | Disabled | Bloquea el protocolo SMBv1 (Mitigación EternalBlue). |
| **Device Guard** | Turn On Virtualization Based Security | Enabled | Habilita seguridad basada en virtualización (VBS). |
| **Device Guard** | LSA Protection | Enabled with UEFI Lock | Activa Credential Guard para proteger la memoria de LSASS. |

---

## Deshabilitación de Protocolos Cifrados Obsoletos

Windows 11 incluye soporte para múltiples protocolos que representan un riesgo por vulnerabilidades conocidas (SSL 2.0/3.0, TLS 1.0/1.1).

### Despliegue mediante PowerShell Script
*   **Ruta en Intune:** Devices → Scripts → PowerShell.
*   **Script:** WIN11-SEC-Disable-LegacyProtocols.ps1.

"powershell"
# ==============================================================================
# Script: WIN11-SEC-Disable-LegacyProtocols.ps1
# Objetivo: Hardening de Schannel (SSL/TLS Obsoletos) y desactivación de PS v2
# ==============================================================================

# 1. Deshabilitar SSL 2.0, SSL 3.0, TLS 1.0 y TLS 1.1 en Schannel
$protocols = @("SSL 2.0", "SSL 3.0", "TLS 1.0", "TLS 1.1")

```powershell
# ==============================================================================
# Script: Disable-LegacyProtocols.ps1
# Objetivo: Hardening de Schannel (SSL/TLS Obsoletos) y desactivación de PS v2
# ==============================================================================

$protocols = @("SSL 2.0", "SSL 3.0", "TLS 1.0", "TLS 1.1")

foreach ($protocol in $protocols) {
    # Servidor
    $serverPath = "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\$protocol\Server"
    if (!(Test-Path $serverPath)) { 
        New-Item -Path $serverPath -Force | Out-Null 
    }
    Set-ItemProperty -Path $serverPath -Name "Enabled" -Value 0 -Type DWord
    Set-ItemProperty -Path $serverPath -Name "DisabledByDefault" -Value 1 -Type DWord

    # Cliente
    $clientPath = "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\$protocol\Client"
    if (!(Test-Path $clientPath)) { 
        New-Item -Path $clientPath -Force | Out-Null 
    }
    Set-ItemProperty -Path $clientPath -Name "Enabled" -Value 0 -Type DWord
    Set-ItemProperty -Path $clientPath -Name "DisabledByDefault" -Value 1 -Type DWord
}

# Deshabilitar Motor Legacy de PowerShell v2 (Evade escaneo AMSI)
if ((Get-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root).State -eq "Enabled") {
    Disable-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root -NoRestart
}
```
---

## Configurar Firewall y Defender AV

Configurar Microsoft Defender Antivirus y Firewall de forma centralizada asegura protección activa en tiempo real contra conexiones no autorizadas y malware.

### Tamper Protection (Protección contra alteraciones)
Evita que usuarios locales o procesos maliciosos deshabiliten la protección en tiempo real, las exclusiones de antivirus o las reglas ASR. Una vez activa, ni siquiera un administrador local puede deshabilitarla manualmente.

![Configuración de Tamper Protection en Defender](/images/Hardening_Endpoints/Hardening_Endpoints7.png)

![Estado de supervisión en tiempo real y en la nube](/images/Hardening_Endpoints/Hardening_Endpoints8.png)

---

## Configurar Actualizaciones de Seguridad (WUfB)

Windows Update for Business garantiza que los endpoints reciban parches de seguridad acumulativos sin depender del mantenimiento manual del usuario.

*   **Ruta en Intune:** `Devices` → `Configuration profiles` → `Windows Update for Business`.
*   **Perfil:** `WIN11-SEC-WUfB`.

![Parámetros de Windows Update para Empresas](/images/Hardening_Endpoints/Hardening_Endpoints9.png)

---

## Restringir Dispositivos Externos (USB)

Controlar el almacenamiento removible previene la fuga de datos confidenciales y bloquea la ejecución de vectores maliciosos físicos.

*   **Ruta en Intune:** `Devices` → `Configuration profiles` → `Templates` → `Device restrictions`.
*   **Regla:** `Removable Disk Deny Write Access` → **Habilitado**.

![Restricción de lectura y escritura en almacenamiento USB](/images/Hardening_Endpoints/Hardening_Endpoints10.png)

---

## Firewall de Windows

Aplica reglas estrictas en los perfiles de red Dominio, Privado y Público.

![Opciones de Firewall de red de dominio](/images/Hardening_Endpoints/Hardening_Endpoints11.png)

---

## Configuración de Wi-Fi Corporativo

Permite el aprovisionamiento automático de perfiles Wi-Fi seguros con estándares de cifrado WPA2/WPA3 Empresa.

![Perfil de configuración Wi-Fi Empresa](/images/Hardening_Endpoints/Hardening_Endpoints12.png)

---

## Políticas de Seguridad de Cuentas Locales

Aplica restricciones sobre credenciales locales, bloqueo de cuenta tras intentos fallidos y derechos de inicio de sesión.

![Resumen de directiva Endpoint Protection para cuentas](/images/Hardening_Endpoints/Hardening_Endpoints13.png)

---

## Forzar Sincronización y Diagnóstico

### Métodos para Forzar la Sincronización

1. **Desde la CLI de Windows (Administrador):**
   cmd
   Start-Process "C:\Windows\System32\DeviceEnroller.exe" /c
   dsregcmd /sync
   ```
2. **Desde el Visor de Eventos:**  
   Ruta: `Applications and Services Logs` → `Microsoft` → `Windows` → `DeviceManagement-Enterprise-Diagnostics-Provider` → `Admin`.
   *   **Event ID 2019:** Política recibida.
   *   **Event ID 2020:** Política aplicada correctamente.
   *   **Event ID 404:** Error al aplicar directiva.

![Monitoreo y diagnóstico de políticas MDM](/images/Hardening_Endpoints/Hardening_Endpoints15.png)

> **Nota de troubleshooting:** Si alguna política de Defender o Settings Catalog muestra estado *Error* en la consola de Intune, valida la existencia de conflictos con GPOs locales procedentes del Active Directory (resolución de conflictos MDM vs GPO mediante *PolicyManager CSP*).

---

## Conclusión

El endurecimiento de estaciones de trabajo mediante Microsoft Intune permite establecer un estándar de ciberseguridad homogéneo en toda la organización. Al combinar controles de cifrado, reducción de superficie de ataque y restricción de protocolos legados, se reduce drásticamente el riesgo de exposición ante incidentes de ciberseguridad.