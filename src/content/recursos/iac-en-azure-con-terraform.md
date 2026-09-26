---
title: "Infraestructura como Código (IaC): Tu Primer Despliegue en Azure con Terraform (Parte 1)"
description: "Guía técnica paso a paso para iniciar en Infrastructure as Code (IaC), instalar Terraform en Windows y realizar tu primer despliegue en Microsoft Azure."
pubDate: 2026-09-26
category: "Infraestructura TI"
author: "Alfredo Arévalo"
isFeatured: true
image: "/images/iac-azure-terraform/iac1.jpeg"
pdfUrl: "/docs/Infraestructura-IaC-con-Terraform-Parte1.pdf"
tags: ["Terraform", "Infrastructure as Code", "Azure", "DevOps", "SysArmor Tech"]
---

> **Enfoque técnico:** Infraestructura, Operación, Automatización y Arquitectura Limpia bajo estándares profesionales.

---

## Introducción

Si eres administrador de sistemas o ingeniero de infraestructura, lo más seguro es que estés acostumbrado a hacerlo todo a puro clic: entrar al Portal de Azure, hacer clic en "Crear recurso", rellenar formularios infinitos y cruzar los dedos para que todo quede documentado en un Excel que nadie lee.

Hoy vamos a cambiar eso. En este artículo veremos cómo dejar atrás los procesos manuales utilizando **Terraform** para desplegar infraestructura en la nube de forma repetible, limpia y profesional. Además, lo haremos pensando en un caso de uso real: preparar el terreno para un laboratorio de red *Hub-and-Spoke* en Azure sin gastar de más.

La administración moderna de infraestructura ha evolucionado desde configuraciones manuales realizadas en portales web hacia modelos completamente automatizados basados en código, un enfoque conocido como **Infrastructure as Code (IaC)**.

---

## ¿Qué es Infrastructure as Code (IaC)?

Infrastructure as Code es una práctica mediante la cual la infraestructura se define utilizando archivos de configuración legibles por humanos en lugar de configurarse de forma manual mediante interfaces gráficas.

### Comparativa de Modelos de Administración

| Característica | Administración Tradicional | Administración mediante IaC |
| :--- | :--- | :--- |
| **Método de despliegue** | Manual por interfaz gráfica (Portales web). | Automatizado mediante archivos de texto plano (`main.tf`, `variables.tf`, etc.). |
| **Reproducibilidad** | Baja; propenso a errores humanos y desvíos de configuración (*configuration drift*). | Alta; despliegues idénticos y repetibles garantizados. |
| **Control de cambios** | No documentado o delegado a hojas de cálculo externas. | Versionado nativo e histórico de cambios mediante Git. |

---

## ¿Qué es Terraform y por qué deberías usarlo?

**Terraform** es una herramienta de código abierto desarrollada por HashiCorp que permite definir infraestructura utilizando un lenguaje declarativo denominado **HCL (HashiCorp Configuration Language)**. 

En lugar de realizar clics, describes en texto plano lo que deseas construir. Terraform se encarga de interactuar con la API del proveedor de nube y calcular los pasos necesarios para que tu entorno real coincida exactamente con el código declarado.

### Ventajas Clave
* **Estabilidad de resultado (*Idempotencia*):** Si ejecutas el código múltiples veces y la infraestructura ya existe y es correcta, Terraform no realiza cambios innecesarios.
* **Control de versiones:** Toda la arquitectura vive en sistemas de control como Git, permitiendo auditorías rigurosas y reversiones (*rollbacks*) inmediatas[cite: 3].
* **Destrucción limpia:** Al concluir las pruebas, un comando centralizado elimina la totalidad de los recursos, evitando cargos imprevistos en la facturación mensual.

---

## Flujo general del proceso

El siguiente diagrama resume visualmente los pasos seguidos desde la descarga e instalación de las herramientas hasta la inicialización y validación del primer despliegue en Azure:

![Proceso de Instalación y Primer Despliegue de Terraform en Azure](/images/iac-azure-terraform/iac4.png)

---

## Instalación y Configuración del Entorno de Trabajo

Antes de escribir código, es necesario preparar la estación de trabajo administrativa asegurando las herramientas esenciales: **Azure CLI** y **Terraform CLI**.

