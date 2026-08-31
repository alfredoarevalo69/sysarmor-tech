---
title: "Manual de Subnetting IPv4: Guía Práctica y Método del Número Mágico"
description: "Domina el direccionamiento IPv4, máscaras CIDR y calcula subredes de forma rápida con el método del número mágico y ejemplos reales."
pubDate: 2026-08-30
category: "Redes & Infraestructura"
isFeatured: true
author: "SYSARMOR TECH"
image: "/images/subnetting/subnetting_blog.jpeg"
pdfUrl: "/blog/manual-subnetting-ipv4"
---

> **Autor:** SYSARMOR TECH  
> **Enfoque:** Infraestructura, Redes, Operación y Optimización  

---

## 1. Estructura de una dirección IPv4

Una dirección IPv4 consta de **32 bits**, divididos en **4 octetos** de 8 bits cada uno. Cada octeto opera en un rango decimal de `0` a `255` (2 a la 8 = 256 valores posibles).

* **Ejemplo de representación:** `192.168.1.1` -> `11000000 10101000 00000001 00001010`

---

## 2. Máscara de red y notación CIDR

La máscara de red delimita qué porción de bits pertenecen a la **Red** (1s) y cuáles al **Host** (0s).

| CIDR | Máscara Decimal | Bits Host | Hosts Totales | Hosts Útiles |
| :--- | :--- | :---: | :---: | :---: |
| **/24** | `255.255.255.0` | 8 | 256 | **254** |
| **/25** | `255.255.255.128` | 7 | 128 | **126** |
| **/26** | `255.255.255.192` | 6 | 64 | **62** |
| **/27** | `255.255.255.224` | 5 | 32 | **30** |
| **/28** | `255.255.255.240` | 4 | 16 | **14** |
| **/29** | `255.255.255.248` | 3 | 8 | **6** |
| **/30** | `255.255.255.252` | 2 | 4 | **2** |

> **Fórmula clave:** Hosts útiles = (Hosts totales) - 2 (se descuentan la dirección de red y la de broadcast).

---

## 3. Dirección de red, broadcast y hosts

Dado un bloque de direcciones asignado:
* **Dirección de red:** La primera IP del bloque (todos los bits de host configurados a 0).
* **Dirección de broadcast:** La última IP del bloque (todos los bits de host configurados a 1).
* **Hosts útiles:** El rango de direcciones utilizables comprendido estrictamente entre la red y el broadcast.

---

## 4. El método del número mágico

Este método acelera drásticamente el cálculo manual de subredes basándose en el tamaño del bloque.

### Paso 1: Calcular el tamaño del bloque
* **Fórmula:** Tamaño del bloque = 256 - valor del último octeto de la máscara.
* También puedes usar potencias de 2 cuando trabajas en el último octeto (CIDR mayor o igual a 24).

### Paso 2: Encontrar la dirección de red
Divide el último octeto de la IP entre el tamaño del bloque, trunca los decimales y vuelve a multiplicar por el tamaño del bloque:
* **Fórmula:** Red = truncar (último octeto / tamaño del bloque) × tamaño del bloque

> **Ejemplo práctico:** IP `205.16.37.44/28` (Bloque = `16`)
> * 44 / 16 = 2.75 -> trunca y queda en 2
> * 2 × 16 = 32
> * **Dirección de red:** `205.16.37.32`

### Paso 3: Calcular el broadcast
* **Fórmula:** Broadcast = Dirección de red + Tamaño del bloque - 1
* Siguiendo el ejemplo: 32 + 16 - 1 = 47 -> **Broadcast:** `205.16.37.47`

### Paso 4: Primer y último host útil
* **Primer host:** Dirección de red + 1 -> `205.16.37.33`
* **Último host:** Broadcast - 1 -> `205.16.37.46`

---

## 5. Tabla rápida de referencia CIDR

| CIDR | Máscara Último Octeto | Bloque | Múltiplos en Último Octeto | Hosts Útiles |
| :--- | :--- | :---: | :--- | :---: |
| **/24** | `0` | 256 | `0` | **254** |
| **/25** | `128` | 128 | `0, 128` | **126** |
| **/26** | `192` | 64 | `0, 64, 128, 192` | **62** |
| **/27** | `224` | 32 | `0, 32, 64, 96, 128, 160, 192, 224` | **30** |
| **/28** | `240` | 16 | `0, 16, 32, 48, ... 240` | **14** |
| **/29** | `248` | 8 | `0, 8, 16, 24, ... 248` | **6** |
| **/30** | `252` | 4 | `0, 4, 8, 12, ... 252` | **2** |

