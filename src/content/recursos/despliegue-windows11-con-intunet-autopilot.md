---
title: "Despliegue y Provisionamiento Zero-Touch de Windows 11 con Windows Autopilot y Microsoft Intune"
description: "Guía técnica para la extracción de HardwareID, importación de hashes en Intune, configuración de perfiles User-Driven, grupos dinámicos en Entra ID y validación de la experiencia OOBE con reglas de menor privilegio."
pubDate: 2026-08-25
category: "Infraestructura TI"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/AutoPilot/AutoPilot.jpeg"
pdfUrl: "/docs/despliegue-windows11-con-intunet-autopilot.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Operación, Ciberseguridad e Innovación  

---

## Introducción

En el paradigma moderno de trabajo híbrido y ciberseguridad Enterprise, el aprovisionamiento tradicional de sistemas operativos mediante imágenes pesadas (WIM, PXE, MDT o SCCM) ha quedado obsoleto. **Windows Autopilot** redefine el ciclo de vida de los dispositivos al permitir un modelo de despliegue *Zero-Touch*, donde los equipos se envían directamente desde el fabricante al usuario final y se configuran de forma automatizada desde la nube.

Este laboratorio documenta el procedimiento técnico para capturar la identidad de hardware de un dispositivo cliente, registrarlo en la infraestructura de Microsoft Intune, aplicar perfiles de despliegue basados en identidades de Microsoft Entra ID y validar la experiencia *Out-of-Box Experience* (OOBE) con entrega automatizada de aplicaciones Win32 e inclusión de políticas de menor privilegio.

---

## Objetivo del Laboratorio

Documentar y ejecutar el procedimiento técnico paso a paso para la extracción de identidades de hardware (`HardwareID`), importación de hashes en Microsoft Intune, creación de grupos dinámicos de dispositivos, configuración de perfiles de despliegue *User-Driven* en Entra ID Joined y validación de la pantalla de estado de inscripción (*Enrollment Status Page - ESP*) en un entorno controlado con Windows 11.

---

## Prerrequisitos y Preparación del Entorno

### Requisitos de Licenciamiento e Infraestructura
* **Suscripción de Identidad y Gestión:** Licencias activas de Microsoft Entra ID P1/P2 y Microsoft Intune Plan 1.
* **Dispositivo Cliente Objetivo:** Máquina virtual (Hyper-V / VMware) o equipo físico con Windows 11 Pro/Enterprise en estado de fábrica (fase OOBE).
* **Conectividad a Red:** Acceso directo a Internet sin inspección SSL/TLS profunda que interfiera con los endpoints de la nube de Microsoft (`*.manage.microsoft.com`, `*.graph.microsoft.com`).

> **Nota Técnica sobre OOBE (*Out-Of-Box Experience*):** Es el momento en que el dispositivo arranca por primera vez o después de un restablecimiento y muestra la experiencia inicial de configuración al usuario:
> 1. El equipo se conecta a Internet y contacta los servicios de Microsoft Intune y Entra ID.
> 2. Se identifica mediante su `Hardware Hash` y descarga el perfil de Autopilot asignado.
> 3. Se aplican las configuraciones definidas (Azure AD Join/Hybrid Join, modo User-Driven/Self-Deploying, etc.).
> 4. El usuario inicia sesión con sus credenciales corporativas y el dispositivo se inscribe automáticamente.

---

## Arquitectura del Flujo de Autopilot

| Fase | Componente | Acción Técnica |
| :--- | :--- | :--- |
| **1. Extracción** | Cliente OOBE | Invocación de PowerShell vía `Shift + F10` para ejecutar `Get-WindowsAutoPilotInfo`. |
| **2. Registro** | Intune Admin Center | Carga del archivo CSV que contiene el Hardware Hash, Serial Number y PKID. |
| **3. Asignación** | Entra ID / Intune | Vinculación del dispositivo a un grupo objetivo y aplicación del *Autopilot Deployment Profile*. |
| **4. Provisionamiento** | OOBE / ESP | Autenticación del usuario, unión a Entra ID, despliegue de perfiles MDM y entrega de apps Win32. |

