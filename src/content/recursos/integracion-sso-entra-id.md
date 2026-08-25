---
title: "Integración SSO con Microsoft Entra ID: Conecta cualquier aplicación SAML 2.0"
description: "Guía técnica paso a paso para configurar Inicio de Sesión Único (SSO) federado entre Microsoft Entra ID y aplicaciones compatibles con SAML 2.0 usando Salesforce Dev como laboratorio práctico."
pubDate: 2026-08-18
category: "Seguridad e Infraestructura TI"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/SAML/SAML_SSO.jpeg"
pdfUrl: "/docs/integracion-sso-entra-id.pdf"
---

> **Autor:** SYSARMOR TECH <br />
> **Enfoque:** Infraestructura, Operación, Seguridad e Innovación <br />

---

<h2>Introducción</h2>

<p>
  En entornos corporativos heterogéneos, la gestión fragmentada de credenciales para CRM, ERP o servicios Cloud incrementa drásticamente la superficie de ataque y genera la conocida "fatiga de contraseñas". El protocolo <strong>SAML 2.0</strong> (Security Assertion Markup Language) actúa como un esquema de confianza federada dividiendo las responsabilidades entre dos actores clave:
</p>

<ul>
  <li><strong>Identity Provider (IdP):</strong> Microsoft Entra ID valida la identidad del usuario, aplica políticas de acceso y emite una aserción firmada digitalmente.</li>
  <li><strong>Service Provider (SP):</strong> La aplicación de negocio (ej. Salesforce) confía en la firma digital recibida y otorga acceso sin requerir ni almacenar contraseñas locales.</li>
</ul>

<blockquote>
  <strong>Resumen Ejecutivo:</strong> La integración de SSO mediante SAML 2.0 centraliza el control de identidades en Microsoft Entra ID, elimina las credenciales locales expuestas en aplicaciones de terceros y permite aplicar controles de seguridad avanzados como Acceso Condicional y MFA antes de permitir el acceso a sistemas críticos.
</blockquote>

<blockquote style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 1rem; margin: 1.5rem 0;">
  <strong>📄 Documentación Extendida:</strong> Si deseas revisar la arquitectura detallada, flujos de autenticación y parametrización de auditoría completa, puedes consultar y descargar la versión estructurada en PDF directamente aquí: 
  <a href="/docs/Integracion%20SSO%20con%20Entra%20ID.pdf" target="_blank" rel="noopener noreferrer"><strong>Descargar Guía PDF Completa</strong></a>.
</blockquote>

---

<h2>Capítulo 1: Requisitos Previos y Matriz de Roles</h2>

<p>
  Antes de iniciar la federación entre Microsoft Entra ID y el Proveedor de Servicios (SP), asegúrate de contar con los siguientes accesos y privilegios administrativos:
</p>

<h3>Requisitos de la Infraestructura</h3>

<ul>
  <li><strong>Suscripción a Microsoft Entra ID:</strong> Licenciamiento activo con roles de <em>Administrador de aplicaciones</em> o <em>Administrador de aplicaciones en la nube</em>.</li>
  <li><strong>Entorno de Aplicación (SP):</strong> Organización de desarrollo o entorno de producción en Salesforce con perfil de <em>Administrador del sistema</em>.</li>
  <li><strong>Atributo de Identidad Alineado:</strong> Identificador único común entre ambos entornos (usualmente el <code>UserPrincipalName</code> o correo corporativo).</li>
</ul>

---

<h2>Capítulo 2: Creación de Enterprise App y Exportación de Metadatos IdP</h2>

<p>
  El primer paso consiste en registrar la aplicación no listada en la galería de Microsoft Entra ID y obtener el archivo XML de metadatos del IdP que contiene el certificado de firma de tokens.
</p>

<h3>Pasos para el Registro en Entra ID</h3>

<ol>
  <li>Accede al portal de administración de <strong>Microsoft Entra ID</strong>.</li>
  <li>Navega a <strong>Aplicaciones empresariales &gt; Nueva aplicación &gt; Crear su propia aplicación</strong>.</li>
  <li>Asigna el nombre <code>Salesforce Dev Lab</code> y selecciona la opción <em>Integrar cualquier otra aplicación que no se encuentre en la galería (Non-gallery)</em>.</li>
  <li>Dentro de la aplicación creada, selecciona <strong>Inicio de sesión único &gt; SAML</strong>.</li>
  <li>En la sección <strong>Certificado de firma de SAML</strong>, haz clic en el menú desplegable y descarga el <strong>XML de metadatos de federación</strong>.</li>
