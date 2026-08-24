---
title: "Empaquetado y Despliegue de Aplicaciones Win32 con Microsoft Intune"
description: "Guía paso a paso para el empaquetado, configuración, despliegue silencioso y validación técnica de aplicaciones Win32 mediante Intune, asegurando ejecución con privilegios SYSTEM y reglas de detección precisas."
pubDate: 2026-08-24
category: "Infraestructura TI"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune.png"
pdfUrl: "/docs/empaquetado-despliegue-apps-win32-intune.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Operación, Seguridad e Innovación  

---

## Introducción

En un entorno corporativo moderno, la gestión eficiente de aplicaciones es clave para mantener la seguridad y la productividad. Microsoft Intune permite empaquetar aplicaciones Win32 de forma automatizada, garantizando despliegues silenciosos, controlados y escalables en toda la organización. Este enfoque no solo simplifica la administración de software, sino que también fortalece la postura de ciberseguridad al asegurar que cada instalación cumpla con políticas de integridad y ejecución bajo privilegios del sistema. 

Empaquetar correctamente las apps Win32 con Intune convierte la distribución en un proceso confiable, repetible y alineado con los principios de infraestructura como código.

---

## Objetivo del Laboratorio

Documentar y ejecutar el procedimiento técnico paso a paso para el empaquetado, configuración, despliegue y validación de una aplicación Win32 ejecutable (`.exe`) en un entorno administrado por Microsoft Intune, garantizando la ejecución silenciosa con privilegios del sistema y la configuración precisa de reglas de detección para cumplir con estándares de arquitectura limpia e infraestructura como código.

---

## Prerrequisitos y Preparación del Entorno

### Herramientas Requeridas
* **Microsoft Win32 Content Prep Tool (`IntuneWinAppUtil.exe`):** Utilidad oficial de Microsoft para convertir archivos de instalación en formato encriptado `.intunewin`.
* **Instalador Fuente:** Archivo ejecutable de prueba (Ejemplo: `7z2602-x64.exe` de 7-Zip).
* **Licenciamiento e Infraestructura:** Suscripción activa a Microsoft Intune y un dispositivo cliente de pruebas con Windows 10/11 enrolado en Entra ID / Intune.

---

## Flujo de Arquitectura y Despliegue

Este gráfico resume el flujo técnico completo desde el empaquetado local hasta la entrega y validación en el cliente:

![Diagrama técnico del flujo de empaquetado y despliegue](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune1.png)

---

## Estructura de Directorios Local

En el equipo administrativo de empaquetado, cree la siguiente estructura de carpetas mediante PowerShell:

```powershell
New-Item -Path "C:\IntuneApps\Source\7Zip" -ItemType Directory -Force
New-Item -Path "C:\IntuneApps\Output" -ItemType Directory -Force
New-Item -Path "C:\IntuneApps\Tool" -ItemType Directory -Force
```

Ubique el instalador `7z2602-x64.exe` dentro de `C:\IntuneApps\Source\7Zip\` y el archivo `IntuneWinAppUtil.exe` dentro de `C:\IntuneApps\Tool\`.

---

## Pasos de Ejecución

### Paso 1: Generación del Paquete Encriptado (.intunewin)

Abra una sesión de PowerShell como Administrador e invoque la herramienta de empaquetado ejecutando el siguiente comando:

```powershell
Set-Location -Path "C:\IntuneApps\Tool"
.\IntuneWinAppUtil.exe -c "C:\IntuneApps\Source\7Zip" -s "7z2602-x64.exe" -o "C:\IntuneApps\Output" -q
```

> **Nota Técnica:** La herramienta oficial se puede descargar desde el repositorio de GitHub: [Microsoft Win32 Content Prep Tool](https://github.com/microsoft/microsoft-win32-content-prep-tool).

---

### Paso 2: Alta de la Aplicación Win32 en Microsoft Intune

1. Inicie sesión en el **Microsoft Intune Admin Center** (`https://intune.microsoft.com`).
2. Navegue a **Apps** > **Windows** > **Add**.
3. En **App type**, seleccione **Windows app (Win32)** y haga clic en **Select**.
4. En **App information**, cargue el archivo generado `7z2602-x64.intunewin`.
5. Complete los metadatos principales:
   * **Name:** `7z2602-x64.exe`
   * **Description:** `7z2602-x64.exe Herramienta de compresión y descompresión de archivos para despliegue masivo.`
   * **Publisher:** `Igor Pavlov`

![Información de la aplicación en Intune](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune2.png)

---

### Paso 3: Configuración de Parámetros de Instalación y Requisitos

Defina los comandos de ejecución silenciosa y los requisitos del sistema operativo según los estándares del entorno:

