---
title: "Hardening de Correo Corporativo en Microsoft 365: Guía Técnica con EOP y Defender"
description: "Aprende a configurar el endurecimiento técnico de correo en Microsoft 365 mediante EOP y comprende el alcance avanzado de Microsoft Defender P1/P2."
pubDate: 2026-08-19
category: "Ciberseguridad"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/MS-Defender/MS-Defender.png"
pdfUrl: "/docs/hardening-correo-corporativo-m365.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Ciberseguridad, Operación e Innovación  

---

## Introducción

El correo electrónico continúa siendo el principal vector de ataque en entornos corporativos, utilizado para distribuir ransomware, ejecutar fraudes de tipo Business Email Compromise (BEC) y realizar robo de credenciales mediante técnicas de suplantación sofisticadas. Aunque Exchange Online Protection (EOP) ofrece un nivel básico de filtrado, su cobertura resulta limitada frente a amenazas evasivas y ataques de identidad avanzados.

Este manual presenta la línea base de endurecimiento técnico (**Hardening Baseline**) recomendada para fortalecer la seguridad del correo corporativo en Microsoft 365, estructurada en dos niveles operativos:

* **Configuración Nivel 2 – EOP:** Protección estándar incluida en los licenciamientos básicos, basada en controles nativos de firma, reputación y alineación de identidad mediante DMARC.
* **Capítulo Nivel 3 – Defender Plan 1/P2:** Extensión avanzada con inteligencia artificial, análisis en sandbox y verificación time-of-click para mitigar amenazas de día cero.

---

## Requisitos Previos y Alineación de Identidad

* **Permisos requeridos:** Rol de *Security Administrator* en el portal de seguridad (`security.microsoft.com`) u *Organization Management* en Exchange Online.
* **Prerrequisito Técnico Obligatorio:** Registros SPF, DKIM y DMARC (con política mínima `p=quarantine` o `p=reject`) correctamente publicados en el DNS público del dominio corporativo.

> **Nota técnica:** Microsoft Defender es una solución XDR (Detección y Respuesta Extendida). Para la elaboración de este manual nos enfocaremos exclusivamente en la solución de **Microsoft Defender para Office 365** (colaboración y correo electrónico), identificando cómo configurar directivas como: Directivas de seguridad predeterminadas, Anti-phishing, Anti-spam, Anti-malware, Cuarentena y Listas de bloqueados.

Las directivas se administran desde el Portal de Microsoft Defender en la sección:
`security.microsoft.com` > **Email & collaboration** > **Policies & rules** > **Threat policies**

![Directivas Principales de Microsoft Defender](/images/MS-Defender/Defender1.png)

### Tipos de Directivas Principales
* **Antispam:** Bloquea o pone en cuarentena mensajes de correo no deseado tanto entrantes como salientes.
* **Antimalware:** Detecta y bloquea archivos o códigos maliciosos en los mensajes adjuntos.
* **Antisuplantación (Anti-phishing):** Protege contra ataques de suplantación de identidad (*spoofing*) y fraudes de tipo CEO.
## PARTE 1: Hardening con Licenciamiento Estándar (EOP)

### Fase 1: Política Anti-Phishing por Defecto (`Office365 AntiPhish Default`)

**Ubicación en portal:** `security.microsoft.com` > **Email & collaboration** > **Policies & rules** > **Threat policies** > **Anti-phishing**

Abre la política predeterminada, haz clic en **Editar acciones** (*Edit actions*) y aplica los siguientes ajustes:

* **Acción para Spoofing (Inteligencia de suplantación):**
  * *Valor por defecto:* Mover a la carpeta Correo no deseado.
  * *Ajuste SysArmor:* **Poner en cuarentena el mensaje** (`DefaultFullAccessPolicy`). Evita que el usuario interactúe con el correo.
