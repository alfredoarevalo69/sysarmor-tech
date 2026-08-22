---
title: "Implementación Híbrida de Microsoft Intune y Entra ID Join en Entornos Empresariales"
description: "Guía paso a paso para la configuración de Microsoft Entra Connect, sincronización de identidades y la inscripción automática de dispositivos (MDM/Intune) en escenarios híbridos."
pubDate: 2026-08-21
category: "Infraestructura TI"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/MDM_Intune/MDM_Intune.png"
pdfUrl: "/docs/Intune Implementacion Hibrida.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Operación, Seguridad e Innovación  

---

## Introducción

En el panorama actual de la ciberseguridad e infraestructura TI, la transición de un entorno Active Directory Domain Services (AD DS) local hacia una arquitectura de gestión basada en la nube (*Cloud-Native* o *Hybrid*) requiere de un puente sólido para sincronizar identidades, politicas y dispositivos.

El escenario de **Hybrid Microsoft Entra Join** junto con **Microsoft Intune (MDM)** permite a las organizaciones mantener el control de sus recursos legados en premisa mientras adoptan capacidades avanzadas de gestión centralizada de endpoints, condicionalidad de acceso y cumplimiento de políticas desde la nube.

---

## Arquitectura de Sincronización y Componentes Clave

Para lograr que los equipos unidos al dominio local sean inscritos automáticamente en Microsoft Intune, es indispensable cumplir con la integración de tres componentes principales:

1. **Active Directory Domain Services (AD DS) Local:** Fuente originaria de las identidades de usuario y equipo.
2. **Microsoft Entra Connect:** Motor de sincronización que proyecta las identidades y los objetos de equipo en el tenant de Microsoft 365 / Entra ID.
3. **Microsoft Intune (MDM):** Plataforma de administración de dispositivos que aplica políticas de configuración, cumplimiento y perfiles de seguridad.

![Arquitectura de Sincronización Entra Connect](/images/MDM_Intune/MDM_Intune1.png)

---

## Prerrequisitos y Preparación del Entorno

Antes de iniciar con la instalación e integración de componentes, asegúrese de validar lo siguiente:

* **Controladores de Dominio:** Servidores Windows Server actualizados y con esquemas en buen estado de salud.
* **Licenciamiento:** Licencias asignadas a los usuarios que incluyan **Microsoft Intune** y **Microsoft Entra ID P1 / P2** (por ejemplo, Microsoft 365 E3/E5, Business Premium o EMS E3/E5).
* **Nombres de Dominio:** Dominio personalizado verificado en Microsoft Entra ID coincidente con el UPN principal de los usuarios locales.
* **Privilegios:** Credenciales con permisos de *Global Administrator* / *Hybrid Identity Administrator* en Microsoft 365 y *Domain Admin* / *Enterprise Admin* en el AD DS local.

![Verificación de servicios Active Directory](/images/MDM_Intune/MDM_Intune2.png)

---

## Despliegue y Configuración de Microsoft Entra Connect

El proceso de sincronización se realiza mediante la instalación de Microsoft Entra Connect en un servidor miembro o controlador de dominio.

### Paso 1: Configuración de la Sincronización Directa

En la consola de Active Directory Administrative Center, verifique que los atributos de los usuarios estén correctamente diligenciados, especialmente el atributo `userPrincipalName`.

![Administración de objetos en AD Center](/images/MDM_Intune/MDM_Intune3.png)

Asegúrese de revisar la topología de la infraestructura para verificar la continuidad operativa del servicio de sincronización.

![Esquema de sincronización Entra Connect](/images/MDM_Intune/MDM_Intune4.png)

### Paso 2: Instalación del Asistente Microsoft Entra Connect

1. Inicie el instalador de **Microsoft Entra Connect** y acepte los términos de licencia.
2. Seleccione la opción de **Express Settings** (o *Customized* según el requerimiento de unidades organizativas específicas).

![Express Settings en Entra Connect](/images/MDM_Intune/MDM_Intune5.png)

3. Ingrese las credenciales de un administrador con rol de **Hybrid Identity Administrator** o **Global Admin**.

![Inicio de sesión en Microsoft Entra](/images/MDM_Intune/MDM_Intune6.png)

4. Proporcione las credenciales correspondientes del dominio local para validar la conexión con Active Directory.

![Conexión con directorios locales](/images/MDM_Intune/MDM_Intune7.png)

5. Confirme el nombre de dominio completamente calificado (FQDN) y la cuenta de servicio del bosque.

![Conexión de directorios y dominios](/images/MDM_Intune/MDM_Intune8.png)

![Validación de bosque Active Directory](/images/MDM_Intune/MDM_Intune9.png)

6. Configure el inicio de sesión indicando el atributo base para el User Principal Name (UPN).

![Configuración de Sign-in Entra ID](/images/MDM_Intune/MDM_Intune10.png)

7. En el filtrado de Dominios y Unidades Organizativas (OU), seleccione únicamente las OUs que contienen los usuarios y equipos que formarán parte del alcance de la sincronización.

![Filtrado de Dominios y OUs](/images/MDM_Intune/MDM_Intune11.png)

8. Verifique el resumen antes de ejecutar la sincronización inicial y marque la casilla **Start the synchronization process when configuration completes**.

![Resumen de configuración previa](/images/MDM_Intune/MDM_Intune12.png)

9. Finalice el asistente y verifique que el estado indique **Configuration complete**.

