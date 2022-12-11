## Comparison between ACA and AKS

||ACA|AKS|
|---|:---:|:---:|
| **Opérations** | 
|Opérations|sdfsdf sdf|sdfsdf sdfs dfs dfsdf |
| Scalability |
| **Autoscaling** |||
| Cluster Autoscaling |Yes, with [cluster autoscaler](https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler) | Yes, automatic|
| Basic workload autoscaling | Yes, out-of-the-box with metric server in combination with HPA | Yes, with [scaling rules](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Advanced workload autoscaling |Can be done by deploying [KEDA](https://keda.hs)| Yes, out-of-the-box with [built-in KEDA](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)|
| Limits | Almost no limit in terms of number of pods| App scaling is limited to [30 replicas](https://learn.microsoft.com/en-us/azure/container-apps/quotas) |
| **Network** |
| **Security** |
| **Monitoring** |
|Opérations|Opérations|Opérations|
| **Cost** |
| Compute Cost| Standard Node based costing |Opérations|