* **Primer consejo de seguridad de contacto (*First contact safety tip*):** Activado. Muestra una advertencia visual si es la primera vez que se recibe un mensaje desde esa dirección.
* **Símbolo de remitente no autenticado (?):** Activado.
* **Mostrar etiqueta "vía":** Activado.
* **Respetar directiva DMARC (`p=quarantine` / `p=reject`):** Activado.

![Editar Acciones Anti-Phishing](/images/MS-Defender/Defender2.png)

#### Configuración vía PowerShell (Exchange Online Module)

Connect-ExchangeOnline

Set-AntiPhishPolicy -Identity "Office365 AntiPhish Default" -SpoofProtectionAction Quarantine -EnableFirstContactSafetyTips $true -EnableUnauthenticatedSender $true -EnableViaTag $true

---

### Fase 2: Políticas Anti-Spam y Purga ZAP

**Ubicación en portal:** `security.microsoft.com` > **Email & collaboration** > **Policies & rules** > **Threat policies** > **Anti-spam**

Editar **Anti-spam inbound policy (Default)**:
* **Spam & High Confidence Spam:** Mover a correo no deseado o poner en cuarentena.
* **Phishing:** Poner en cuarentena el mensaje.
* **High Confidence Phishing:** Poner en cuarentena (Retención de 30 días).

![Acciones Anti-Spam](/images/MS-Defender/Defender3.png)

#### Verificar ZAP (Zero-Hour Auto Purge)
Asegurar que **Spam ZAP** y **Phish ZAP** estén marcados como **Habilitados**. ZAP elimina automáticamente correos del buzón si Microsoft actualiza su reputación después de la entrega.

![Configuración Purga Automática ZAP](/images/MS-Defender/Defender4.png)

---

### Fase 3: Anti-Malware y Bloqueo de Extensiones de Riesgo

**Ubicación en portal:** `security.microsoft.com` > **Email & collaboration** > **Policies & rules** > **Threat policies** > **Anti-malware**

1. En la política predeterminada, habilitar el **Filtro de tipos de archivos adjuntos comunes**.
2. Verificar e incluir las siguientes extensiones bloqueadas de forma estricta:  
   `ace`, `ani`, `app`, `docm`, `exe`, `iso`, `jar`, `js`, `jse`, `vbe`, `vbs`, `ws`, `wsf`, `ps1`, `bat`, `cmd`, `hta`, `lnk`, `reg`, `scr`, `img`
3. **Notificaciones:** Configurar alerta por correo al equipo técnico (`ti-soc@sysarmortech.com`) cuando se intercepte malware.

![Edite la configuración de protección Anti-Malware](/images/MS-Defender/Defender5.png)
## PARTE 2: Capítulo Especial – Capacidades Avanzadas con Defender for Office 365 (Plan 1 / Plan 2)

En esta sección se detallan las funcionalidades adicionales que se desbloquean al adquirir licencias **Microsoft Defender for Office 365 Plan 1/P2** (o *Business Premium*). Este cuadro sirve como matriz de justificación técnica ante la gerencia:

### Anti-Phishing Avanzado (Impersonation Protection)
A diferencia del filtro básico de EOP, el Plan 1/P2 permite:
* **User Impersonation:** Proteger hasta 350 usuarios clave (CEO, CFO, TI) rastreando variaciones de su nombre completo en el remitente.
* **Domain Impersonation:** Monitorear dominios propios y de socios para evitar ataques mediante *typosquatting* (ejemplo: `sysarmortech.co` vs `sysarmortech.com`).
* **Phishing Threshold (Umbral):** Ajustar la sensibilidad del motor heurístico IA a `3 - Aggressive`.
* **Mailbox Intelligence:** Permite al sistema aprender los patrones habituales de comunicación entre empleados para detectar desvíos anómalos.

### Safe Attachments (Análisis en Sandbox)
* **Análisis dinámico de archivos de día cero:** Cuando llega un adjunto desconocido, EOP solo pasa firmas conocidas. Defender P1 detona el archivo en un entorno virtual (*sandbox*) en la nube de Microsoft antes de entregarlo.
* **Dynamic Delivery (Entrega Dinámica):** Entrega el cuerpo del correo inmediatamente al usuario mientras procesa el archivo adjunto en segundo plano, evitando retrasos operativos.

