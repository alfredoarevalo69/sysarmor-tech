---
title: "Guía Paso a Paso: Implementación de Windows LAPS en Windows Server 2025 y Windows 11"
description: "Aprende a configurar Windows LAPS nativo en Active Directory, extender el esquema, delegar permisos de OU, aplicar GPOs y administrar contraseñas con PowerShell."
pubDate: 2026-08-15
category: "Seguridad e Infraestructura TI"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/LAPS/LAPS.jpeg"
pdfUrl: "/docs/instalar-configurar-laps.pdf"
---

> **Autor:** SYSARMOR TECH <br />
> **Enfoque:** Infraestructura, Operación, Seguridad e Innovación <br />

---

<h2>Introducción</h2>

<p>
  <strong>Windows LAPS</strong> (Local Administrator Password Solution) es una solución nativa integrada en los sistemas operativos de Microsoft diseñada para administrar, rotar y realizar copias de seguridad automáticas de las contraseñas de la cuenta de administrador local en dispositivos unidos a Active Directory o Microsoft Entra ID.
</p>

<p>
  Adicionalmente, en infraestructuras basadas en <strong>Windows Server 2025</strong>, Windows LAPS introduce capacidades avanzadas para gestionar y proteger de forma automatizada la contraseña de la cuenta del Modo de Restauración de Servicios de Directorio (<strong>DSRM</strong>) en controladores de dominio, mitigando vectores de ataque basados en movimiento lateral y reutilización de credenciales.
</p>

<blockquote>
  <strong>Resumen Ejecutivo:</strong> La reutilización de contraseñas de administrador local en múltiples servidores y estaciones de trabajo es una de las vulnerabilidades más explotadas en ataques de ransomware y movimiento lateral. La implementación de Windows LAPS nativo elimina esta brecha al garantizar contraseñas complejas, únicas y con rotación programada, almacenadas de forma cifrada directamente en la partición del Directorio Activo.
</blockquote>

<blockquote style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 1rem; margin: 1.5rem 0;">
  <strong>📄 Documentación Extendida:</strong> Si deseas revisar el procedimiento con un desglose aún más detallado de cada paso, parámetros específicos, comandos avanzados y arquitectura de pruebas, puedes consultar y descargar la versión estructurada en PDF directamente aquí: 
  <a href="/docs/Instalar%20y%20configurar%20LAPS.pdf" target="_blank" rel="noopener noreferrer"><strong>Descargar Guía PDF Completa</strong></a>.
</blockquote>

---

<h2>Capítulo 1: Requisitos Previos y Matriz de Compatibilidad</h2>

<p>
  A diferencia de la versión heredada (Legacy LAPS), la versión moderna de Windows LAPS no requiere la instalación de agentes MSI ni archivos <code>.dll</code> externos, ya que se encuentra integrada directamente en el núcleo del sistema operativo a través de las últimas actualizaciones acumulativas.
</p>

<h3>Requisitos de la Infraestructura</h3>

<ul>
  <li><strong>Sistemas Operativos Cliente:</strong> Windows 11 (23H2 o posterior) o Windows 10 (con actualización de abril de 2023 o superior).</li>
  <li><strong>Sistemas Operativos Servidor:</strong> Windows Server 2025, Windows Server 2022 o Windows Server 2019 con actualizaciones acumulativas al día.</li>
  <li><strong>Directorio Activo:</strong> Dominio de Active Directory Domain Services (AD DS) o entorno híbrido con Microsoft Entra ID.</li>
  <li><strong>Privilegios Requeridos:</strong> Cuenta con membresía en los grupos <strong>Domain Admins</strong> y <strong>Schema Admins</strong> para la fase de extensión del esquema.</li>
</ul>

<p>Para iniciar el proceso, verificamos la disponibilidad del módulo nativo de LAPS en PowerShell desde un controlador de dominio:</p>

<p>
  <img src="/images/LAPS/image1.png" alt="Verificación del módulo LAPS en PowerShell" />
</p>

---

<h2>Capítulo 2: Preparación del Esquema en Active Directory (AD DS)</h2>

<p>
  Para que Active Directory pueda almacenar las contraseñas cifradas, el historial de contraseñas y las marcas de tiempo de expiración, es indispensable extender el esquema del dominio.
</p>

<h3>Pasos para la Extensión del Esquema</h3>