</ol>

<p>
  <img src="/images/SAML/SAML1.png" alt="Descarga del XML de metadatos de federación desde el certificado de firma SAML en Microsoft Entra ID" />
</p>

---

<h2>Capítulo 3: Configuración del SSO e Importación de Metadatos en Salesforce</h2>

<p>
  Para establecer la relación de confianza, importamos los metadatos descargados de Entra ID dentro de la consola de administración de Salesforce y exportamos los metadatos del SP.
</p>

<h3>Pasos de Configuración en el SP</h3>

<ol>
  <li>Ingresa a la consola de administración de Salesforce (<strong>Configuración / Setup</strong>).</li>
  <li>En el buscador rápido, navega a <strong>Configuración de inicio de sesión único</strong> y haz clic en <strong>Nuevo a partir del archivo de metadatos</strong>.</li>
  <li>Sube el archivo XML exportado previamente desde Microsoft Entra ID y guarda la configuración.</li>
  <li>Una vez guardada la configuración SAML, haz clic en el botón <strong>Descargar metadatos</strong> para obtener la definición XML del Service Provider.</li>
</ol>

<p>
  <img src="/images/SAML/SAML2.png" alt="Configuración de inicio de sesión único SAML en Salesforce y descarga de metadatos SP" />
</p>

<blockquote style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 1rem; margin: 1.5rem 0;">
  <strong>💡 Nota Técnica:</strong> La importación directa de metadatos XML entre IdP y SP elimina errores tipográficos manuales en la trascripción de los endpoints ACS (Assertion Consumer Service), Entity IDs y certificados X.509.
</blockquote>

---

<h2>Capítulo 4: Automatización de Endpoints (ACS & Entity ID) en Entra ID</h2>

<p>
  Al cargar los metadatos generados por Salesforce dentro de Microsoft Entra ID, la plataforma mapea automáticamente las URLs de procesamiento sin intervención manual.
</p>

<h3>Pasos para la Carga de Metadatos SP</h3>

<ol>
  <li>Regresa al portal de <strong>Microsoft Entra ID</strong> en la aplicación <code>Salesforce Dev Lab</code>.</li>
  <li>En la vista <strong>Inicio de sesión único con SAML</strong>, haz clic en la opción <strong>Cargar archivo de metadatos</strong>.</li>
  <li>Selecciona el XML exportado desde Salesforce. Entra ID completará de forma automática:
    <ul>
      <li><strong>Identificador (Entity ID):</strong> <code>https://&lt;tu-instancia&gt;.my.salesforce.com</code></li>
      <li><strong>URL de respuesta (ACS URL):</strong> <code>https://&lt;tu-instancia&gt;.my.salesforce.com?so=&lt;org_id&gt;</code></li>
      <li><strong>URL de cierre de sesión:</strong> Endpoint SAML Logout correspondiente.</li>
    </ul>
  </li>
  <li>Haz clic en <strong>Guardar</strong>.</li>
</ol>

<p>
  <img src="/images/SAML/SAML3.png" alt="Configuración básica de SAML en Entra ID tras importar los metadatos del SP" />
</p>

---

<h2>Capítulo 5: Habilitación de Dominio y Mapeo de Identidades (Federation ID)</h2>

<p>
  Una vez establecida la federación, se debe habilitar el botón de autenticación SSO en la pantalla de bienvenida de Salesforce y asociar los usuarios.
</p>

<h3>1. Habilitar Botón de Login SSO en Salesforce</h3>
<ol>
  <li>Navega a <strong>Configuración &gt; Mi dominio (My Domain) &gt; Configuración de la página de inicio de sesión</strong>.</li>
  <li>Haz clic en <strong>Modificar</strong> y activa la casilla correspondiente al proveedor de SSO configurado (<code>sts</code>).</li>
</ol>

<h3>2. Configurar Mapeo de Identidad (Federation ID)</h3>
<ol>
  <li>Navega a <strong>Configuración &gt; Usuarios &gt; Usuarios</strong>.</li>
  <li>Edita el usuario objetivo y en el campo <strong>ID de federación (Federation ID)</strong> ingresa el <code>UserPrincipalName</code> exacto registrado en Entra ID (ejemplo: <code>sso_lab@sysarmortech.com</code>).</li>
</ol>