| Categoría | Parámetro / Campo | Valor Requerido | Descripción / Propósito |
| :--- | :--- | :--- | :--- |
| **Program** | Install command | `7z2602-x64.exe /S` | Ejecución en modo silencioso sin intervención del usuario. |
| | Uninstall command | `"C:\Program Files\7-Zip\Uninstall.exe" /S` | Comando de remoción silenciosa. |
| | Install behavior | `System` | Ejecución con privilegios elevados vía cuenta `NT AUTHORITY\SYSTEM`. |
| | Device restart behavior | `No action` | Suprime el reinicio del sistema operativo tras finalizar. |
| **Requirements** | OS Architecture | `64-bit` | Arquitectura de procesador objetivo. |
| | Minimum Operating System | `Windows 10 1607` | Versión mínima requerida del SO. |

![Configuración del Programa en Intune](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune3.png)

---

### Paso 4: Configuración de Reglas de Detección (Detection Rules)

Las reglas de detección aseguran que Intune verifique la presencia del software antes y después de la instalación para evitar ejecuciones innecesarias.

1. En **Rules format**, seleccione **Manually configure detection rules**.
2. Haga clic en **Add** y configure una regla basada en archivo (*File*):
   * **Rule type:** `File`
   * **Path:** `C:\Program Files\7-Zip`
   * **File or folder:** `7z.exe`
   * **Detection method:** `File or folder exists`
   * **Associated with a 32-bit app on 64-bit clients:** `No`

![Regla de detección por archivo](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune4.png)

---

### Paso 5: Asignación y Publicación (Assignments)

1. En la pestaña **Assignments**, seleccione el alcance:
   * **Required:** Agregue el grupo de dispositivos de prueba (Ejemplo: `Sec-Devices-IntuneLab`) para forzar la instalación automática en segundo plano.
   * **Available for enrolled devices:** (Opcional) Permite la instalación a demanda desde el Portal de Empresa (*Company Portal*).
2. Revise la configuración general en la pestaña **Review + create** y haga clic en **Create** para iniciar la carga del paquete a la nube de Microsoft.

---

## Verificación y Diagnóstico en el Cliente

### Forzado de Sincronización del Agente Intune Management Extension (IME)

Para omitir la ventana predeterminada de evaluación (8 horas), ejecute el siguiente comando en PowerShell dentro del equipo cliente para forzar la sincronización inmediata:

```powershell
Get-ScheduledTask -TaskName "*PushLaunch*" | Start-ScheduledTask
```

### Análisis de Trazas e Inspección de Logs

Monitoree la descarga, desencriptación y código de salida del instalador analizando los registros del agente:

* **Ruta del Log:** `C:\ProgramData\Microsoft\IntuneManagementExtension\Logs\IntuneManagementExtension.log`

Filtrado en tiempo real mediante PowerShell:

```powershell
Get-Content -Path "C:\ProgramData\Microsoft\IntuneManagementExtension\Logs\IntuneManagementExtension.log" -Wait -Tail 50 | Select-String -Pattern "7z2602-x64", "ExitCode", "Detection"
```

> **Criterio de Éxito:** El log debe certificar la descarga exitosa del paquete encriptado desde el CDN de Azure, la ejecución de `7z2602-x64.exe /S` retornando `ExitCode: 0`, y la regla de detección evaluando en `Application detected: True`.

---

## Confirmación de Estado en Intune Admin Center

Una vez evaluada la regla de detección, el portal reflejará el estado de cumplimiento por dispositivo y usuario:

![Estado de instalación del dispositivo en Intune](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune5.png)

---

## Evidencia Forense de Instalación (Registro Local)

Para certificar que la aplicación fue desplegada centralizadamente por Intune y no de manera manual, consulte el registro local del cliente:

```powershell
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\IntuneManagementExtension\Win32Apps\00000000-0000-0000-0000-000000000000\7970fa9c-d817-4326-b81b-e4ab154ee761_1" | 
    Select-Object AppName, InstallCommand, ExecutionState, ComplianceState, DownloadUrl
```

![Inspección del Registro HKLM para Win32Apps](/images/Despliegue-Apps-Win32-con-Intune/Despliegue-Apps-Intune6.png)

La presencia del GUID bajo la rama `HKLM\SOFTWARE\Microsoft\IntuneManagementExtension\Win32Apps\` valida técnicamente la auditoría de instalación bajo gestión MDM.

---

## Conclusión

Este laboratorio demuestra cómo empaquetar y desplegar aplicaciones Win32 con Microsoft Intune de forma segura, automatizada y escalable. La correcta definición de parámetros de ejecución y reglas de detección garantiza una distribución limpia alineada con las mejores prácticas de Microsoft.