<ol>
  <li>Inicia sesión en el Controlador de Dominio principal con una cuenta con privilegios de <strong>Schema Admins</strong>.</li>
  <li>Abre una consola de <strong>PowerShell</strong> con privilegios elevados (<em>Run as Administrator</em>).</li>
  <li>Ejecuta el cmdlet de extensión de esquema:</li>
</ol>

<pre><code>Import-Module LAPS
Update-LapsADSchema -Verbose
</code></pre>

<p>
  <img src="/images/LAPS/image2.png" alt="Ejecución del comando Update-LapsADSchema para extender el esquema de Active Directory" />
</p>

<h3>Atributos Incorporados al Esquema</h3>

<div style="overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
    <thead>
      <tr style="background-color: #f1f5f9; text-align: left;">
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Atributo</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Descripción</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><code>msLAPS-Password</code></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Almacena la contraseña en texto plano (solo para retrocompatibilidad/legacy).</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><code>msLAPS-EncryptedPassword</code></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Almacena el blob cifrado de la contraseña actual.</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><code>msLAPS-EncryptedPasswordHistory</code></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Almacena el historial de contraseñas previas de forma cifrada.</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><code>msLAPS-EncryptedDSRMPassword</code></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Almacena la contraseña cifrada de la cuenta DSRM del Controlador de Dominio.</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><code>msLAPS-PasswordExpirationTime</code></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Marca de tiempo en formato FileTime que indica cuándo debe rotarse la contraseña.</td>
      </tr>
    </tbody>
  </table>
</div>

---

<h2>Capítulo 3: Delegación de Permisos en Unidades Organizativas (OUs)</h2>

<p>
  Por diseño de seguridad y bajo el principio de menor privilegio, las cuentas de equipo deben tener permiso para escribir sus propias contraseñas, mientras que solo los grupos de administración autorizados deben tener permisos de lectura y reseteo.
</p>

<h3>1. Permitir Auto-Escritura al Equipo (Self-Permission)</h3>
<p>Ejecuta el siguiente comando especificando la Unidad Organizativa donde se ubican los servidores o equipos de cómputo:</p>

<pre><code>Set-LapsADComputerSelfPermission -Identity "OU=Servidores,DC=SysArmorTech,DC=com"
</code></pre>

<h3>2. Asignar Permiso de Lectura de Contraseñas Cifradas</h3>
<p>Delega el acceso de lectura únicamente a los grupos de soporte o administración autorizados (ej. <code>Domain Admins</code> o un grupo RBAC dedicado):</p>

<pre><code>Set-LapsADReadPasswordPermission -Identity "OU=Servidores,DC=SysArmorTech,DC=com" -AllowedPrincipals "Domain Admins"
</code></pre>

<p>
  <img src="/images/LAPS/image4.png" alt="Asignación de permisos de lectura de contraseñas cifradas con Set-LapsADReadPasswordPermission" />
</p>

<h3>3. Asignar Permiso de Forzado / Reseteo de Expiración</h3>

<pre><code>Set-LapsADResetPasswordPermission -Identity "OU=Servidores,DC=SysArmorTech,DC=com" -AllowedPrincipals "Domain Admins"
</code></pre>

<p>
  <img src="/images/LAPS/image5.png" alt="Delegación de permisos de reseteo de contraseñas con Set-LapsADResetPasswordPermission" />
</p>

---

<h2>Capítulo 4: Configuración de la Directiva de Grupo (GPO)</h2>

<p>
  La administración centralizada del agente de Windows LAPS se realiza a través de las plantillas administrativas nativas integradas en Windows Server 2025.
</p>

<h3>Pasos de Configuración en GPMC</h3>
<ol>
  <li>Abre la consola de administración de directivas de grupo (<code>gpmc.msc</code>).</li>
  <li>Crea un objeto de directiva de grupo denominado <code>GPO_Windows_LAPS_Hardening</code> y vincúlalo a la OU objetivo.</li>
  <li>Navega a la ruta: <strong>Configuración del equipo &gt; Plantillas administrativas &gt; Sistema &gt; LAPS</strong>.</li>
</ol>

<p>
  <img src="/images/LAPS/image6.png" alt="Consola de Administración de Directivas de Grupo con la sección LAPS en Plantillas Administrativas" />
</p>

<p>Asegúrate de vincular la GPO en la Unidad Organizativa correcta dentro de la estructura jerárquica de Active Directory:</p>

