## Comparison between ACA and AKS

||ACA|AKS|
|---|:---:|:---:|
| **Resiliency** |
|SLA| free SLO of 99,5% and SLA of 99.95% with [Premium SKU](https://learn.microsoft.com/en-us/azure/aks/uptime-sla)| SLA of [99.95%](https://azure.microsoft.com/fr-fr/support/legal/sla/container-apps/v1_0/)|
|Multi-AZ support| Yes, manually during [cluster creation](https://learn.microsoft.com/en-us/azure/aks/availability-zones)| Yes, built-in|
| **Operations** |
| Control plane| Control plane managed by Azure | Control/Data plane abstracted from Azure. wrapper around API server (no access to kubectl command) |
| **Autoscaling** |||
| Cluster Autoscaling |Yes, with [cluster autoscaler](https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler) | Yes, automatic|
| Basic workload autoscaling | Yes, out-of-the-box with metric server in combination with [HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) | Yes, with [scaling rules](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Advanced workload autoscaling |Can be done by deploying [KEDA](https://keda.hs)| Yes, out-of-the-box with [built-in KEDA](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Limits | Almost no limit in terms of number of pods| App scaling is limited to [30 replicas](https://learn.microsoft.com/en-us/azure/container-apps/quotas) |
| **Workloads** |
| Operating systems | Support Linux/Windows based container | Supports only Linux based container images|
| GPU Compute | Yes, using [GPU dedicated nodes](https://learn.microsoft.com/en-us/azure/aks/gpu-cluster) | No GPU support|
| Confidential Compute | Yes, using [SGX dedicated nodes](https://learn.microsoft.com/en-us/azure/confidential-computing/confidential-nodes-aks-overview) | No confidential compute support|
| **Network** |
||||
| **Security** |
| **Monitoring** |
| Azure monitor integration | Yes, built-in | Yes, built-in|
| **Cost** |
| Compute Cost| Standard [node-based billing](https://azure.microsoft.com/en-us/pricing/details/kubernetes-service/#pricing) | Based on [resources consumption](https://learn.microsoft.com/en-us/azure/container-apps/billing). Allow idle time |
| Reserved Instances | Yes, possible| Not supported|
| Azure saving plan for compute| Yes, possible| Not supported|