// src/data/cloudData.js
export const cloudData = [
    // --- REDES (VPC / VNet) ---
    {
        category: "Redes (VPC / VNet)",
        aws: "Amazon VPC",
        azure: "Virtual Network (VNet)",
        gcp: "VPC Network",
        desc: "Red virtual aislada lógicamente en la nube. Permite configurar tablas de rutas, subredes públicas/privadas y compuertas de enlace."
    },
    {
        category: "Redes (VPC / VNet)",
        aws: "Transit Gateway",
        azure: "Virtual WAN / Hub-Spoke",
        gcp: "Network Connectivity Center",
        desc: "Arquitectura centralizada de tránsito para interconectar múltiples redes virtuales y sedes locales a gran escala."
    },
    {
        category: "Redes (VPC / VNet)",
        aws: "AWS Route 53",
        azure: "Azure DNS / Private DNS Zones",
        gcp: "Cloud DNS",
        desc: "Servicio de nombres de dominio (DNS) escalable y altamente disponible con capacidades de resolución pública y privada."
    },
    {
        category: "Redes (VPC / VNet)",
        aws: "NAT Gateway",
        azure: "NAT Gateway",
        gcp: "Cloud NAT",
        desc: "Permite que los recursos en una subred privada se conecten a internet de forma saliente bloqueando conexiones entrantes."
    },

    // --- REDES & CONTENT DELIVERY ---
    {
        category: "Redes & Content Delivery",
        aws: "AWS Application Load Balancer (ALB)",
        azure: "Azure Application Gateway",
        gcp: "Google Cloud HTTP(S) Load Balancer",
        desc: "Controlador de entrega de aplicaciones de Capa 7 con terminación SSL/TLS y enrutamiento basado en rutas."
    },
    {
        category: "Redes & Content Delivery",
        aws: "Amazon CloudFront",
        azure: "Azure Front Door / CDN",
        gcp: "Cloud CDN / Media CDN",
        desc: "Red de entrega de contenido (CDN) global para acelerar la entrega segura de contenido estático y dinámico."
    },
    {
        category: "Redes & Content Delivery",
        aws: "AWS Direct Connect",
        azure: "Azure ExpressRoute",
        gcp: "Google Cloud Interconnect",
        desc: "Conexiones de red privadas y dedicadas de alta velocidad que omiten la red pública de internet."
    },

    // --- CÓMPUTO ---
    {
        category: "Cómputo",
        aws: "Amazon EC2",
        azure: "Virtual Machines",
        gcp: "Compute Engine",
        desc: "Instancias de máquinas virtuales escalables en la nube con soporte para sistemas operativos Windows Server y Linux."
    },
    {
        category: "Cómputo",
        aws: "AWS Auto Scaling",
        azure: "Virtual Machine Scale Sets (VMSS)",
        gcp: "Managed Instance Groups (MIGs)",
        desc: "Escalado automático y balanceo de carga para grupos de máquinas virtuales basándose en métricas de rendimiento."
    },
    {
        category: "Cómputo",
        aws: "AWS Lambda",
        azure: "Azure Functions",
        gcp: "Cloud Functions",
        desc: "Plataforma de computación sin servidor (Serverless) orientada a eventos para ejecutar código sin administrar infraestructura."
    },
    {
        category: "Cómputo",
        aws: "Amazon Elastic Beanstalk",
        azure: "App Service",
        gcp: "App Engine",
        desc: "Plataforma como servicio (PaaS) para desplegar y escalar aplicaciones web y servicios sin gestionar la infraestructura subyacente."
    },

    // --- CÓMPUTO & CONTENEDORES ---
    {
        category: "Cómputo & Contenedores",
        aws: "Amazon Elastic Kubernetes Service (EKS)",
        azure: "Azure Kubernetes Service (AKS)",
        gcp: "Google Kubernetes Engine (GKE)",
        desc: "Servicio administrado de Kubernetes para despliegue, escalado y gestión de contenedores a gran escala."
    },
    {
        category: "Cómputo & Contenedores",
        aws: "AWS Fargate",
        azure: "Azure Container Instances (ACI)",
        gcp: "Google Cloud Run (Modo Contenedor)",
        desc: "Contenedores sin servidor bajo demanda, eliminando la necesidad de gestionar máquinas virtuales o nodos subyacentes."
    },
    {
        category: "Cómputo & Contenedores",
        aws: "Amazon Elastic Container Registry (ECR)",
        azure: "Azure Container Registry (ACR)",
        gcp: "Artifact Registry",
        desc: "Registro de contenedores totalmente administrado para almacenar, gestionar y desplegar imágenes Docker y OCI."
    },

    // --- ALMACENAMIENTO ---
    {
        category: "Almacenamiento",
        aws: "Amazon S3",
        azure: "Blob Storage",
        gcp: "Cloud Storage",
        desc: "Almacenamiento de objetos altamente disponible y seguro para respaldos, archivos estáticos, discos duros virtuales y logs."
    },
    {
        category: "Almacenamiento",
        aws: "Amazon FSx (SMB) / Amazon EFS",
        azure: "Azure Files",
        gcp: "Google Filestore",
        desc: "Recursos compartidos de archivos totalmente administrados basados en los protocolos estándar SMB y NFS."
    },
    {
        category: "Almacenamiento",
        aws: "Amazon Elastic Block Store (EBS)",
        azure: "Azure Disk Storage (Managed Disks)",
        gcp: "Google Persistent Disk",
        desc: "Volúmenes de almacenamiento en bloque de alto rendimiento y durabilidad diseñados para máquinas virtuales."
    },
    {
        category: "Almacenamiento",
        aws: "AWS Storage Gateway / Backup",
        azure: "Azure Backup / Recovery Services Vault",
        gcp: "Cloud Backup and DR",
        desc: "Soluciones unificadas de respaldo empresarial, recuperación ante desastres y pasarelas de almacenamiento híbrido."
    },

    // --- BASES DE DATOS ---
    {
        category: "Bases de Datos",
        aws: "Amazon RDS",
        azure: "Azure SQL Database / Database for PostgreSQL",
        gcp: "Cloud SQL",
        desc: "Bases de datos relacionales administradas que automatizan parches, respaldos, replicación y alta disponibilidad."
    },
    {
        category: "Bases de Datos",
        aws: "Amazon Aurora",
        azure: "Azure Cosmos DB (con SQL API) / Hyperscale",
        gcp: "Cloud Spanner",
        desc: "Bases de datos relacionales y distribuidas de alto rendimiento orientadas a cargas de trabajo empresariales masivas."
    },
    {
        category: "Bases de Datos",
        aws: "Amazon DynamoDB",
        azure: "Azure Cosmos DB",
        gcp: "Cloud Spanner / Firestore",
        desc: "Bases de datos NoSQL distribuidas globalmente orientadas a ofrecer baja latencia multirregión."
    },
    {
        category: "Bases de Datos",
        aws: "Amazon ElastiCache",
        azure: "Azure Cache for Redis",
        gcp: "Memorystore",
        desc: "Servicios de caché en memoria totalmente administrados compatibles con Redis y Memcached para acelerar aplicaciones."
    },

    // --- IDENTIDAD Y ACCESO ---
    {
        category: "Identidad y Acceso",
        aws: "AWS IAM / AWS IAM Identity Center",
        azure: "Microsoft Entra ID (Azure AD)",
        gcp: "Cloud IAM",
        desc: "Gestión centralizada de identidades, autenticación multifactor (MFA), políticas de acceso basado en roles (RBAC) y federación."
    },
    {
        category: "Identidad y Acceso",
        aws: "AWS Directory Service",
        azure: "Azure Active Directory Domain Services (AADDS)",
        gcp: "Managed Microsoft AD",
        desc: "Servicios de directorio completamente administrados compatibles con Active Directory tradicional para cargas de Windows."
    },

    // --- SEGURIDAD Y FIREWALL ---
    {
        category: "Seguridad y Firewall",
        aws: "AWS WAF / Shield",
        azure: "Azure Firewall / DDoS Protection",
        gcp: "Cloud Armor",
        desc: "Protección perimetral avanzada contra ataques de denegación de servicio (DDoS) y filtrado de tráfico web basado en reglas."
    },
    {
        category: "Seguridad y Firewall",
        aws: "AWS Key Management Service (KMS) / Secrets Manager",
        azure: "Azure Key Vault",
        gcp: "Google Cloud KMS / Secret Manager",
        desc: "Almacenamiento centralizado y seguro de secretos, claves criptográficas y certificados SSL/TLS."
    },
    {
        category: "Seguridad y Firewall",
        aws: "Amazon GuardDuty / Inspector",
        azure: "Microsoft Defender for Cloud",
        gcp: "Security Command Center",
        desc: "Plataformas de protección de cargas de trabajo en la nube (CWPP) y detección inteligente de amenazas mediante IA."
    },

    // --- SERVERLESS & MENSAJERÍA ---
    {
        category: "Serverless & Mensajería",
        aws: "Amazon SQS / Amazon SNS",
        azure: "Azure Service Bus",
        gcp: "Cloud Pub/Sub",
        desc: "Sistemas de colas de mensajes y publicación/suscripción empresariales para arquitecturas desacopladas y microservicios."
    },
    {
        category: "Serverless & Mensajería",
        aws: "Amazon EventBridge",
        azure: "Azure Event Grid",
        gcp: "Eventarc",
        desc: "Enrutador de eventos sin servidor que conecta aplicaciones usando eventos de servicios de nube y aplicaciones personalizadas."
    },
    {
        category: "Serverless & Mensajería",
        aws: "AWS Step Functions",
        azure: "Azure Logic Apps",
        gcp: "Cloud Workflows",
        desc: "Orquestador de flujos de trabajo sin servidor y microservicios para coordinar tareas complejas y sistemas distribuidos."
    },

    // --- GOBERNANZA, MONITOREO Y DevOps ---
    {
        category: "Monitoreo y DevOps",
        aws: "Amazon CloudWatch",
        azure: "Azure Monitor / Application Insights",
        gcp: "Cloud Monitoring / Logging",
        desc: "Recopilación integral de métricas, registros (logs), paneles de control y alertas para supervisar la salud de los sistemas."
    },
    {
        category: "Monitoreo y DevOps",
        aws: "AWS CloudTrail",
        azure: "Azure Activity Log / Monitor",
        gcp: "Cloud Audit Logs",
        desc: "Registro de auditoría y trazabilidad de todas las llamadas a la API y acciones administrativas realizadas en la plataforma."
    },
    {
        category: "Monitoreo y DevOps",
        aws: "AWS Organizations / Control Tower",
        azure: "Azure Management Groups / Policy",
        gcp: "Resource Manager / Organization Policies",
        desc: "Gestión jerárquica multicuenta, aplicación de políticas de cumplimiento normativo y gobierno corporativo."
    }
];