<p>
  <img src="/images/LAPS/image7.png" alt="Estructura de Unidades Organizativas y vinculación de la GPO de LAPS en ADUC" />
</p>

<h3>Matriz de Parametrización Recomendada</h3>

<div style="overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
    <thead>
      <tr style="background-color: #f1f5f9; text-align: left;">
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Directiva</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Estado</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Configuración Recomendada</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Configure password backup directory</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Habilitado</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Active Directory</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Enable password encryption</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Habilitado</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Activado (Garantiza el cifrado mediante la clave de protección del dominio)</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Password Settings</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Habilitado</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Longitud: 16 caracteres | Complejidad: Mayúsculas, Minúsculas, Números y Símbolos | Edad máx: 30 días</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Configure size of encrypted password history</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Habilitado</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">5 contraseñas históricas</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Name of administrator account to manage</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Opcional</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Especificar si la cuenta de administrador local fue renombrada. Si no se configura, administra la cuenta RID -500 predeterminada.</td>
      </tr>
    </tbody>
  </table>
</div>

---

<h2>Capítulo 5: Validación, Auditoría y Operación Diaria</h2>

<h3>1. Interfaz Gráfica en Active Directory (ADUC)</h3>

<p>
  En Windows Server 2025, la consola <strong>Active Directory Users and Computers</strong> (<code>dsa.msc</code>) incorpora la pestaña nativa <strong>LAPS</strong> dentro de las propiedades del objeto de equipo, permitiendo visualizar el estado de expiración y forzar la expiración inmediata:
</p>

<p>
  <img src="/images/LAPS/image8.png" alt="Pestaña LAPS nativa en las propiedades del objeto de equipo dentro de Active Directory Users and Computers" />
</p>

<h3>2. Verificación y Procesamiento en el Cliente</h3>

<p>En el equipo objetivo, fuerza la aplicación de las políticas y procesa el ciclo de vida de LAPS ejecutando desde PowerShell:</p>

<pre><code>gpupdate /force
Invoke-LapsPolicyProcessing -Verbose
</code></pre>

<h3>3. Consulta de Contraseñas vía PowerShell</h3>

<p>Para recuperar la contraseña de un equipo en texto plano (requiere estar dentro del grupo con permisos de lectura delegados):</p>

<pre><code># Obtener contraseña actual en texto plano
Get-LapsADPassword -Identity "SYSARMOR01" -AsPlainText
</code></pre>

<p>
  <img src="/images/LAPS/image9.png" alt="Consulta de contraseña actual de LAPS mediante Get-LapsADPassword en texto plano" />
</p>

<p>Para consultar el historial de contraseñas cifradas y marcas de expiración guardadas en el directorio:</p>

<pre><code># Obtener contraseña actual e historial cifrado
Get-LapsADPassword -Identity "SYSARMOR01" -IncludeHistory -AsPlainText
</code></pre>

<p>
  <img src="/images/LAPS/image10.png" alt="Consulta del historial de contraseñas de LAPS mediante Get-LapsADPassword con parámetro IncludeHistory" />
</p>

---

<h2>Capítulo 6: Cuadro Comparativo (Legacy LAPS vs. Windows LAPS)</h2>

<div style="overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
    <thead>
      <tr style="background-color: #f1f5f9; text-align: left;">
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Criterio</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Legacy LAPS (Microsoft LAPS)</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Windows LAPS Moderno (Server 2025 / Win 11)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Arquitectura</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Agente MSI externo (<code>AdmPwd.dll</code>)</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Nativo en el sistema operativo</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Almacenamiento</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Texto plano en atributo de AD</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Cifrado AES en reposo y en tránsito</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Historial</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">No soportado</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Soporta historial cifrado de contraseñas previas</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Soporte Híbrido</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Exclusivo de Active Directory On-Premises</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Compatible con AD DS On-Premises y Microsoft Entra ID</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Protección DSRM</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">No disponible</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Integrado para controladores de dominio</td>
      </tr>
    </tbody>
  </table>
</div>

---

<h2>Conclusión</h2>

<p>
  La transición hacia <strong>Windows LAPS nativo</strong> es un paso fundamental en el fortalecimiento de la postura de seguridad de cualquier infraestructura basada en Active Directory. Al eliminar la dependencia de agentes de terceros, asegurar el cifrado de extremo a extremo de las credenciales y permitir la gestión del historial, se reduce drásticamente la superficie de ataque frente a técnicas de movimiento lateral.
</p>