<h3>3. Asignación de Usuarios en Entra ID</h3>
<p>
  En el portal de Entra ID, ingresa a la aplicación <code>Salesforce Dev Lab</code>, navega a <strong>Usuarios y grupos</strong> y asigna las cuentas o grupos autorizados para acceder.
</p>

<p>
  <img src="/images/SAML/SAML4.png" alt="Asignación de usuarios y grupos a la aplicación empresarial en Microsoft Entra ID" />
</p>

---

<h2>Capítulo 6: Validación de Flujos de Autenticación (SP vs IdP-Initiated)</h2>

<p>
  SAML 2.0 permite iniciar el flujo de autenticación desde la aplicación cliente (SP-Initiated) o desde el panel de aplicaciones del proveedor de identidad (IdP-Initiated).
</p>

<h3>Flujo SP-Initiated (Desde la URL de Salesforce)</h3>
<ol>
  <li>Abre una ventana de navegación de incógnito e ingresa a la URL personalizada de Salesforce: <code>https://&lt;tu-instancia&gt;.my.salesforce.com</code>.</li>
  <li>Haz clic en el botón del proveedor de SSO (<code>sts</code>).</li>
  <li>Serás redirigido al portal de Microsoft Entra ID para validar credenciales y MFA.</li>
  <li>Al autenticar exitosamente, serás redirigido al panel principal de Salesforce con la sesión iniciada.</li>
</ol>

<p>
  <img src="/images/SAML/SAML5.png" alt="Validación exitosa de sesión en el entorno Developer Edition de Salesforce mediante flujo SP-Initiated" />
</p>

<h3>Flujo IdP-Initiated (Desde el Portal de Microsoft)</h3>
<ol>
  <li>Abre una ventana en privado y accede a <a href="https://myapps.microsoft.com" target="_blank" rel="noopener noreferrer">myapps.microsoft.com</a>.</li>
  <li>Autentícate con las credenciales corporativas de Microsoft Entra ID.</li>
  <li>Haz clic en el icono de la aplicación <strong>Salesforce Dev Lab</strong>. La sesión se iniciará de forma transparente en Salesforce.</li>
</ol>

<p>
  <img src="/images/SAML/SAML6.png" alt="Panel de aplicaciones de Microsoft mostrando la aplicación Salesforce Dev Lab habilitada" />
</p>

---

<h2>Capítulo 7: Auditoría de Eventos y Hardening Zero Trust</h2>

<h3>1. Monitoreo y Registros de Inicio de Sesión (Sign-in Logs)</h3>
<p>
  Para auditar los tokens SAML emitidos y verificar intentos de acceso en Microsoft Entra ID:
</p>
<ol>
  <li>Navega a <strong>Monitoreo y mantenimiento &gt; Registros de inicio de sesión (Sign-in logs)</strong>.</li>
  <li>Filtra por la aplicación <code>Salesforce Dev Lab</code> y verifica las entradas con estado <strong>Éxito (Success)</strong>, analizando detalles de la aserción y dirección IP.</li>
</ol>

<p>
  <img src="/images/SAML/SAML7.png" alt="Consulta de registros de inicio de sesión de la aplicación empresarial en Microsoft Entra ID" />
</p>

<h3>2. Matriz de Hardening Recomendada (Zero Trust)</h3>

<div style="overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
    <thead>
      <tr style="background-color: #f1f5f9; text-align: left;">
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Control de Seguridad</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Mecanismo de Implementación</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">Objetivo Zero Trust</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Acceso Condicional</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Directiva de Entra ID P1/P2 dirigida a la Enterprise App</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Exigir MFA y evaluar nivel de riesgo en tiempo real antes de emitir la aserción SAML.</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Cumplimiento de Dispositivo</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Integración con Microsoft Intune (Device Compliance)</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Bloquear el acceso SSO desde endpoints no corporativos o marcados como Non-Compliant.</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Rotación de Certificados</strong></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Alertas programadas en Entra ID &gt; SAML Certificates</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Renovar el certificado de firma de aserciones antes de su vencimiento para prevenir interrupción de servicios.</td>
      </tr>
    </tbody>
  </table>
</div>

---

<h2>Conclusión</h2>

<p>
  La implementación de <strong>SSO mediante SAML 2.0 con Microsoft Entra ID</strong> consolida la arquitectura de identidad corporativa, elimina vectores de riesgo asociados al manejo local de credenciales y establece las bases para una postura de seguridad alineada al modelo <strong>Zero Trust</strong>.
</p>