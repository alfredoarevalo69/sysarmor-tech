---
title: "Optimización de DNS en Active Directory: Arquitectura Hub & Spoke para Entornos Híbridos Multi-Sitio"
description: "Caso práctico de diseño, configuración y hardening de DNS en Active Directory sobre EDC, IDC y Azure."
pubDate: 2026-08-14
category: "Infraestructura TI"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/dns-architecture.png"
pdfUrl: "/docs/optimizacion-dns-active-directory-hub-spoke-hibrido.pdf"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Operación, Seguridad e Innovación  

---

## Introducción

En entornos empresariales y gubernamentales, el crecimiento de la infraestructura suele llevar a topologías híbridas complejas donde conviven Data Centers locales (EDC e IDC), entornos de Nube Pública (Azure) y servidores con sistemas operativos legacy (Windows Server 2012 hasta 2025).

El desafío inicial abordado en este proyecto fue reestructurar una topología de resolución DNS descentralizada y corregir deudas técnicas de seguridad en Active Directory, eliminando puntos únicos de falla y riesgos de aislamiento de servicios.

> **Resumen Ejecutivo:** Muchas empresas configuran mal el servicio DNS en sus controladores de dominio, apuntando a servidores públicos de forma indiscriminada sin comprender la lógica de los reenviadores ni de los *root hints*. Esto genera fallos intermitentes en la autenticación Kerberos, retrasos en la replicación de objetos y degradación de servicios críticos. Este documento busca dar una guía clara y segura sobre este tema.

---

## Capítulo 1: Topología Inicial y Diagnóstico Técnico

> **Nota de privacidad:** Los nombres de servidores, sitios y controladores han sido modificados para proteger la identidad de la organización.

La arquitectura estaba distribuida a través de tres sitios clave:
*   **Azure (Cloud):** 1 Controlador de Dominio (`DCCloud1`) conectado por VPN de forma segura.
*   **Sitio Principal / Centro de datos perimetral (EDC Enterprise / Edge Data Center):** 3 Controladores de Dominio (`DCppal1`, `DCppal2`, `DCppal3`) enlazados por Safe Link interno.
*   **Sitio Respaldo (IDC Internet Data Center):** 3 Controladores de Dominio (`DCRep1`, `DCRep2`, `DCRep3`) conectados por WAN Link cifrado (IPSec).

La siguiente imagen muestra el punto de partida de la infraestructura que fue revisada con el fin de mejorar y optimizar su funcionamiento:

![Topología Inicial de Resolución DNS en Active Directory](/images/dns-hub-spoke-1.png)

---

## Capítulo 2: Escenario Real y Diagnóstico de la Problemática

La siguiente configuración que se muestra en la imagen es una configuración estándar para una salida directa a Internet, pero en entornos empresariales (especialmente si manejas controladores de dominio o infraestructuras híbridas), hay varios puntos de eficiencia que se deberían considerar.

Esta es la configuración DNS en un DC haciendo reenvío a nube:

![Configuración Estándar de Forwarders en Consola DNS](/images/dns-hub-spoke-2.png)

### Diagnóstico de Problemas Comunes en la Topología Inicial

Esta arquitectura generaba inconsistencias de resolución y retrasos en la replicación:

*   **Inconsistencia de Resolución y Split-Brain DNS:**
    *   *El Problema:* Al no existir zonas integradas ni reenvíos estructurados entre sitios, cada servidor DNS mantenía una visión parcial de la red.
    *   *Impacto:* Las estaciones recibían respuestas inconsistentes según el DC que las atendiera, fallando al consultar recursos locales o delegados.
*   **Zonas Incompletas y "Huecos" en la Resolución Externa:**
    *   *El Problema:* Crear zonas primarias locales para mitigar la falta de reenvío generaba vacíos para dominios de Internet.
    *   *Impacto:* Consultas a subdominios específicos fallaban al no contar con reenvíos condicionales limpios hacia el exterior. Generaba un esfuerzo grande en administración por la creación y eliminación de registros externos.
*   **Replicación Lenta y Falta de Convergencia:**
    *   *El Problema:* La propagación de registros clave de AD (como los registros SRV de Kerberos y Netlogon) era lenta entre sitios.
    *   *Impacto:* Los clientes consultaban DCs con información obsoleta (*stale records*). La necesidad de forzar la replicación manual (`repadmin /syncall`) se había vuelto una rutina operativa. Los cambios se demoraban en hacerse efectivos generando alto impacto en la respuesta oportuna.
