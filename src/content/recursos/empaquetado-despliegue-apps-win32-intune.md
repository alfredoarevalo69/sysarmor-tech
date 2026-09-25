---
title: "Empaquetado y Despliegue de Aplicaciones Win32 con Microsoft Intune"
description: "Guía técnica paso a paso para empaquetar, desplegar y validar aplicaciones Win32 (.exe) en Microsoft Intune con ejecución SYSTEM y reglas de detección."
pubDate: 2026-08-24
category: "Infraestructura TI"
author: "Alfredo Arévalo"
isFeatured: true
image: "/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune.jpeg"
pdfUrl: "/docs/empaquetado-despliegue-apps-win32-intune.pdf"
tags: ["Microsoft Intune", "Win32 Apps", "MDM", "PowerShell", "SysArmor Tech"]
---

> **Enfoque técnico:** Infraestructura, Operación, Seguridad e Innovación bajo estándares de arquitectura limpia.

---

## Introducción

En un entorno corporativo moderno, la gestión eficiente de aplicaciones es un pilar crítico para mantener la seguridad y la productividad de los endpoints. **Microsoft Intune** permite empaquetar aplicaciones Win32 de forma automatizada, garantizando despliegues silenciosos, controlados y escalables. Este enfoque fortalece la postura de ciberseguridad al asegurar que cada instalación cumpla con políticas rigurosas de integridad y ejecución bajo los privilegios elevados del sistema operativo. 

Empaquetar correctamente las apps Win32 convierte la distribución de software en un proceso confiable, repetible y completamente alineado con los principios de infraestructura como código.

---

## Objetivo del Laboratorio

Documentar y ejecutar el procedimiento técnico paso a paso para el empaquetado, configuración, despliegue y validación de una aplicación Win32 ejecutable (`.exe`) en un entorno administrado por **Microsoft Intune**, garantizando:
* Ejecución silenciosa bajo privilegios de la cuenta del sistema (`NT AUTHORITY\SYSTEM`).
* Configuración precisa de reglas de detección basadas en archivos.
* Cumplimiento con estándares de arquitectura limpia y automatización de despliegues.

---

## Prerrequisitos y Preparación del Entorno

### Herramientas Requeridas
* **Microsoft Win32 Content Prep Tool (`IntuneWinAppUtil.exe`):** Utilidad oficial para convertir archivos de instalación binarios en paquetes encriptados `.intunewin`.
* **Instalador Fuente:** Archivo ejecutable de prueba (Ejemplo: `7z2602-x64.exe` de 7-Zip).
* **Licenciamiento e Infraestructura:** Suscripción activa a Microsoft Intune y un dispositivo cliente de pruebas con Windows 10/11 enrolado en Microsoft Entra ID / MDM.

---

## Flujo de Arquitectura y Despliegue

El diagrama siguiente ilustra el ciclo de vida completo del empaquetado local, la conversión de contenido y la entrega automatizada en el cliente a través de la nube:

![Diagrama técnico del flujo de empaquetado y despliegue](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune1.png)

---

## Estructura de Directorios Local

Para mantener un entorno de trabajo limpio y ordenado, configure la estructura de directorios en su estación de trabajo administrativa ejecutando las siguientes sentencias en PowerShell:

```powershell
New-Item -Path "C:\IntuneApps\Source\7Zip" -ItemType Directory -Force
New-Item -Path "C:\IntuneApps\Output" -ItemType Directory -Force
New-Item -Path "C:\IntuneApps\Tool" -ItemType Directory -Force
```