### Safe Links (Inspección Time-of-Click)
* **Reescritura de URLs:** Reescribe todas las direcciones web entrantes (`*.safelinks.protection.outlook.com`).
* **Inspección al hacer clic:** Si un enlace seguro cambia maliciosamente horas después de la entrega, Safe Links evalúa el sitio en tiempo real al momento del clic y bloquea el acceso en Outlook o Microsoft Teams.

### Herramientas de Investigación (Exclusivo Plan 2)
* **Threat Explorer:** Panel interactivo para hacer *hunting* de correos, analizar vectores de ataque por IP y realizar borrado masivo de mensajes sospechosos en todos los buzones del tenant.
* **Simulador de Ataques (Attack Simulation Training):** Ejecución de campañas internas de phishing controlado para evaluar al personal.

### Tabla comparativa EOP vs Defender

| Funcionalidad | EOP (incluido) | Defender P1/P2 (Add-on) |
| :--- | :---: | :---: |
| Anti-spam básico | ✔ | ✔ |
| Anti-phishing estándar | ✔ | ✔ (con IA, impersonation) |
| Bloqueo de adjuntos comunes | ✔ | ✔ |
| Safe Attachments (sandbox) | ✘ | ✔ |
| Safe Links (time-of-click) | ✘ | ✔ |
| Threat Explorer | ✘ | ✔ (Plan 2) |
| Simulador de ataques | ✘ | ✔ (Plan 2) |

---

## PARTE 3: Pruebas de Laboratorio (Entorno EOP Actual)

1. **Prueba de Filtro de Archivos:** Se envió un correo a la cuenta `CorreoLAB@SysarmorTech.onmicrosoft.com` con un archivo adjunto `.ps1` / `.exe`.  
   * *Resultado esperado:* El correo es rechazado o enviado a cuarentena por la regla de *Common Attachments Filter*.
2. **Prueba de Cadena EICAR:** Se envió a la misma cuenta una cadena EICAR (texto estándar de 68 caracteres usado para comprobar antivirus sin arriesgar el equipo) para validar el motor Anti-Malware.  
   * *Resultado obtenido:* El correo fue rechazado y enviado a cuarentena por considerarse malware. Adicionalmente, se generó un correo de notificación automática enviado al equipo técnico (`ti-soc@sysarmortech.com`).

![Diagrama de Flujo de Filtrado de Correo Entrante](/images/MS-Defender/Defender6.png)

---

## Alcance del Servicio SysArmorTech

En **SysArmorTech** convertimos el licenciamiento de Microsoft en una postura real de ciberdefensa, aplicando configuraciones de endurecimiento técnico y alineación de identidad que fortalecen la seguridad del correo corporativo.

### Niveles de implementación

#### Protección Estándar – EOP
* Endurecimiento de directivas Anti-Spam, Anti-Malware y Anti-Spoofing.
* Auditoría y firma de registros SPF, DKIM y DMARC.
* Bloqueo de extensiones de alto riesgo y cuarentena automatizada.
* Monitoreo de alertas críticas hacia el equipo técnico.

#### Protección Avanzada – Defender P1/P2
* Defensa contra suplantación de identidad con Inteligencia Artificial.
* Análisis de adjuntos y enlaces de día cero mediante Safe Attachments y Safe Links.
* Gestión activa de amenazas y campañas de concientización con Threat Explorer y simuladores de ataque.

> **Compromiso SysArmorTech:** Independientemente del tipo de licencia, garantizamos una implementación alineada con las mejores prácticas y una operación continua que optimiza la seguridad sin afectar la productividad.

👉 **Solicita tu consultoría personalizada en:** [https://sysarmortech.com](https://sysarmortech.com)