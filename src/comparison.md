# Comparison between ACA and AKS

||AKS|ACA|
|---|:---:|:---:|
| Complexity | High | Low |
| Portability | High | Low, containers are the same but manifests are not portable |
| **Resiliency** |
|SLA| free SLO of 99,5% and SLA of 99.95% with [Premium SKU](https://learn.microsoft.com/en-us/azure/aks/uptime-sla)| SLA of [99.95%](https://azure.microsoft.com/fr-fr/support/legal/sla/container-apps/v1_0/)|
|Multi-AZ support| Yes, manually during [cluster creation](https://learn.microsoft.com/en-us/azure/aks/availability-zones)| Yes, built-in|
| **Operations** |
| Control plane| Control plane managed by Azure | Control/Data plane abstracted from Azure. wrapper around API server (no access to kubectl command) |
| Data plane | managed by user by creating nodepools| Serverless and fully managed|
| Upgrade management | Manual or [automated](https://learn.microsoft.com/en-us/azure/aks/auto-upgrade-cluster) | Fully managed|
| **Autoscaling** |
| Cluster Autoscaling |Yes, with [cluster autoscaler](https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler) | Yes, automatic|
| Basic workload autoscaling | Yes, out-of-the-box with metric server in combination with [HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) | Yes, with [scaling rules](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Advanced workload autoscaling |Can be done by deploying [KEDA](https://keda.hs)| Yes, out-of-the-box with [built-in KEDA](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Limits | Almost no limit in terms of number of pods| App scaling is limited to [30 replicas](https://learn.microsoft.com/en-us/azure/container-apps/quotas) |
| **Workloads** |
| Operating systems | Support Linux/Windows based container | Supports only Linux based container images|
| Compute configuration| Virtually unlimited to any configuration | Very limited, [from 0.25vPCU/0.5Gio memory to 2vCPU/4Gio memory](https://learn.microsoft.com/en-us/azure/container-apps/containers#configuration) |
| GPU Compute | Yes, using [GPU dedicated nodes](https://learn.microsoft.com/en-us/azure/aks/gpu-cluster) | No GPU support|
| Confidential Compute | Yes, using [SGX dedicated nodes](https://learn.microsoft.com/en-us/azure/confidential-computing/confidential-nodes-aks-overview) | No confidential compute support|
| **Network** |
| mTLS communication | No OOB mTLS support in pods. Can be done by installing Dapr or a service mesh| OOB support for mTLS with dapr integration (need configuration) |
| Internal | Native usage of network policies | No network segmentation within the same environment |
| VNet integration | Yes, built-in | Yes, built-in |
| HTTP Ingress | Yes, built-in (Envoy)| Yes(may need additional infrastructure)|
| Traffic management | Yes, but nothing OOB | Native [traffic management](https://learn.microsoft.com/en-us/azure/container-apps/networking) |
| **Security** |
| Managed identity | Supported with [workload identity](https://learn.microsoft.com/en-us/azure/aks/use-managed-identity)| OOB [supported](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity)|
| Injecting identities into workloads | Yes, with [workloads identities](https://azure.github.io/azure-workload-identity) | No |
| Authentication and authorization | Yes but manually with services meshes or [components](https://github.com/Azure/EasyAuthForK8s) | Yes, [native](https://learn.microsoft.com/en-us/azure/container-apps/authentication). Integration with AAD, Facebook, Twitter & Google|
|Secret management | Secret management via CSI driver (i.e. Azure KeyVault or HashiCorp Vault) | [Key-value management](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets), no integration with KeyVault|
| Security Policy| Rich, with Gatekeeper and Azure Policies| Limited to some [configuration policies](https://learn.microsoft.com/en-us/azure/container-apps/policy-reference) |
| Runtine scanning | Yes, natively with Defender for Containers or any 3rd party runtime | No, maybe later|
| **Development** |
|Service discovery|Yes, when installing tooling such as Dapr|Yes, built-in with Dapr|
| Type of workload| Almost anything| Microservices, Event-driven applications, Jobs, small web applications|
|Deployment| Kubernetes manifests, kustomization, Helm | Azure CLI|
| **Monitoring** |
| Azure monitor integration | Yes, built-in | Yes, built-in |
| 3rd party integration | Logs/Metrics can be shipped to third party tools | No |
| **Cost** |
| Compute Cost| Standard [node-based billing](https://azure.microsoft.com/en-us/pricing/details/kubernetes-service/#pricing) | Based on [resources consumption](https://learn.microsoft.com/en-us/azure/container-apps/billing). Allow idle time |
| Reserved Instances | Yes, possible| Not supported|
| Azure saving plan for compute| Yes, possible| Not supported|
