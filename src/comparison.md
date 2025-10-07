# Comparison between ACA and AKS

||AKS|ACA|
|---|:---:|:---:|
| Complexity | High | Low |
| Portability | High | Low, containers are the same but manifests are not portable |
| **Resiliency** |||
|SLA| free SLO of 99,5% and SLA of 99.95% with [Premium SKU](https://learn.microsoft.com/en-us/azure/aks/uptime-sla)| SLA of [99.95%](https://azure.microsoft.com/fr-fr/support/legal/sla/container-apps/v1_0/)|
|Multi-AZ support| Yes, manually during [cluster creation](https://learn.microsoft.com/en-us/azure/aks/availability-zones)| Yes, built-in|
| **Operations** |||
| Control plane| Control plane managed by Azure | Control/Data plane abstracted from Azure. wrapper around API server (no access to kubectl command) |
| Data plane | managed by user by creating nodepools| Serverless and fully managed|
| Upgrade management | Manual or [automated](https://learn.microsoft.com/en-us/azure/aks/auto-upgrade-cluster) | Fully managed|
| **Autoscaling** |||
| Cluster Autoscaling |Yes, with [cluster autoscaler](https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler) | Yes, automatic|
| Basic workload autoscaling | Yes, out-of-the-box with metric server in combination with [HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) | Yes, with [scaling rules](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Advanced workload autoscaling |Can be done by deploying [KEDA](https://keda.sh)| Yes, out-of-the-box with [built-in KEDA](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Limits | Almost no limit in terms of number of pods| App scaling is limited to [300 replicas](https://learn.microsoft.com/en-us/azure/container-apps/quotas) |
| Scale to Zero | Possible but requires custom configuration | Yes, [native support](https://learn.microsoft.com/en-us/azure/container-apps/scale-app) with configurable scale-to-zero behavior |
| **Workloads** |||
| Operating systems | Support Linux/Windows based container | Supports only Linux based container images|
| Compute configuration| Virtually unlimited to any configuration (also support [dynamic sizing](https://learn.microsoft.com/en-us/azure/aks/node-autoprovision?tabs=azure-cli) | [Support a predefined list of VM SKU with Workload Profile](https://learn.microsoft.com/en-us/azure/container-apps/workload-profiles-overview) |
| memory-optimized Compute | Yes, using [Memory dedicated nodes](https://learn.microsoft.com/en-us/azure/virtual-machines/dv2-dsv2-series-memory) | yes using [dedicated workflow profiles](https://learn.microsoft.com/en-us/azure/container-apps/workload-profiles-overview#profile-types) |
| GPU Compute | Yes, using [GPU dedicated nodes](https://learn.microsoft.com/en-us/azure/aks/gpu-cluster) | [GPU supported via Workload Profile](https://learn.microsoft.com/en-us/azure/container-apps/workload-profiles-overview#profile-types)|
| Confidential Compute | Yes, using [SGX dedicated nodes](https://learn.microsoft.com/en-us/azure/confidential-computing/confidential-nodes-aks-overview) | No confidential compute support|
| Azure Arc Compatible | [Yes](https://learn.microsoft.com/en-us/azure/aks/aksarc/aks-overview)  | [Yes](https://learn.microsoft.com/en-gb/azure/container-apps/azure-arc-overview) |
| **Network** |||
| Service Mesh | Yes, supports [Istio](https://learn.microsoft.com/en-us/azure/aks/istio-about), Linkerd, and other CNCF service meshes | No standalone service mesh, built-in Envoy proxy for ingress |
| mTLS communication | No OOB mTLS support in pods. Can be done by installing Dapr or a service mesh| OOB support for mTLS with dapr integration (need configuration) |
| Internal | Native usage of network policies | No network segmentation within the same environment |
| VNet integration | Yes, built-in | Yes, built-in |
| Private Endpoint | Private mode at the control plan level (AKS Admin) and for the data plane you can use a private load balancer | Yes on the [Container App Environment](https://learn.microsoft.com/en-gb/azure/container-apps/networking#private-endpoint) at the data plane level|
| HTTP Ingress | Yes, built-in (Envoy)| Yes |
| TCP ingress |  Yes | [Yes](https://learn.microsoft.com/en-us/azure/container-apps/ingress?tabs=bash#tcp) |
| Controlling egress traffic with Firewall | Yes [limit egress traffic](https://learn.microsoft.com/en-us/azure/aks/limit-egress-traffic) | Yes  [limit egress traffic](https://learn.microsoft.com/en-us/azure/container-apps/networking#user-defined-routes-udr---preview) |
| Traffic management | Yes, but nothing OOB | Native [traffic management](https://learn.microsoft.com/en-us/azure/container-apps/networking) |
| Traffic Splitting (Blue/Green, Canary) | Yes, with service mesh or ingress controllers | Yes, [native traffic splitting](https://learn.microsoft.com/en-us/azure/container-apps/revisions-manage) between revisions |
| Custom Domains | Yes, with Ingress controllers | Yes, [built-in support](https://learn.microsoft.com/en-us/azure/container-apps/custom-domains-certificates) |
| Web Application Firewall (WAF) | Yes, via [Application Gateway](https://learn.microsoft.com/en-us/azure/aks/app-gateway-ingress) or Azure Front Door | Yes, via [Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview) integration |
| Session affinity | Yes, [built-in in kubernetes](https://kubernetes.io/docs/reference/networking/virtual-ips/#session-affinity)| Yes, [built-in](https://learn.microsoft.com/en-us/azure/container-apps/sticky-sessions?pivots=azure-portal) |
| **Security** |||
| Injecting identities into workloads | Yes, with [workloads identities](https://azure.github.io/azure-workload-identity) | OOB [supported](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity) |
| Authentication and authorization | Yes but manually with services meshes or [components](https://github.com/Azure/EasyAuthForK8s) | Yes, [native](https://learn.microsoft.com/en-us/azure/container-apps/authentication). Integration with AAD, Facebook, Twitter & Google|
|Secret management | Secret management via CSI driver (i.e. Azure KeyVault or HashiCorp Vault) | [Key-value management](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets), no integration with KeyVault|
| Security Policy| Rich, with Gatekeeper and Azure Policies| Limited to some [configuration policies](https://learn.microsoft.com/en-us/azure/container-apps/policy-reference) |
| Runtime scanning | Yes, natively with Defender for Containers or any 3rd party runtime | No, maybe later|
| Container Sandbox environment | No | Yes [Dynamic sessions](https://learn.microsoft.com/en-us/azure/container-apps/sessions) use full for AI workload for instance  |
| Managed certificates | Can be done based on [AppConfig for instance](https://learn.microsoft.com/en-us/azure/aks/app-routing-dns-ssl) | Yes [Free managed certificates](https://learn.microsoft.com/en-gb/azure/container-apps/custom-domains-managed-certificates?pivots=azure-portal) |
| Support Azure Key Vault Certificates | [Yes](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver) | [Yes at the environment level](https://learn.microsoft.com/en-us/azure/container-apps/key-vault-certificates-manage) |
| **Storage & Persistence** |||
| Persistent Volumes | Yes, supports Azure Disk, Azure Files, NFS, and many [CSI drivers](https://learn.microsoft.com/en-us/azure/aks/csi-storage-drivers) | Limited, supports [Azure Files](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts) via volume mounts |
| Ephemeral Storage | Yes, configurable per pod | Yes, with [temporary storage](https://learn.microsoft.com/en-us/azure/container-apps/containers#temporary-storage) |
| StatefulSets | Yes, native Kubernetes StatefulSets | No native support, workarounds needed |
| **Container Registry** |||
| Azure Container Registry (ACR) Integration | Yes, [native integration](https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration) with managed identity | Yes, [native integration](https://learn.microsoft.com/en-us/azure/container-apps/containers#container-registries) |
| Private Registry Support | Yes, any private registry | Yes, any private registry with credentials |
| Image Pull Secrets | Yes, Kubernetes secrets | Yes, managed through container app settings |
| **Development** |||
| Dapr Integration | Yes, requires [manual installation](https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/) | Yes, [built-in managed Dapr](https://learn.microsoft.com/en-us/azure/container-apps/dapr-overview) |
|Service discovery|Yes, with Kubernetes DNS or by installing Dapr|Yes, built-in with Dapr and native service discovery|
| Type of workload| Almost anything (web apps, batch jobs, ML workloads, databases, etc.)| Microservices, Event-driven applications, Jobs, small web applications|
| Jobs Support | Yes, native Kubernetes [Jobs and CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/) | Yes, [Jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs) with scheduled and event-driven execution |
|Deployment| Kubernetes manifests, kustomization, Helm | Azure CLI, Azure Portal, ARM/Bicep, Terraform, GitHub Actions, Azure DevOps|
| Infra As Code (ARM, Bicep, Terraform) | Yes | Yes |
| CI/CD Integration | Yes, with Azure DevOps, GitHub Actions, Jenkins, etc. | Yes, with [Azure DevOps](https://learn.microsoft.com/en-us/azure/container-apps/azure-pipelines), GitHub Actions, etc. |
| Blue/Green Deployments | Yes, requires manual configuration or tooling | Yes, [native with revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions) |
| **Integration with Azure Services** |||
| Azure Service Bus | Yes, via SDKs and drivers | Yes, via SDKs and [Dapr bindings](https://learn.microsoft.com/en-us/azure/container-apps/dapr-overview) |
| Azure Event Hubs | Yes, via SDKs and KEDA | Yes, via SDKs and [built-in scaling](https://learn.microsoft.com/en-us/azure/container-apps/scale-app) |
| Azure Storage (Blob, Queue, Table) | Yes, via SDKs and CSI drivers | Yes, via SDKs and [Dapr bindings](https://learn.microsoft.com/en-us/azure/container-apps/dapr-overview) |
| Azure Database Services | Yes, via connection strings and private endpoints | Yes, via connection strings and private endpoints |
| Azure API Management | Yes, [native integration](https://learn.microsoft.com/en-us/azure/api-management/api-management-kubernetes) | Yes, via [integration](https://learn.microsoft.com/en-us/azure/api-management/api-management-howto-integrate-internal-vnet-appgateway) |
| **Monitoring** |||
| Azure monitor integration | Yes, built-in | Yes, built-in |
| Open Telemetry support | Yes, with custom code | [Yes, natively with OpenTelemetry Agent](https://learn.microsoft.com/en-gb/azure/container-apps/opentelemetry-agents?tabs=arm%2Carm-example) |
| Application Insights Integration | Yes, [automatic integration](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/container-insights-overview) available | Yes, via [Azure Monitor](https://learn.microsoft.com/en-us/azure/container-apps/observability) |
| Log Analytics | Yes, via [Container Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/container-insights-overview) | Yes, [built-in integration](https://learn.microsoft.com/en-us/azure/container-apps/log-options) |
| Live Log Streaming | Yes, via kubectl logs or Azure Portal | Yes, via [Log streaming](https://learn.microsoft.com/en-us/azure/container-apps/log-streaming) and Azure Portal |
| 3rd party integration | Logs/Metrics can be shipped to third party tools | No direct integration, Metrics can be pulled from [Azure Monitor API](https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/metrics-supported#microsoftappcontainerapps)  |
| **Disaster Recovery & Backup** |||
| Backup Solutions | Yes, supports [Azure Backup for AKS](https://learn.microsoft.com/en-us/azure/backup/azure-kubernetes-service-backup-overview) and third-party tools like Velero | No native backup solution, requires manual configuration management |
| Multi-region Deployment | Yes, manual setup required | Yes, deploy to multiple regions manually |
| Geo-replication | Manual setup with traffic manager or Front Door | Manual setup with traffic manager or Front Door |
| **Cost** |||
| Compute Cost| Standard [node-based billing](https://azure.microsoft.com/en-us/pricing/details/kubernetes-service/#pricing) | Based on [resources consumption](https://learn.microsoft.com/en-us/azure/container-apps/billing). Allow idle time. Alternative is to use [dedicated profiles](https://learn.microsoft.com/en-us/azure/container-apps/workload-profiles-overview) |
| Reserved Instances | Yes, possible| Not supported|
| Azure saving plan for compute| Yes, possible| Yes, [possible](https://techcommunity.microsoft.com/t5/apps-on-azure-blog/azure-container-apps-eligible-for-azure-savings-plan-for-compute/ba-p/3941243)|
| **Compliance & Certifications** |||
| Compliance Standards | Inherits Azure compliance (SOC, ISO, HIPAA, etc.) | Inherits Azure compliance (SOC, ISO, HIPAA, etc.) |
| Azure Policy Support | Yes, extensive [built-in policies](https://learn.microsoft.com/en-us/azure/aks/policy-reference) | Yes, limited [built-in policies](https://learn.microsoft.com/en-us/azure/container-apps/policy-reference) |
| RBAC | Yes, Kubernetes RBAC and Azure RBAC | Yes, [Azure RBAC](https://learn.microsoft.com/en-us/azure/container-apps/azure-resource-manager-api-spec) only |
| **Support & SLA** |||
| Support Plans | Azure support plans, community support, paid enterprise support | Azure support plans, community support |
| Production Readiness | Yes, production-ready since 2018 | Yes, Generally Available (GA) since 2022 |
| Feature Updates | Regular updates following Kubernetes release cycle | Frequent updates, managed by Microsoft |