*   **Fragmentación de Consultas y Latencia Innecesaria:**
    *   *El Problema:* Cada sitio reenviaba consultas a la nube de forma independiente y no sincronizada.
    *   *Impacto:* Se desperdiciaba la caché local, aumentando la latencia y el consumo repetitivo de ancho de banda en los enlaces VPN.
*   **Alta Dependencia de Internet para la Operación Interna:**
    *   *El Problema:* Al no existir comunicación directa de DNS entre sitios locales (EDC e IDC), la resolución dependía del estado de la nube.
    *   *Impacto:* Caídas temporales en la VPN o el ISP dejaban a los usuarios sin capacidad de resolver recursos locales del otro datacenter. En algunos casos la navegación se tornaba lenta haciendo que se culpara a la red WIFI.

---

## Capítulo 3: Configuración Recomendada: Arquitectura "DNS Hub & Spoke"

Se tomó el controlador `DCppal1` como **DNS HUB** de la arquitectura, encargado de centralizar la resolución de consultas externas.

### Configuración Recomendada de Forwarders por Sitio (Modelo Hub & Spoke)

Con el objetivo de mantener la alta disponibilidad y evitar bucles de resolución, en la pestaña **Forwarders** de la consola DNS se realizó la siguiente configuración según el rol del servidor:

*   **Servidores HUBS (`DCppal1` en EDC):** Al ser los nodos centrales autorizados para resolver consultas externas, sus Forwarders apuntan directamente a resolutores públicos de alta velocidad y seguridad:
    *   *Forwarder 1:* `1.1.1.1` (Cloudflare - Baja latencia)
    *   *Forwarder 2:* `9.9.9.9` (Quad9 - Filtrado de Malware/Phishing)
    *   *Forwarder 3:* `8.8.8.8` (Google - Respaldo)
*   **Servidores Satélites (EDC Secundarios e IDC):** No deben consultar a Internet directamente. Sus *Forwarders* en la consola DNS deben apuntar internamente a los *HUBS Centrales* (`DCppal1`). Esto centraliza la caché local y optimiza el uso del ancho de banda WAN.
*   **Sitio AZURE (`DCCloud1`):** Al residir en la nube, debe priorizar la infraestructura nativa de Azure para no romper integraciones PaaS/IaaS:
    *   *Forwarder 1:* `168.63.129.16` (IP virtual del DNS recursivo de Azure)
    *   *Forwarder 2:* `1.1.1.1` o IP de los Hubs locales a través de la VPN.

> **Nota de Arquitectura:** Los DC internos del dominio no deben configurarse como Forwarders para resolver las zonas propias de Active Directory. La resolución de las zonas integradas en AD se realiza mediante las zonas DNS integradas y replicadas en Active Directory. En el modelo Hub & Spoke propuesto, `DCppal1` puede actuar como Forwarder interno para los servidores satélite cuando se busca centralizar la resolución de consultas externas.

### ¿Por qué no veo servidores internos ahí?
Los DC internos del dominio no se utilizan como Forwarders para resolver las zonas propias de Active Directory:
*   **Replicación de AD:** Si son otros DCs, la resolución se hace mediante la partición del Directorio Activo (Zonas integradas).
*   **DNS del Cliente:** El servidor `DCppal1` (en su configuración de red de Windows) debería tener como DNS primario la IP de otro DC y como secundario su propia IP (`127.0.0.1`), pero nunca en la pestaña de Forwarders, ya que esto podría causar bucles de recursión.

---

## Capítulo 4: Conceptos Clave y Hardening Avanzado

### ¿Qué son los Root Hints o Forwarders?

Tener marcada la opción *"Use root hints if no forwarders are available"*.
*   **Escenario:** Si Google falla o tarda en responder, tu servidor intentará contactar a los 13 servidores raíz del mundo (`a.root-servers.net`, etc.).
*   **Consejo:** Mantén esto activado. Es tu último recurso para que la navegación no se caiga si los forwarders de Google presentan problemas de *peering*.