Coloque el instalador `7z2602-x64.exe` en `C:\IntuneApps\Source\7Zip\` y el binario de empaquetado `IntuneWinAppUtil.exe` dentro de `C:\IntuneApps\Tool\`.

---

## Procedimiento de Implementación

### Paso 1: Generación del Paquete Encriptado (.intunewin)

Abra una consola de PowerShell con privilegios elevados y ejecute la herramienta de empaquetado apuntando a los directorios fuente y de salida:

```powershell
Set-Location -Path "C:\IntuneApps\Tool"
.\IntuneWinAppUtil.exe -c "C:\IntuneApps\Source\7Zip" -s "7z2602-x64.exe" -o "C:\IntuneApps\Output" -q
```

> **Referencia Oficial:** La utilidad de empaquetado se encuentra disponible en el repositorio oficial de [Microsoft Win32 Content Prep Tool en GitHub](https://github.com/microsoft/microsoft-win32-content-prep-tool).

---

### Paso 2: Registro de la Aplicación Win32 en Microsoft Intune

1. Acceda al [Microsoft Intune Admin Center](https://intune.microsoft.com).
2. Diríjase a **Apps** > **Windows** > **Add**.
3. En el tipo de aplicación (**App type**), seleccione **Windows app (Win32)** y presione **Select**.
4. En la sección **App information**, cargue el archivo comprimido resultante `7z2602-x64.intunewin`.
5. Complete los campos obligatorios de metadatos:
   * **Name:** `7z2602-x64.exe`
   * **Description:** `Herramienta de compresión y descompresión de archivos para despliegue masivo corporativo.`
   * **Publisher:** `Igor Pavlov`

![Información de la aplicación en Intune](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune2.png)

---

### Paso 3: Configuración de Parámetros de Instalación y Requisitos del Sistema

Defina con precisión los argumentos de ejecución desatendida y los requerimientos arquitectónicos del sistema operativo:

| Categoría | Parámetro / Campo | Valor Requerido | Descripción Técnica |
| :--- | :--- | :--- | :--- |
| **Program** | Install command | `7z2602-x64.exe /S` | Ejecución en modo silencioso sin interacción de interfaz de usuario. |
| | Uninstall command | `"C:\Program Files\7-Zip\Uninstall.exe" /S` | Argumento para la desinstalación silenciosa. |
| | Install behavior | `System` | Ejecución con privilegios elevados bajo la cuenta del sistema local. |
| | Device restart behavior | `No action` | Suprime reinicios automáticos tras la finalización del instalador. |
| **Requirements** | OS Architecture | `64-bit` | Restringe el despliegue a arquitecturas de 64 bits compatibles. |
| | Minimum Operating System | `Windows 10 1607` | Versión base requerida del sistema operativo Windows. |

![Configuración del Programa en Intune](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune3.png)

---

### Paso 4: Configuración de Reglas de Detección (Detection Rules)

Las reglas de detección permiten que el agente de Intune valide la presencia del software antes de intentar instalaciones redundantes.

1. En el apartado **Rules format**, seleccione **Manually configure detection rules**.
2. Haga clic en **Add** y establezca una regla basada en archivos (*File*):
   * **Rule type:** `File`
   * **Path:** `C:\Program Files\7-Zip`
   * **File or folder:** `7z.exe`
   * **Detection method:** `File or folder exists`
   * **Associated with a 32-bit app on 64-bit clients:** `No`

![Regla de detección por archivo](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune4.png)

---

### Paso 5: Asignación de Políticas (Assignments)

1. En la sección **Assignments**, configure el alcance del despliegue:
   * **Required:** Vincule el grupo de dispositivos piloto (Ejemplo: `Sec-Devices-IntuneLab`) para automatizar la instalación en segundo plano.
   * **Available for enrolled devices:** (Opcional) Habilite la auto-instalación a demanda desde el **Company Portal**.
2. Valide los parámetros en la pestaña **Review + create** y confirme haciendo clic en **Create** para subir el paquete al almacenamiento en la nube.

---

## Verificación y Diagnóstico en el Cliente

### Forzado de Sincronización del Agente Intune Management Extension (IME)

Para evitar los tiempos de sondeo predeterminados del Agente de Intune, ejecute el siguiente comando en una sesión local de PowerShell en el equipo cliente:

```powershell
Get-ScheduledTask -TaskName "*PushLaunch*" | Start-ScheduledTask
```

### Análisis de Trazas e Inspección de Registros

Monitoree la descarga del paquete, el proceso de desencriptación y el código de retorno del instalador revisando el archivo de log principal:

* **Ruta del Log:** `C:\ProgramData\Microsoft\IntuneManagementExtension\Logs\IntuneManagementExtension.log`

Ejecute el siguiente filtro en tiempo real mediante PowerShell para validar el éxito de la operación:

```powershell
Get-Content -Path "C:\ProgramData\Microsoft\IntuneManagementExtension\Logs\IntuneManagementExtension.log" -Wait -Tail 50 | Select-String -Pattern "7z2602-x64", "ExitCode", "Detection"
```

> **Criterio de Éxito:** El archivo de registro debe certificar la descarga limpia desde el CDN, la ejecución de `7z2602-x64.exe /S` retornando `ExitCode: 0`, y la evaluación positiva de la regla de detección (`Application detected: True`).

---

## Confirmación de Estado en Intune Admin Center

Una vez procesada la telemetría, el centro de administración reflejará el estado de cumplimiento consolidado por dispositivo:

![Estado de instalación del dispositivo en Intune](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune5.png)

---

## Evidencia Forense de Instalación (Registro Local de Windows)

Para auditar de forma local que el software fue desplegado mediante gestión centralizada MDM, inspeccione las claves del registro del sistema cliente:

```powershell
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\IntuneManagementExtension\Win32Apps\00000000-0000-0000-0000-000000000000\7970fa9c-d817-4326-b81b-e4ab154ee761_1" | 
    Select-Object AppName, InstallCommand, ExecutionState, ComplianceState, DownloadUrl
```

![Inspección del Registro HKLM para Win32Apps](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune6.png)

La existencia del GUID bajo la ruta `HKLM:\SOFTWARE\Microsoft\IntuneManagementExtension\Win32Apps\` confirma de forma concluyente la trazabilidad técnica de la instalación gestionada.

---

## Lecturas Relacionadas y Complementarias

Para asegurar un enfoque integral en la seguridad de tu infraestructura, te recomendamos complementar este despliegue con nuestro artículo sobre el [Hardening Mínimo de Endpoints Windows 11 con Microsoft Intune](/blog/hardening-endpoints-windows11-intune), donde se abordan políticas base de cifrado, control de puertos y directivas de cumplimiento.

---

## Conclusión

Este laboratorio demuestra cómo estructurar, empaquetar y desplegar aplicaciones Win32 mediante Microsoft Intune siguiendo estrictas pautas de automatización y seguridad. La correcta implementación de comandos silenciosos y reglas de detección robustas garantiza un ciclo de vida de software predecible, seguro y escalable en entornos corporativos complejos.