---

## 6. Consejos prácticos para ingeniería

* **Memoriza las potencias de 2:** `128, 64, 32, 16, 8, 4, 2, 1`. Son la base absoluta del subnetting.
* **Progresión CIDR:** Cada incremento de 1 en el CIDR divide el bloque exactamente a la mitad (/24 = 256, /25 = 128, /26 = 64, etc.).
* **Relación máscara-bloque:** Resta 256 menos el tamaño del bloque para obtener el valor del último octeto de la máscara (Ej: Bloque 16 -> 256 - 16 = 240 -> `255.255.255.240`).
* **Validación de Red:** Una IP es dirección de red válida si su último octeto es un múltiplo exacto del tamaño del bloque.
* **CIDR menores a 24:** El cálculo se desplaza a los octetos anteriores aplicando el mismo principio de bloques en el tercer octeto.

---

## 7. Ejemplos resueltos paso a paso

### Ejemplo 1: Prefijo /28 sobre IP `192.168.1.45`
| Concepto | Cálculo / Operación | Resultado |
| :--- | :--- | :--- |
| **Máscara** | `255.255.255.240` | `-` |
| **Bloque** | 256 - 240 = 16 | `-` |
| **Red** | truncar(45 / 16) × 16 -> 2 × 16 | `192.168.1.32` |
| **Broadcast** | 32 + 16 - 1 | `192.168.1.47` |
| **1er Host Útil** | 32 + 1 | `192.168.1.33` |
| **Último Host Útil**| 47 - 1 | `192.168.1.46` |

### Ejemplo 2: Prefijo /26 sobre IP `10.50.100.135`
| Concepto | Cálculo / Operación | Resultado |
| :--- | :--- | :--- |
| **Máscara** | `255.255.255.192` | `-` |
| **Bloque** | 256 - 192 = 64 | `-` |
| **Red** | truncar(135 / 64) × 64 -> 2 × 64 | `10.50.100.128` |
| **Broadcast** | 128 + 64 - 1 | `10.50.100.191` |
| **1er Host Útil** | 128 + 1 | `10.50.100.129` |
| **Último Host Útil**| 191 - 1 | `10.50.100.190` |

### Ejemplo 3: Prefijo /30 (Enlaces Punto a Punto) sobre IP `172.16.0.9`
| Concepto | Cálculo / Operación | Resultado |
| :--- | :--- | :--- |
| **Máscara** | `255.255.255.252` | `-` |
| **Bloque** | 256 - 252 = 4 | `-` |
| **Red** | truncar(9 / 4) × 4 -> 2 × 4 | `172.16.0.8` |
| **Broadcast** | 8 + 4 - 1 | `172.16.0.11` |
| **1er Host Útil** | 8 + 1 | `172.16.0.9` |
| **Último Host Útil**| 11 - 1 | `172.16.0.10` |

### Ejemplo 4: Prefijo /27 sobre IP `192.168.10.85`
| Concepto | Cálculo / Operación | Resultado |
| :--- | :--- | :--- |
| **Máscara** | `255.255.255.224` | `-` |
| **Bloque** | 256 - 224 = 32 | `-` |
| **Red** | truncar(85 / 32) × 32 -> 2 × 32 | `192.168.10.64` |
| **Broadcast** | 64 + 32 - 1 | `192.168.10.95` |
| **1er Host Útil** | 64 + 1 | `192.168.10.65` |
| **Último Host Útil**| 95 - 1 | `192.168.10.94` |

---

## 8. Ejercicios propuestos de práctica

Pon a prueba tus habilidades calculando la **Red, Broadcast, Primer Host y Último Host** para los siguientes escenarios:

1. `192.168.1.130/25`
2. `10.0.0.45/27`
3. `172.16.5.200/26`
4. `192.168.50.17/28`
5. `10.10.10.10/30`
6. `203.0.113.75/29`
7. `198.51.100.150/27`

---

## Herramientas de Automatización

¿Prefieres validar tus resultados de forma automática o diseñar esquemas VLSM complejos para múltiples VLANs? Utiliza nuestra herramienta interactiva:

👉 [Acceder a la Calculadora VLSM Guiada](/tools/vlsm)