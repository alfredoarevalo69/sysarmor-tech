---
title: "Implementación de Cuentas dMSA (Delegated Managed Service Accounts) en Windows Server 2025"
description: "Aprende a configurar cuentas dMSA en Windows Server 2025 para vincular la identidad de servicios al hardware del host, eliminando contraseñas estáticas y mitigando Kerberoasting."
pubDate: 2026-08-17
category: "Infraestructura TI"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/dMSA/dMSA_blog.png"
pdfUrl: "/docs/implementacion-cuentas-dmsa-windows-2025.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Operación, Seguridad e Innovación  

---

## Introducción — El problema real

En las arquitecturas empresariales, las cuentas utilizadas para ejecutar servicios críticos suelen representar uno de los vectores de ataque más explotados por actores de amenaza. La evolución de las identidades de servicio en Active Directory responde a la necesidad de neutralizar el robo de credenciales:

*   **Cuentas de Usuario Tradicionales:** Vulnerables a Kerberoasting y AS-REP Roasting debido al uso de contraseñas estáticas y persistentes.
*   **gMSA (Windows Server 2012):** Introdujo la rotación automática de contraseñas asignada a grupos de equipos.
*   **dMSA (Windows Server 2025):** Asignación 1:1 vinculada directamente a la credencial del hardware del dispositivo local.

---

## Contexto y Evolución de Cuentas de Servicio

### Cuenta MSA
Las cuentas MSA (*Managed Service Account*) se crearon como un tipo de cuenta que permite administrar automáticamente los derechos y permisos de los servicios informáticos sin intervención manual en las contraseñas. En resumen, son cuentas de usuario que los servicios de Windows utilizan para iniciar sesión en un equipo o dominio con privilegios específicos.

### Cuenta gMSA
Las cuentas gMSA (*Group Managed Service Account*) son un tipo especial de cuenta de dominio en Active Directory. Su función principal es proporcionar una identidad digital segura para ejecutar servicios y aplicaciones en uno o varios servidores de forma simultánea, eliminando la necesidad de rotar contraseñas manualmente.

### Cuenta dMSA
Las cuentas dMSA (*Delegated Managed Service Account*) son un tipo de cuenta disponible desde Windows Server 2025. Sirven para ejecutar aplicaciones o servicios en un servidor específico de forma segura, ya que el sistema rota y administra las contraseñas de manera automática asociándolas al host.

### Diferencias clave: MSA vs. gMSA vs. dMSA

Este gráfico resume la evolución estratégica de las identidades de servicio dentro de Active Directory:

![Ciclo de Cuentas de Servicio](/images/dMSA/dMSA1.png)

---

## Requisitos previos

*   **Controlador de Dominio en Windows Server 2025:** Requerido para procesar las solicitudes[cite: 1]. dMSA introduce la clase `msDS-DelegatedManagedServiceAccount` en el esquema de WS2025[cite: 1].
    > **Nota de arquitectura:** No es strictly obligatorio elevar el *Forest Functional Level* a 2025 en entornos híbridos, siempre que el esquema esté actualizado (`adprep /forestprep`) y los DCs correspondientes ejecuten WS2025.
*   **Clave Raíz KDS activa:** Configurada en Active Directory mediante `Add-KdsRootKey`.
*   **Módulo de PowerShell de Active Directory / RSAT:** Correspondiente a Windows Server 2025.
*   **Privilegios:** Credenciales con permisos de Domain Admin.
*   **Credential Guard:** Requerido en el equipo destino si se va a realizar migración de cuentas existentes.

---

## Creación y validación de cuenta de servicio clásica (previa a dMSA)

Para contrastar el comportamiento frente a dMSA, se crea primero una cuenta de servicio clásica desde un Controlador de Dominio con privilegios de Domain Admin:

powershell
New-ADUser -Name "svc_iis" -SamAccountName "svc_iis" -AccountPassword (Read-Host -AsSecureString "Ingrese contraseña") -Enabled $true -PasswordNeverExpires$true -Path "OU=Usuarios,DC=SysArmorTech,DC=com"

Validamos su creación en **Active Directory Users and Computers**:

![Propiedades de cuenta svc_iis](/images/dMSA/dMSA2.png)

### Prueba de concepto con servicio local (NotepadSrv en EQUIPO10)

1. En el servidor `EQUIPO10`, se asigna el derecho de *Log on as a service* (`secpol.msc`) a la cuenta `SYSARMORTECH01\svc_iis` para evitar el error 1297.
2. Se configura el servicio `NotepadSrv` para iniciar sesión con la cuenta creada.

![Configuración de servicio NotepadSrv](/images/dMSA/dMSA3.png)

---

## Proceso de creación de una cuenta dMSA

A diferencia de las gMSA (que permiten definir grupos de seguridad con múltiples equipos), las cuentas dMSA exigen asociar explícitamente la cuenta a la identidad de un servidor específico.

### Paso 1: Crear el objeto dMSA con cifrado estricto (AES128, AES256)

Ejecutar en PowerShell con el módulo de Active Directory de Windows Server 2025:

powershell
New-ADServiceAccount -CreateDelegatedServiceAccount -Name "iis_service_lab" `
  -DNSHostName "iis_service_lab.SysArmorTech.com" `
  -KerberosEncryptionType AES128,AES256


### Paso 2: Delegar el acceso de recuperación de credenciales a EQUIPO10