### Requisitos Previos
* **Sistema Operativo:** Windows 11 (arquitectura de 64 bits / AMD64).
* **Permisos:** Privilegios de Administrador para modificar variables de entorno del sistema.
* **Terminal:** PowerShell o Windows Terminal.

### Procedimiento de Instalación del Binario
1. Descargue el ejecutable acorde a su arquitectura desde el sitio oficial de desarrollo de HashiCorp[cite: 3].
2. Extraiga y ubique el binario limpio `terraform.exe` en una ruta fija del sistema, por ejemplo: `C:\azure-hub-spoke-lab\Terraform`.
3. Registre la ruta en las **Variables de Entorno** del sistema (`Path`) para habilitar su ejecución global desde cualquier terminal.

![Configuración de la variable de entorno Path en Windows](/images/iac-azure-terraform/iac2.png)

### Verificación de la Instalación mediante PowerShell

Valide que el sistema reconozca el comando ejecutando la siguiente instrucción[cite: 3]:

powershell
terraform -version

![Verificación de la versión de Terraform en PowerShell](/images/iac-azure-terraform/iac3.png)

---

## Estructura de Directorios Limpia (Principios SOLID y Clean Code)

Para mantener un proyecto escalable y modular, evite concentrar toda la lógica en un único archivo plano Estructuraremos el proyecto de la siguiente forma:
---

```text
azure-hub-spoke-lab/
├── 📁 terraform/
│   ├── 📄 provider.tf
│   ├── 📄 variables.tf
│   ├── 📄 main.tf
│   └── 📄 outputs.tf

```
Ejecute los siguientes comandos en PowerShell para inicializar el directorio de trabajo:

mkdir C:\\azure-hub-spoke-lab\\terraform 

cd C:\\azure-hub-spoke-lab\\terraform

---

## Escribiendo la Primera Plantilla de Código

### Paso 1: Configurar el Proveedor (`provider.tf`)

Este archivo indica a Terraform los requisitos de versión y el proveedor de nube a utilizar (`azurerm`):

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

### Paso 2: Parametrizar Variables (`variables.tf`)

Desacople los valores estáticos utilizando un archivo de variables reutilizable:

variable "resource\_group\_name" {

  type        \= string

  description \= "Nombre del grupo de recursos principal para el laboratorio."

  default     \= "rg-hub-spoke-lab"

}

variable "location" {

  type        \= string

  description \= "Región de Azure donde se desplegarán los recursos."

  default     \= "eastus"

}

### Paso 3: Definir el Grupo de Recursos (`main.tf`)

Invoque las variables definidas para declarar el contenedor lógico principal:

resource "azurerm\_resource\_group" "rg\_lab" {

  name     \= var.resource\_group\_name

  location \= var.location

}

### Paso 4: Configurar Salidas (`outputs.tf`)

Exponga información relevante tras el despliegue para futuras integraciones:

output "resource\_group\_id" {

  description \= "ID único del grupo de recursos creado en Azure."

  value       \= azurerm\_resource\_group.rg\_lab.id

}

output "resource\_group\_name" {

  description \= "Nombre final asignado al grupo de recursos."

  value       \= azurerm\_resource\_group.rg\_lab.name

}

---

## El Flujo de Trabajo: Init, Plan y Apply

El ciclo de vida operativo de Terraform se compone de tres comandos fundamentales:

1. **Inicialización (`terraform init`):** Prepara el directorio de trabajo y descarga los plugins del proveedor de Azure.  
2. **Planificación (`terraform plan`):** Genera una vista previa exacta de los cambios que se aplicarán en la infraestructura.  
3. **Aplicación (`terraform apply`):** Ejecuta la creación real de los recursos en la suscripción tras la confirmación del operador.

---

## Lecturas Relacionadas y Complementarias

👉 Para continuar con la construcción de arquitecturas robustas en la nube, te invitamos a revisar nuestro artículo sobre el [Empaquetado y Despliegue de Aplicaciones Win32 con Microsoft Intune](http:///blog/empaquetado-despliegue-apps-win32-intune), donde aplicamos principios similares de automatización y despliegue desatendido en endpoints corporativos.