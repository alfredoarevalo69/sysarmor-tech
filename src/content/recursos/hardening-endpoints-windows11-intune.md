---
title: "Hardening de Endpoints con Windows 11 mediante Microsoft Intune: BitLocker, ASR y Security Baselines"
description: "🛠️ [VERSIÓN EN BORRADOR] Aprende a desplegar la línea base de ciberseguridad para Windows 11 unida a Entra ID mediante Intune."
pubDate: 2026-08-20
category: "Ciberseguridad"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/Intune-Hardening/IntuneH.png"
pdfUrl: "/docs/Hardening Endpoints Windows 11 Intune.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Ciberseguridad, Operación e Innovación  

---

## Introducción — La postura Zero Trust en el Endpoint

En entornos de trabajo híbridos o de acceso remoto directo a la nube, el perímetro de red tradicional ha desaparecido. Los dispositivos corporativos se convierten en la primera línea de defensa frente a vectores de ataque comunes como ransomware, exfiltración de credenciales y ejecución de código malicioso local.

Para garantizar la integridad del dispositivo antes de otorgarle acceso a recursos de la organización, la arquitectura **Zero Trust** exige validar que el sistema operativo esté endurecido (*hardened*), con cifrado inmutable de almacenamiento y reglas de reducción de superficie de ataque estrictas.

Este manual técnico cubre la implementación de una línea base de ciberseguridad para estaciones de trabajo **Windows 11 (Pro/Enterprise)** unidas directamente a **Microsoft Entra ID** e integradas a **Microsoft Intune**, estructurada en tres pilares operativos:

* **Pilar 1: Cifrado Inmutable y Protección de Datos:** Configuración de BitLocker con cifrado XTS-AES 256, módulo TPM obligatorio y respaldo inmutable de claves en Entra ID.
* **Pilar 2: Reducción de la Superficie de Ataque (ASR):** Mitigación de vectores de ejecución no autorizados (macros, scripts en memoria y volcado de credenciales de LSASS).
* **Pilar 3: Despliegue de Windows 11 Security Baseline:** Aplicación de la plantilla nativa de hardening de Microsoft desde la consola MDM.

---

## Requisitos Previos y Enrolamiento del Dispositivo

* **Suscripción y Licenciamiento:** Tenant de Microsoft 365 con licencias activas de *Microsoft Intune Plan 1* o *Microsoft 365 Business Premium*.
* **Rol de Administración:** Privilegios de *Intune Administrator* o *Global Administrator*.
* **Sistema Operativo:** Windows 11 Pro, Enterprise o Education (Windows Home no cuenta con soporte para BitLocker empresarial ni gestión MDM completa).

### Registro del Dispositivo (Entra ID Join + Intune MDM)

Para este escenario de nube pura sin integración previa con Active Directory local (*On-premises*), el registro se realiza directamente desde la estación de trabajo:

1. Ir a **Configuración** > **Cuentas** > **Acceder a trabajo o colegio**.
2. Seleccionar **Conectar** y hacer clic en **"Unir este dispositivo a Microsoft Entra ID"**.
3. Autenticarse con la cuenta corporativa asignada al usuario en Intune.
4. Confirmar el enrolamiento en los portales administrativos:
   * **Entra ID (`entra.microsoft.com`):** *Devices > All devices* (Estado: *Microsoft Entra joined*).
   * **Intune (`intune.microsoft.com`):** *Devices > Windows* (Estado: *Managed by Intune*).

![Sincronización del dispositivo en el portal de Intune](/images/Intune-Hardening/Intune1.png)
## PARTE 1: Hardening de Identidad y Cifrado (BitLocker Baseline)

**Ubicación en portal:** `intune.microsoft.com` > **Endpoint security** > **Disk encryption** > **Create Policy**

Crear una directiva de cifrado para plataforma **Windows 10 and later** bajo el perfil **BitLocker**.

### Parámetros Críticos de Configuración
* **Require Device Encryption:** Enabled.
* **Encryption Method:** XTS-AES 256-bit (proporciona mayor resistencia criptográfica sobre el estándar AES-128).
* **Base Drive Encryption:**
  * **Require TPM:** Enabled (obliga al uso del chip criptográfico físico del equipo).
  * **Compatible TPM Startup PIN:** Allowed o Required según el nivel de seguridad del cliente.
* **Recovery Key Backup:** Save BitLocker recovery information to Microsoft Entra ID before enabling BitLocker. (Garantiza que la unidad no se cifre si falla el envío de la clave de recuperación a la nube).

![Directiva de Cifrado BitLocker en Intune](/images/Intune-Hardening/Intune2.png)

#### Verificación del Cifrado en el Cliente (PowerShell L3)

Ejecutar en la estación Windows 11 con privilegios elevados:

Get-BitLockerVolume | Select-Object MountPoint, VolumeStatus, EncryptionMethod, ProtectionStatus

#### Recuperación de Claves desde Entra ID
Los administradores del SOC pueden auditar o recuperar la clave de cifrado navegando a:
`entra.microsoft.com` > **Devices** > **All devices** > *[Seleccionar Dispositivo]* > **BitLocker Keys**.

![Claves de recuperación de BitLocker en Entra ID](/images/Intune-Hardening/Intune3.png)

---

## PARTE 2: Reducción de Superficie de Ataque (Attack Surface Reduction - ASR)

Las reglas ASR bloquean comportamientos frecuentemente explotados por malware antes de que logren ejecutarse.

**Ubicación en portal:** `intune.microsoft.com` > **Endpoint security** > **Attack surface reduction** > **Create Policy**

Crear perfil de tipo **Attack Surface Reduction rules** y configurar los siguientes identificadores clave en modo **Block**:

* **Bloqueo de volcado de memoria de LSASS:** *Block credential stealing from the Windows local security authority subsystem (lsass.exe)*.
* **Bloqueo de procesos secundarios en Microsoft Office:** *Block Office applications from creating child processes*.
* **Bloqueo de scripts ejecutable desatendidos:** *Block executable content from email client and webmail*.
* **Protección contra ejecuciones no firmadas:** *Block unexecutable files from running unless they meet an allowlist criteria*.

![Configuración de Reglas ASR en Intune](/images/Intune-Hardening/Intune4.png)

#### Auditoría de Eventos ASR en el Cliente (PowerShell)

Para rastrear en el cliente qué ejecuciones o scripts han sido bloqueados por las reglas ASR, consultar el registro de eventos de Defender:

Get-WinEvent -ProviderName "Microsoft-Windows-Windows Defender" | Where-Object {$_.Id -eq 1121} | Format-List -Property TimeCreated, Message
## PARTE 3: Aplicación del Windows 11 Security Baseline

Microsoft proporciona plantillas preconfiguradas con cientos de ajustes probados por sus equipos de ciberdefensa.

**Ubicación en portal:** `intune.microsoft.com` > **Endpoint security** > **Security baselines** > **Windows 11 Security Baseline**

1. Seleccionar **Create profile**, asignar un nombre descriptivo (ejemplo: `W11-Security-Baseline-Corporate`).
2. **Ajustes de Configuración Recomendados:**
   * **SmartScreen:** Require Admin approval before running unknown apps.
   * **Remote Desktop:** Block or Require NLA (Network Level Authentication).
   * **Account Options:** Disable guest account, enforce Local Account Passwords.
   * **DMA Guard:** Enable Kernel DMA Protection to mitigate Direct Memory Access attacks via Thunderbolt ports.
3. Asignar la directiva al grupo de dispositivos `GRP-Endpoints-Windows11-Prod`.

![Despliegue del Security Baseline de Windows 11](/images/Intune-Hardening/Intune5.png)

---

## PARTE 4: Pruebas de Laboratorio y Evidencia de Cumplimiento

### 1. Validación de Estado de Cumplimiento (Compliance)
En la consola de Intune, el dispositivo debe reportar el estado **Compliant** tras procesar las políticas de cifrado y el baseline.

![Dispositivo en estado Compliant en Intune](/images/Intune-Hardening/Intune6.png)

### 2. Prueba de Concepto de Ataque LSASS
Al intentar utilizar herramientas de volcado de memoria (como `mimikatz` o un script en PowerShell orientado a leer la memoria del proceso `lsass.exe`), la regla ASR correspondiente interviene inmediatamente:

* **Resultado en cliente:** Acceso denegado al proceso.
* **Notificación visual:** Alerta del sistema indicando que el Administrador de TI ha bloqueado la acción por políticas de seguridad.

---

## Alcance del Servicio SysArmorTech

En **SysArmorTech** transformamos la gestión de dispositivos en una postura de seguridad robusta alineada a estándares internacionales (NIST / CIS Benchmarks), maximizando las capacidades nativas del ecosistema Microsoft 365.

### Servicios de Implementación MDM / Zero Trust
* **Enrolamiento e Identidad:** Configuración de arquitecturas Entra ID Join e Híbridas.
* **Hardening de Endpoints:** Despliegue de BitLocker, perfiles ASR y Security Baselines personalizados sin impacto operativo.
* **Gestión de LAPS y Credenciales:** Control de cuentas de administrador local centralizado desde la nube.
* **Políticas de Acceso Condicional:** Bloqueo de dispositivos no conformes para asegurar el acceso a Microsoft 365.

👉 **Solicita tu consultoría de hardening con nuestro equipo técnico:** [https://sysarmortech.com](https://sysarmortech.com)