### El flujo ideal de resolución:
1. **Cache Local:** ¿Lo sé yo?
2. **Zonas Integradas en AD:** ¿Está en mi base de datos replicada?
3. **Conditional Forwarders:** ¿Es para un dominio específico de mi empresa en otra oficina/nube?
4. **Forwarders:** ¿Es algo de internet? (Aquí es donde entra Google/Cloudflare).

### Configuración de la Tarjeta de Red (NIC)

Para que el DNS sea robusto en esta infraestructura:
*   **DNS Primario:** IP de otro DC del mismo sitio.
*   **DNS Secundario:** IP de un DC de un sitio distinto (ej. EDC apunta a IDC).
*   **DNS Terciario:** `127.0.0.1` (Loopback). Nunca pongas IPs externas (`8.8.8.8`) en la configuración de la tarjeta de red de un Domain Controller; eso solo va en la consola de DNS.

![Configuración de Tarjeta de Red en DCppal1](/images/dns-hub-spoke-3.png)

### Puntos claves - Resumen:

1. El HUB DNS (DCppal1) es el único nodo autorizado para reenviar consultas generales de Internet. Los DC satélites no realizan consultas directas a Internet; utilizan el HUB para este propósito. Esto centraliza el caché y la seguridad, para el caso del DC de Azure, Este servidor debe priorizar la infraestructura de la nube, pero conocer a los Hubs.

2. Se debe mantener una jerarquía interna de DNS primero antes que sea externa, en este caso como se tenían otros servidores DNS internos (otros Domain Controllers), lo ideal es que los servidores en sitios remotos apunten primero a los DNS centrales de tu infraestructura antes de salir a Internet, Por qué: Para resolver zonas privadas compartidas que no están replicadas en AD pero sí existen en otros segmentos de la red.

3. Uso de Condicionales (Conditional Forwarders), En lugar de mandar todo a Google, utiliza Conditional Forwarders para dominios específicos (ej. dominios de socios, servicios en la nube específicos o sucursales), Principio: Interface Segregation. No inundes tus forwarders generales con consultas que tienen un destino conocido.

4. Limpieza de IPv6, algunos controladores tenían configurados los DNS IPv6 de Google, lo cual generaba un retraso más porque la infraestructura interna no tiene un direccionamiento IPv6 sólido y ruteable de extremo a extremo, estas consultas a veces generan un timeout innecesario antes de reintentar por IPv4, se debe tener esta recomendación. Si no se usa IPv6 activamente en la red local para navegación, es mejor quitar las IPs IPv6 de los Forwarders o desmarcar el protocolo IPv6 en las propiedades de la consulta DNS, pero NO desmarcar/deshabilitar la casilla de IPv6 en la tarjeta de red (NIC) de Windows Server, que se busca evitar latencias de "fallback".

---

## Capítulo 5: Arquitectura DNS Propuesta - Modelo Hub & Spoke

La siguiente imagen fue nuestra configuración definitiva que mejoró notablemente los problemas mencionados:

![Arquitectura DNS Propuesta - Modelo Hub y Spoke](/images/dns-hub-spoke-4.png)

---

## Capítulo 6: Herramientas de Validación DNS

Para validar y diagnosticar el servicio DNS en Windows Server, se cuenta con herramientas nativas de consola, comandos y visualizadores de eventos integrados en el sistema operativo que permiten comprobar la resolución de nombres, el estado de Active Directory y los registros de auditoría:

*   **`dcdiag`:** Prueba la salud del DNS y detecta errores de replicación. Ejecutando `dcdiag /test:dns` valida de forma integral el registro de registros vitales y la salud del DNS en Active Directory.
*   **`nslookup`:** Utilidad de línea de comandos para realizar consultas interactivas o directas a un servidor DNS y comprobar registros específicos (A, MX, PTR), internamente y externamente.
*   **Visor de eventos (`Event Viewer`):** Permite auditar cambios de configuración, transferencias de zona y eventos operativos mediante la ruta `Microsoft > Windows > DNS-Server`.
*   **PowerShell:** Cmdlets para auditar y ajustar configuraciones.
*   **`ipconfig`:** Comando auxiliar para refrescar o registrar dinámicamente la configuración IP y los registros del host con `ipconfig /registerdns`.
*   **Consola DNS (`DNS Manager`):** Interfaz gráfica desde el Administrador del servidor para verificar el estado de las zonas de búsqueda directa y reversa, reenvíos y la configuración general.