![Configuración completada con éxito](/images/MDM_Intune/MDM_Intune13.png)

---

## Verificación de Sincronización en Synchronization Service Manager

Abra la herramienta **Synchronization Service Manager** (`miisclient.exe`) en el servidor donde instaló Entra Connect para supervisar los ciclos de sincronización (*Delta Import*, *Delta Sync*, *Export*).

![Synchronization Service Manager Status](/images/MDM_Intune/MDM_Intune14.png)

Verifique en los detalles de las exportaciones que los objetos de usuario y equipo se estén creando satisfactoriamente en Microsoft Entra ID.

![Detalle de objetos exportados](/images/MDM_Intune/MDM_Intune15.png)

---

## Configuración de la Inscripción Automática en Microsoft Intune (MDM / MAM)

Para habilitar la inscripción automática en Intune cuando los equipos se unan al entorno híbrido:

1. Ingrese al **Centro de administración de Microsoft Intune** (`intune.microsoft.com`).
2. Navegue a **Dispositivos** > **Inscripción de dispositivos** > **Inscripción automática**.
3. Defina el alcance del **Ámbito de usuario de MDM** en **Todos** (o **Algunos** indicando un grupo de seguridad específico).

![Perfil de usuario en Intune](/images/MDM_Intune/MDM_Intune16.png)

En los equipos clientes de los usuarios, se podrá disponer de la aplicación **Portal de empresa (Company Portal)** para la autogestión de software corporativo y verificación de estado.

![Portal de Empresa Company Portal](/images/MDM_Intune/MDM_Intune17.png)

![Verificación de alineación en Portal de Empresa](/images/MDM_Intune/MDM_Intune18.png)

---

## Despliegue de Directivas GPO para Hybrid Join e Inscripción en Intune

Para forzar la inscripción desatendida de los equipos locales mediante Group Policy (GPO):

1. En el servidor DC, abra **Group Policy Management** (`gpmc.msc`).
2. Cree o edite un objeto GPO asignado a la OU donde residen los equipos Windows 10/11.
3. Navegue a:  
   `Configuración del equipo` > `Directivas` > `Plantillas administrativas` > `Componentes de Windows` > `MDM`
4. Habilite la directiva: **Habilitar la inscripción automática de MDM con credenciales de Microsoft Entra predeterminadas**.
5. Seleccione el tipo de credencial como **Credencial de dispositivo**.

![Configuración de cifrado BitLocker e Intune](/images/MDM_Intune/MDM_Intune19.png)

---

## Validación del Estado en los Clientes (Windows 10 / Windows 11)

### Validación mediante Línea de Comandos (`dsregcmd`)

En una consola `cmd.exe` o PowerShell en el cliente, ejecute:

```cmd
dsregcmd /status
```

Verifique los siguientes parámetros clave:

* **`AzureAdJoined`**: `YES`
* **`DomainJoined`**: `YES`
* **`MdmUrl`**: Debe mostrar el Endpoint de Intune correspondiente al tenant.

![Ejecución de símbolo del sistema](/images/MDM_Intune/MDM_Intune20.png)

![Salida del comando dsregcmd status](/images/MDM_Intune/MDM_Intune21.png)

### Validación en el Panel de Configuración de Windows

Acceda a **Configuración** > **Cuentas** > **Obtener acceso a trabajo o escuela**:

![Propiedades del proveedor de administración MDM](/images/MDM_Intune/MDM_Intune22.png)

Al inspeccionar los detalles de la conexión, se confirmará la gestión por parte de Microsoft Intune y el estado de sincronización del dispositivo.

![Detalles de sincronización de directivas](/images/MDM_Intune/MDM_Intune23.png)

![Propiedades avanzadas de conexión](/images/MDM_Intune/MDM_Intune24.png)

![Resumen de directivas aplicadas](/images/MDM_Intune/MDM_Intune25.png)

---

## Casos de Uso Reales & Hardening

* **Inscripción Desatendida:** Despliegue masivo sin intervención manual del usuario ni interrupción de tareas operativas.
* **Gestión de Políticas Centralizada:** Aplicación de líneas base de seguridad (Security Baselines), políticas de BitLocker y restricciones de Software en un solo panel.
* **Acceso Condicional:** Permite condicionar el acceso a los recursos de Microsoft 365 únicamente a dispositivos que cumplan con el estado de cumplimiento (*Compliant*) en Intune.

---

## Consideraciones y Buenas Prácticas

* **Consistencia de UPN:** Asegúrese de que el sufijo UPN principal en AD DS sea enrutable y coincida exactamente con el dominio primario en Microsoft Entra ID.
* **GPO de Registro MDM:** Utilice `Credencial de dispositivo` para evitar fallos cuando el usuario en sesión no tiene permisos de administración local.
* **Conectividad de Red:** Asegúrese de que los equipos clientes tengan acceso a los URLs y puertos requeridos por Microsoft Entra ID e Intune (incluyendo certificados CRL/OCSP).

---

## Conclusión Técnica

La arquitectura de **Hybrid Microsoft Entra Join + Intune** representa la estrategia más eficiente para las organizaciones que buscan modernizar la gestión de endpoints sin abandonar su infraestructura Active Directory existente. Esta implementación no solo optimiza la visibilidad y el cumplimiento normativo en toda la flota de dispositivos, sino que establece los cimientos para una postura de seguridad de **Zero Trust**.