---

## Pasos de Ejecución del Laboratorio

### Paso 1: Extracción del Hash de Hardware (HardwareID) en el Cliente

1. Inicie la máquina virtual con Windows 11 en la pantalla inicial de selección de región/idioma del OOBE.
2. Presione la combinación de teclas **`Shift + F10`** para abrir la consola de comandos de Windows (`cmd.exe`).
3. Inicie PowerShell y ejecute el script oficial de Microsoft para exportar las métricas de hardware:

```powershell
# Cambiar la directiva de ejecución temporal
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Unrestricted -Force

# Instalar y ejecutar la herramienta de Autopilot de PowerShell Gallery
Install-Script -Name Get-WindowsAutoPilotInfo -Force
Get-WindowsAutoPilotInfo.ps1 -OutputFile "C:\AutopilotHash.csv"
```

![Extracción de Hash con Script en PowerShell](/images/AutoPilot/autopilot1.png)

> **Nota Técnica:** El archivo `AutopilotHash.csv` generado contiene la tupla *Device Serial Number*, *Windows Product Key* y *Hardware Hash* (clave criptográfica única de la TPM y la placa base).
> 
> Para extraer el archivo `.csv` desde la VM hacia el equipo de administración vía SMB:
> ```powershell
> net use \\NOMBRE_HOST\compartida /user:DOMINIO_O_HOST\Usuario 
> Copy-Item C:\AutopilotHash.csv -Destination "\\NOMBRE_HOST\compartida"
> ```

---

### Paso 2: Importación de la Identidad del Dispositivo en Intune

1. Inicie sesión en **Microsoft Intune Admin Center** (`intune.microsoft.com`).
2. Navegue a **Dispositivos** > **Inscripción** > **Windows Autopilot** > **Dispositivos**.
3. Haga clic en **Importar** y seleccione el archivo `AutopilotHash.csv`.
4. Monitoree la notificación de importación. El proceso toma entre 2 y 5 minutos hasta que el dispositivo aparezca listado.

![Importación exitosa de dispositivo Autopilot](/images/AutoPilot/autopilot2.png)

---

### Paso 3: Configuración del Perfil de Despliegue (Deployment Profile)

1. En Intune Admin Center, navegue a **Dispositivos** > **Inscripción** > **Perfiles de implementación**.
2. Haga clic en **Crear perfil** > **PC Windows**.
3. Configure los parámetros de la experiencia OOBE:

| Parámetro / Campo | Valor Requerido | Justificación de Ciberseguridad / Operación |
| :--- | :--- | :--- |
| **Deployment mode** | `User-Driven` | Requiere que el usuario final ingrese sus credenciales corporativas. |
| **Join to Entra ID as** | `Microsoft Entra joined` | Uniones puras en la nube para simplificar la gestión sin línea de vista a Domain Controllers. |
| **Privacy settings** | `Hide` | Oculta las pantallas de telemetría y ubicación al usuario final. |
| **User account type** | `Standard` | **Least Privilege:** Previene que el usuario sea Administrador local. |
| **Allow OOBE User Status** | `Hide` | Simplifica la interfaz de usuario durante la primera configuración. |
| **Language (Region)** | `Operating System Default` | Hereda la configuración del instalador base. |

![Configuración del perfil de despliegue Autopilot](/images/AutoPilot/autopilot3.png)

> **Regla de Grupo de Seguridad (Buenas Prácticas):**  
> Para producción, cree un grupo en Entra ID (**Groups** > **New group**):
> * **Group type:** `Security`
> * **Group name:** `Sec-Devices-AutopilotLab`
> * **Membership type:** Dynamic Device mediante la regla: `(device.devicePhysicalIDs -any (_ -contains "[ZTDId]"))`