Asignar el servidor autorizado para recuperar la contraseña administrada:

powershell
Set-ADServiceAccount -Identity "iis_service_lab" -PrincipalsAllowedToRetrieveManagedPassword "EQUIPO10$"


### Paso 3: Validar los atributos del objeto dMSA

Verificar la correcta configuración de los atributos en Active Directory:

powershell
Get-ADServiceAccount -Identity "iis_service_lab" -Properties *

---

## Inspección de Atributos mediante ldp.exe

Para verificar la estructura interna del objeto en Active Directory mediante `ldp.exe`:

### Conexión y Autenticación:
1. Abrir `ldp.exe` (`Win + R` > `ldp.exe`).
2. Ir a **Connection** > **Connect...** e ingresar el nombre del DC o puerto 389.
3. Ir a **Connection** > **Bind...** y autenticarse con credenciales de Domain Admin.

### Navegación en el Árbol del Dominio:
1. Seleccionar **View** > **Tree** y establecer el BaseDN (`DC=SysArmorTech,DC=com`).
2. Desplegar el contenedor por defecto: `CN=Managed Service Accounts,DC=SysArmorTech,DC=com`.
3. Seleccionar el objeto creado (`CN=iis_service_lab`).

![Inspección de atributos dMSA en ldp.exe](/images/dMSA/dMSA4.png)

### Atributos clave de dMSA
*   **ObjectClass:** Identifica la clase `ms-DS-Delegated-Managed-Service-Account`.
*   **SamAccountName:** Finaliza con el carácter `$` (`iis_service_lab$`).
*   **DelegatedMSAState:** El valor `{0}` indica el estado inicial (*unbound*) previo a la primera vinculación del host autorizado (`EQUIPO10$`).
*   **PrincipalsAllowedToRetrieveManagedPassword:** Muestra la lista explícita de equipos autorizados (`CN=EQUIPO10...`).
*   **ManagedPasswordIntervalInDays:** Define el intervalo de rotación automática (30 días por defecto).
*   **KerberosEncryptionType:** Confirma el uso de algoritmos robustos (`AES128`, `AES256`).

---

## Registro e Implementación en IIS (Application Pool en EQUIPO10)

Registro de la cuenta `iis_service_lab` en `EQUIPO10`:

powershell
Install-ADServiceAccount -Identity "iis_service_lab"
Test-ADServiceAccount -Identity "iis_service_lab"

### Configuración desde IIS Manager

Para utilizar la cuenta dMSA en un Application Pool de Internet Information Services (IIS) en `EQUIPO10`

1. Abrir **IIS Manager** en `EQUIPO10`.
2. Ir a **Application Pools** > Seleccionar **IIS_ServicePool** > **Advanced Settings**.
3. En el campo **Identity**, seleccionar **Custom Account** e ingresar:
    *   **User name:** `SYSARMORTECH\iis_service_lab$` *(Es indispensable incluir el sufijo `$`)*.
    *   **Password:** Dejar en blanco.
4. Iniciar o reiniciar el Application Pool. Si el estado cambia a **Started** sin solicitar contraseña manual, la dMSA está operando correctamente y la credencial ha sido delegada al host.

![Application Pool en IIS con cuenta dMSA](/images/dMSA/dMSA5.png)

### Automatización del Application Pool con PowerShell

Anexo los comandos en PowerShell sobre cómo se podría automatizar el proceso de asignación de una cuenta de este tipo en un Application Pool, para evitar errores mecánicos desde la consola gráfica:

powershell
Import-Module WebAdministration
Set-ItemProperty -Path "IIS:\AppPools\IIS_ServicePool" -Name "processModel.identityType" -Value 3
Set-ItemProperty -Path "IIS:\AppPools\IIS_ServicePool" -Name "processModel.userName" -Value "SYSARMORTECH\iis_service_lab$"
Set-ItemProperty -Path "IIS:\AppPools\IIS_ServicePool" -Name "processModel.password" -Value ""
Restart-WebAppPool -Name "IIS_ServicePool"

---

## Casos de Uso Reales & Hardening

*   **Servicios críticos e IIS:** Eliminación de contraseñas locales almacenadas en texto plano o registros de configuración.
*   **Tareas Programadas (Scheduled Tasks):** Permite ejecutar procesos desatendidos sin riesgo de exposición de credenciales en la memoria local o scripts.
*   **Reducción de Superficie de Ataque:** Mitiga vectores de Kerberoasting al forzar cifrado AES y eliminar contraseñas estáticas asignadas a usuarios.

---

## Consideraciones y limitaciones

*   **Soporte exclusivo:** Las dMSA requieren que el host ejecute Windows Server 2025.
*   **Delegación No Restringida:** La delegación no restringida de Kerberos deja de funcionar tras completar la migración si la cuenta de origen dependía de ella.
*   **Entornos RODC:** Los Controladores de Dominio de Solo Lectura requieren pasos manuales adicionales para el almacenamiento en caché de credenciales.

---

## Conclusión técnica

La implementación de dMSA en Windows Server 2025 representa un avance fundamental en el hardening de infraestructura Active Directory. Al eliminar las contraseñas estáticas y vincular la identidad del servicio directamente al hardware del servidor autorizado, se logra neutralizar las técnicas tradicionales de extracción de credenciales, elevando la postura de seguridad operacional en el entorno empresarial.