---

### Paso 4: Sincronización y Confirmación de Asignación

1. Vuelva a **Dispositivos** > **Inscripción** > **Windows Autopilot** > **Dispositivos**.
2. Haga clic en **Sincronizar (Sync)**.
3. Verifique que la columna **Estado del perfil** cambie de *Sin asignar* a **Asignado**.

![Confirmación de perfil asignado](/images/AutoPilot/autopilot4.png)

---

### Paso 5: Configuración de la Página de Estado de Inscripción (ESP)

La *Enrollment Status Page (ESP)* bloquea el acceso al escritorio hasta que todas las políticas críticas y aplicaciones requeridas finalicen su instalación:

1. Navegue a **Dispositivos** > **Inscripción** > **Página de estado de inscripción**.
2. Edite la configuración predeterminada:
   * **Mostrar el progreso de la configuración de aplicaciones y perfiles:** `Sí`
   * **Bloquear el uso del dispositivo hasta que todas las aplicaciones y perfiles estén instalados:** `Sí`
   * **Permitir a los usuarios restablecer el dispositivo si se produce un error:** `Sí`

---

## Verificación y Validación del Despliegue (Experiencia OOBE)

### Ejecución del Proceso en la Máquina Virtual

En la consola de PowerShell de la VM, fuerce el reinicio para limpiar la memoria caché del OOBE:

```powershell
shutdown /r /t 0
```

* **Resultado Esperado:** La pantalla de bienvenida de Windows omitirá la creación de cuentas personales y presentará la interfaz corporativa de inicio de sesión (*Branding de SYSARMOR TECH / Microsoft Entra ID*).

### Auditoría y Trazabilidad en el Cliente

Para certificar que la máquina fue aprovisionada mediante Autopilot bajo MDM de Intune, ejecute en PowerShell dentro del equipo aprovisionado:

```powershell
# 1. Validar estado de unión a Entra ID y rol del usuario (Standard)
dsregcmd /status

# 2. Consultar las directivas y perfiles de Autopilot en el Registro
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Provisioning\Diagnostics\Autopilot" | 
    Select-Object TenantId, IsAnyPolicyApplied, DeploymentProfileName

# 3. Validar estado de instalación de aplicaciones Win32
Get-ChildItem -Path "HKLM:\SOFTWARE\Microsoft\IntuneManagementExtension\Win32Apps\00000000-0000-0000-0000-000000000000" | 
    Get-ItemProperty | 
    Select-Object AppName, InstallCommand, ExecutionState
```

![Validación con dsregcmd /status](/images/AutoPilot/autopilot5.png)

> **Criterio de Éxito:** `dsregcmd /status` confirmará `AzureAdJoined : YES` y la cuenta de usuario operará en modo **Standard User**.

---

## Pruebas de Gestión y Ciclo de Vida en Producción

* **Despliegue Automatizado de Apps Win32:** Entrega silenciosa de software mediante el agente *Intune Management Extension* durante la fase de ESP.
* **Restablecimiento Remoto (Autopilot Reset):** Limpieza de datos locales y aplicaciones manteniendo la unión a Entra ID, dejando el equipo listo para un nuevo usuario en minutos.
* **Limpieza Remota (Wipe / Retire):** *Wipe* para borrado de fábrica ante baja de hardware, o *Retire* para eliminar únicamente datos corporativos en esquemas BYOD.
* **Hardening Base:** Cifrado obligatorio con BitLocker (claves en Entra ID), Least Privilege y perfiles de Microsoft Defender for Endpoint / ASR.

---

## Conclusión Técnica

El modelo *Zero-Touch* impulsado por **Windows Autopilot** y **Microsoft Intune** elimina la complejidad de mantener imágenes `.wim`, garantiza la aplicación de *Least Privilege* desde la primera ejecución y reduce los tiempos de provisión de horas a minutos, alineando la gestión de endpoints con estándares Cloud-Native de arquitectura limpia.