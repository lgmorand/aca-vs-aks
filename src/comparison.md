# Azure Container Apps vs Azure Kubernetes Service

An architecture decision guide, not a feature-count contest.

**Research baseline: 5 November 2026.** This guide compares Azure-hosted Azure Container Apps (ACA) with Azure Kubernetes Service (AKS). AKS Standard means the configurable cluster experience; **Standard pricing tier** is a separate billing/SLA concept. AKS Automatic is called out where it changes the operating model. Azure Arc deployments have different responsibilities and feature availability.

> **Architect's recommendation**
> Start with Container Apps for containerized APIs, event-driven services, and jobs when the application fits its managed platform boundaries. Evaluate AKS Automatic when you need the Kubernetes API with managed operational defaults. Choose AKS Standard when explicit control over infrastructure, scheduling, networking, or extensions is a requirement.

## 1. Executive decision

| Your requirement | Preferred starting point | Why / qualification |
|---|---|---|
| Ship Linux APIs or microservices without operating Kubernetes | ACA | Managed ingress, revisions, event-driven scaling, and optional managed Dapr. |
| Bursty processing with long idle periods | ACA Consumption | Scale-to-zero resource billing; validate cold starts, trigger support, and quotas. |
| Kubernetes API, Helm charts, operators, or custom resources | AKS | Full Kubernetes API and ecosystem; ACA does not expose a Kubernetes cluster API. |
| Kubernetes with less platform assembly | AKS Automatic | Managed defaults for node provisioning, upgrades, security, and observability; check feature restrictions. |
| Windows containers or specialized node configuration | AKS Standard | Select compatible Windows/Linux node pools and supported VM sizes. |
| Stateful software needing disks, ordered identities, or operators | AKS | StatefulSets and CSI storage; still consider a managed database instead. |
| Managed GPU inference with scale to zero | ACA serverless GPU | Region, model footprint, GPU quota, startup time, and economics must fit. |
| Highly customized GPU scheduling or Kubernetes ML ecosystem | AKS | Greater hardware/scheduling flexibility with greater operating responsibility. |
| Strict per-workload network segmentation or host integration | AKS Standard | Network policies and supported host-level customization; validate the exact isolation requirement. |
| Existing services split across both models | Hybrid ACA + AKS | Share identity, ACR, networking, telemetry, and API governance; avoid unnecessary cross-platform coupling. |

Neither service is universally cheaper, more secure, or more resilient. The deciding factors are workload constraints, platform-team capacity, service-level objectives, and measured total cost.

Sources: [Azure container service selection](https://learn.microsoft.com/en-us/azure/architecture/guide/choose-azure-container-service), [ACA overview](https://learn.microsoft.com/en-us/azure/container-apps/overview), [AKS Automatic](https://learn.microsoft.com/en-us/azure/aks/intro-aks-automatic).

## 2. Operating model and platform ownership

| Capability | AKS | ACA |
|---|---|---|
| Management boundary | Azure manages the Kubernetes control plane. You own workload configuration and, in Standard mode, node-pool design and platform components. | Azure manages the host infrastructure and underlying orchestration. You configure environments, apps, jobs, profiles, and dependencies. |
| Kubernetes API access | Yes: kubectl, Kubernetes RBAC, CRDs, admission controllers, and operators. | No direct Kubernetes API, kubectl, CRDs, or cluster-admin access. Use Azure resource APIs and container app tooling. |
| Managed operating experience | Automatic preconfigures node provisioning, upgrades, and platform safeguards; application responsibility remains yours. | Managed by design, including underlying platform updates. This does not eliminate application maintenance. |
| Upgrade control | Supported Kubernetes versions, upgrade channels, node OS channels, and maintenance windows. Automatic manages more defaults. | No Kubernetes version pinning. Rebuild and patch your own images; test app behavior during platform maintenance. |
| Portability | Kubernetes manifests and Helm are portable in principle; Azure identity, storage, ingress, and policy create dependencies. | OCI container images remain portable; revisions, scale rules, identities, Dapr configuration, and ARM resources need translation. |
| Deployment and IaC | Bicep/ARM/Terraform for Azure infrastructure; Kubernetes manifests, Helm, Kustomize, and GitOps for workloads. | Bicep/ARM/Terraform, CLI, portal, GitHub Actions, and Azure Pipelines. Check provider/API support for new features. |
| Tenant boundaries | Namespaces and RBAC are logical boundaries, not complete hostile-tenant isolation. Consider separate clusters and stronger isolation when needed. | Environments are application/network boundaries; use separate environments for trust boundaries. Shared environments are not a substitute for tenant authorization. |
| Hybrid / on-premises | AKS on Azure Local is a distinct product/deployment model, not an Azure cluster moved on premises. | Container Apps on Azure Arc runs on supported customer-operated Kubernetes; hosted ACA operational assumptions do not carry over. |

Sources: [AKS core concepts](https://learn.microsoft.com/en-us/azure/aks/core-aks-concepts), [Automatic configuration](https://learn.microsoft.com/en-us/azure/aks/intro-aks-automatic), [ACA environments](https://learn.microsoft.com/en-us/azure/container-apps/environment), [ACA on Azure Arc](https://learn.microsoft.com/en-us/azure/container-apps/azure-arc-overview), [AKS on Azure Local](https://learn.microsoft.com/en-us/azure/aks-hybrid-edge/aks-overview).

## 3. Workloads, compute, and application lifecycle

| Capability | AKS | ACA |
|---|---|---|
| Container operating system | Linux and Windows on supported node pools; workload and add-on compatibility differs. | Linux container images; not a Windows-container hosting service. |
| Resource sizing | Pod requests/limits constrained by allocatable node resources, supported VM sizes, and quotas. | Profile-specific CPU/memory combinations; allocation is shared across containers in a replica. |
| Compute choices | General-purpose, memory-optimized, GPU, and other supported node VM families. | Consumption, Dedicated general-purpose/memory-optimized, GPU, confidential profiles, and Flex (preview); availability varies. |
| Consumption sizing | Not a per-replica serverless billing model for ordinary node pools. | Workload profiles Consumption supports up to 4 vCPU / 8 GiB per replica; legacy Consumption-only environments up to 2 vCPU / 4 GiB. |
| Flexible sizing | Select VM size and pod resources; scheduling constraints remain important. | Flex (preview) offers independent CPU/memory choices within published limits and supported regions. Do not assume GA availability. |
| GPU | GPU node pools; install/configure supported drivers and workload scheduling. | Serverless GPU and Dedicated GPU profiles. Hardware, region, capacity approval, and billing differ. |
| Confidential compute | Supported confidential node/VM options; validate threat model, attestation, and regional support. | DC-series Dedicated confidential compute profiles; currently documented in UAE North, not universally available. |
| Sidecars and init containers | Native pod capabilities. | Supported multi-container apps and init containers; sidecars share resources, networking, and lifecycle with the main container. Not generally a preview-only feature. |
| Health checks | Startup, liveness, readiness probes, graceful termination, and disruption controls. | Startup, liveness, readiness probes; explicitly configure endpoints and startup budgets. |
| Batch processing | Jobs, CronJobs, and ecosystem workflow engines. | Manual, scheduled, and event-driven jobs with execution, retry, timeout, and parallelism configuration. Jobs do not expose ingress. |
| Long-running workers | Deployments or other controllers; choose scaling and disruption behavior. | Apps with ingress disabled and event-driven scaling. Use a job when work has a defined completion. |
| Specialized host access | Possible in supported AKS configurations, subject to security policies and mode restrictions. | No arbitrary host access, privileged pod configuration, DaemonSets, or custom Kubernetes controllers. |
| Java and Functions | Run containerized runtimes; integrate the tools and lifecycle you require. | Java-oriented build/deployment features and Azure Functions hosting are available; individual Java conveniences remain preview. |
| Isolated code execution | Design a supported sandbox/isolation solution; ordinary pods alone are not a hostile-code boundary. | Dynamic sessions provide Hyper-V-isolated, ephemeral execution with prewarmed pools. Review pool type, region, network, and billing constraints. |

Sources: [ACA containers and sizing](https://learn.microsoft.com/en-us/azure/container-apps/containers), [workload profiles and Flex preview](https://learn.microsoft.com/en-us/azure/container-apps/workload-profiles-overview), [ACA confidential compute](https://learn.microsoft.com/en-us/azure/container-apps/confidential-compute), [serverless GPUs](https://learn.microsoft.com/en-us/azure/container-apps/gpu-serverless-overview), [AKS GPU pools](https://learn.microsoft.com/en-us/azure/aks/use-nvidia-gpu), [ACA jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs), [Java](https://learn.microsoft.com/en-us/azure/container-apps/java-overview), [Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-container-apps-hosting), [dynamic sessions](https://learn.microsoft.com/en-us/azure/container-apps/sessions).

## 4. Scaling, capacity, and performance

| Capability | AKS | ACA |
|---|---|---|
| Horizontal workload scaling | HPA for CPU/memory/custom metrics; managed KEDA add-on for event-driven scaling. | Built-in HTTP, TCP, and supported KEDA-based custom scale rules. |
| Infrastructure scaling | Cluster autoscaler or node auto-provisioning (NAP); Automatic uses managed provisioning. | Platform manages capacity. Dedicated profiles also have instance min/max settings and associated costs. |
| Scale to zero | KEDA can scale supported workloads to zero; user node pools can reach zero, but required system capacity remains. | Supported with appropriate triggers and minimum replicas set to zero. CPU/memory-only rules cannot wake a zero-replica app. |
| Replica limits | Finite cluster, node, pod, IP, API, subscription, and regional limits. Never "unlimited." | Current documented configurable maximum is **1,000 replicas per revision**, subject to quotas and capacity. Default maximum is 10. |
| Resource quotas | VM-family vCPU quota, regional capacity, subnet/IP space, and service limits. | Environment core/GPU quotas, profile limits, region capacity, and subscription quotas; inspect actual allocations. |
| Cold starts | Image pulls, node provisioning, scheduling, probes, and application initialization all contribute. | Scale-from-zero and image/application initialization affect latency; minimum replicas trade cost for readiness. |
| Disruption and placement | PDBs, topology spread, anti-affinity, node pools, and maintenance controls. PDBs constrain voluntary disruption, not all failures. | No user-managed PDB or pod placement API. Use multiple replicas, probes, zone redundancy, and graceful shutdown. |
| Load testing | Test representative payloads, saturation, downstream throttling, and autoscaling lag. | Same requirement; test trigger polling, HTTP concurrency, cold starts, and downstream connection limits. |

> **Capacity is not an entitlement**
> A configured replica maximum is not reserved regional capacity. Request quota early, measure scale-out under realistic load, and plan for partial failure. Quota increases do not resolve a regional capacity shortage.

Sources: [AKS KEDA](https://learn.microsoft.com/en-us/azure/aks/keda-about), [node auto-provisioning](https://learn.microsoft.com/en-us/azure/aks/node-auto-provisioning), [AKS limits](https://learn.microsoft.com/en-us/azure/aks/quotas-skus-regions), [ACA scaling](https://learn.microsoft.com/en-us/azure/container-apps/scale-app), [ACA quotas](https://learn.microsoft.com/en-us/azure/container-apps/quotas).

## 5. Networking, ingress, and service communication

| Capability | AKS | ACA |
|---|---|---|
| Virtual networking | Azure CNI options; plan IP addressing, routing, DNS, and service exposure. | Azure-managed networking or your own VNet. Prefer workload profiles environments for modern network capabilities. |
| Private access | Private/API-server networking concerns the management endpoint; private workload exposure is a separate ingress/Service design. | Internal environments and environment private endpoints serve different designs. Private endpoints require public network access disabled. |
| Network segmentation | Kubernetes network policies with a supported data plane; apply explicit ingress/egress policies. | Environment and app ingress controls, IP restrictions, NSGs, and routing; not a general Kubernetes NetworkPolicy API. |
| HTTP ingress | Configure a supported ingress/Gateway solution. AKS is not universally a built-in Envoy service. | Managed HTTP ingress, HTTP/2/gRPC support, custom domains, TLS, and optional client-certificate handling. |
| TCP / other protocols | Kubernetes Services and supported load balancers/controllers; protocol support depends on the path. | TCP ingress and additional TCP ports with documented constraints; not arbitrary UDP ingress. |
| Gateway and advanced routing | Application routing Gateway API, Application Gateway for Containers, and Istio options; assess feature support. | Revisions and weighted traffic splitting; path/rule routing and premium ingress have their own configuration and limits. |
| WAF | Add a supported WAF-capable edge or gateway; validate the chosen product's capabilities. | Add Azure Front Door WAF or Application Gateway WAF; ordinary ACA ingress is not a WAF. |
| Controlled outbound access | Supported outbound types, NAT Gateway, UDRs, and Azure Firewall; retain required platform dependencies. | UDR, NAT Gateway, and firewall integration in workload profiles environments; legacy Consumption-only networking is more limited. |
| Service discovery | Kubernetes Services/DNS; optionally Dapr. | Built-in app discovery and optional managed Dapr service invocation. |
| Service mesh | Managed Istio add-on or compatible alternatives; lifecycle/support varies. | Not a customer-operated service mesh platform. Managed ingress and Dapr are not full mesh equivalents. |
| Encryption and mTLS | Configure workload TLS, mesh mTLS, or Dapr as required. | Distinguish environment peer encryption, ingress client certificates, and Dapr mTLS. Each protects a different path. |
| Client certificates | Gateway/controller or application validation. | Ingress can require certificates and forward certificate information; the application must validate trust and authorization. |
| Session affinity | Service/controller-specific affinity, with scaling/failover trade-offs. | Sticky sessions have ingress and revision-mode constraints; do not rely on local state for durability. |
| API Management | API gateway in front of workloads; self-hosted gateway is an additional deployment option. | API Management can front reachable ACA endpoints. Private networking, DNS, and TLS must be designed explicitly. |

Sources: [AKS networking](https://learn.microsoft.com/en-us/azure/aks/concepts-network), [AKS ingress](https://learn.microsoft.com/en-us/azure/aks/concepts-network-ingress), [Gateway API](https://learn.microsoft.com/en-us/azure/aks/app-routing-gateway-api), [ACA networking](https://learn.microsoft.com/en-us/azure/container-apps/networking), [ACA ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview), [ACA client certificates](https://learn.microsoft.com/en-us/azure/container-apps/client-certificate-authorization), [ACA mTLS](https://learn.microsoft.com/en-us/azure/container-apps/mtls), [ACA session affinity](https://learn.microsoft.com/en-us/azure/container-apps/sticky-sessions), [API Management concepts](https://learn.microsoft.com/en-us/azure/api-management/api-management-key-concepts).

## 6. Identity, security, and governance

| Capability | AKS | ACA |
|---|---|---|
| Workload identity | Microsoft Entra Workload ID with OIDC federation; scope identity per workload/service account. | System-assigned and user-assigned managed identities; scope permissions to required resources. |
| Application authentication | Implement in app, gateway, or supported integration; Kubernetes RBAC is not end-user authentication. | Built-in authentication with supported identity providers, including Microsoft Entra ID; application authorization remains necessary. |
| Secret management | Kubernetes Secrets and Key Vault CSI integration; configure access, rotation, and reload behavior. | App secrets, secret volumes, and **Key Vault secret references with managed identity**. Secret changes are not revision-scoped. |
| Certificates | Configure controller/gateway and Key Vault integration as supported. | Managed certificates and custom/Key Vault certificates; validate domain, renewal, network, and regional requirements. |
| Registry access | ACR integration with the kubelet identity or supported registry credentials; handle ACR role/ABAC configuration correctly. | ACR image pulls using managed identity, or supported private-registry credentials. Keep identity available during deployment. |
| Access control | Azure RBAC for Azure resources; Kubernetes RBAC or Azure RBAC integration for the cluster API. | Azure RBAC for apps/jobs/environments. Roles that read secrets or start jobs can grant sensitive access. |
| Policy and guardrails | Azure Policy admission controls plus resource policies and Kubernetes controls. | Azure Policy resource/configuration policies; no arbitrary in-cluster Gatekeeper deployment. |
| Threat protection | Defender for Containers and supported runtime/image posture capabilities; plan, OS, and region matter. | ACA security documentation describes Defender CSPM serverless-container posture. Do not infer agent-based runtime parity with AKS; verify the current support matrix. |
| Image supply chain | Scan images, minimize base images, generate SBOMs, pin immutable digests, and enforce supported admission controls. | Same image hygiene; validate supported deployment enforcement rather than assuming Kubernetes admission mechanisms exist. |
| Compliance | Verify service, region, cloud, contract, and workload controls against requirements. | Same: an Azure certification does not automatically make your application compliant. |

> **Use current identity patterns**
> Microsoft Entra Workload ID replaces the deprecated AKS pod-managed identity add-on. Do not build new workloads around aad-pod-identity. For either service, prefer short-lived identity-based access over embedded credentials.

Sources: [AKS Workload ID](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview), [Key Vault CSI](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver), [ACA managed identities](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity), [ACA secrets](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets), [ACA authentication](https://learn.microsoft.com/en-us/azure/container-apps/authentication), [ACA Key Vault certificates](https://learn.microsoft.com/en-us/azure/container-apps/key-vault-certificates-manage), [ACA security](https://learn.microsoft.com/en-us/azure/container-apps/security), [Defender support matrix](https://learn.microsoft.com/en-us/azure/defender-for-cloud/support-matrix-defender-for-containers), [Azure compliance offerings](https://learn.microsoft.com/en-us/azure/compliance/offerings/).

## 7. Storage, state, and Azure integrations

| Capability | AKS | ACA |
|---|---|---|
| Persistent storage | Azure Disk, Azure Files, and supported CSI drivers; choose access mode, zones, backup, and performance carefully. | Azure Files SMB/NFS mounts with environment/network prerequisites. Not a general-purpose CSI or Azure Disk platform. |
| Ephemeral files | Container filesystem and ephemeral volumes; node failure or rescheduling can lose data. | Container/replica-scoped temporary storage; not durable across restarts or replica replacement. |
| Stateful controllers | StatefulSets, persistent volume claims, operators, and controlled placement. | No StatefulSet/operator API or guaranteed replica identity. Prefer external durable services for application state. |
| Managed data services | Use SDKs, Workload ID, private endpoints, and appropriate database connectivity. | Use SDKs, managed identity, private endpoints, and supported Dapr components as appropriate. |
| Messaging and eventing | Service Bus, Event Hubs, Storage queues, Kafka, etc., through SDKs and supported KEDA scalers. | SDKs and supported scale rules/Dapr components; service compatibility does not imply every scaler/binding is available. |
| Dapr | Install and operate Dapr on Kubernetes, including versioning and component configuration. | Managed Dapr integration, per-app enablement and component scoping; not every upstream feature is necessarily supported. |
| Backup | Azure Backup for AKS and other supported tools; verify storage, region, cross-region restore, and feature limits. | Recreate infrastructure/configuration from IaC; back up external data separately. Revisions are not backups. |

Sources: [AKS CSI storage](https://learn.microsoft.com/en-us/azure/aks/csi-storage-drivers), [ACA storage mounts](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts), [ACA Dapr](https://learn.microsoft.com/en-us/azure/container-apps/dapr-overview), [AKS backup](https://learn.microsoft.com/en-us/azure/backup/azure-kubernetes-service-backup-overview).

## 8. Delivery, observability, and day-two operations

| Capability | AKS | ACA |
|---|---|---|
| Progressive delivery | Deployments plus an ingress/Gateway/mesh or rollout controller; own traffic policy and promotion. | Single/multiple revision modes, labels, and weighted revision traffic; app-scoped settings are not all revisioned. |
| Rollback | Revert manifests/image and traffic configuration; schema/data changes need independent rollback planning. | Shift traffic to a healthy retained revision; secret/configuration and data compatibility still need planning. |
| CI/CD | GitHub Actions/Azure Pipelines and other runners; use federated deployment identity and separate infrastructure/app lifecycles. | Same identity discipline, with Azure-native app/job deployments and revision management. |
| GitOps | Flux integration and Kubernetes ecosystem options. | No Kubernetes GitOps reconciliation endpoint; apply desired state through Azure deployment tooling. |
| Logs and metrics | Azure Monitor, Container Insights, managed Prometheus, Grafana, and ecosystem tooling. | System/console logs, platform metrics, Azure Monitor/Log Analytics options, and application telemetry. |
| Distributed tracing | Instrument apps with OpenTelemetry or supported agents/SDKs; Container Insights is not automatic application tracing. | Instrument apps; managed OpenTelemetry agent routes configured signals. Enabling the agent alone does not instrument code. |
| Third-party telemetry | Export through collectors/agents as supported. | Managed agent supports OTLP-compatible destinations and vendor integrations. Supported signals differ by destination. |
| Troubleshooting | kubectl, logs, events, exec, node diagnostics, and supported debug tooling; constrain production privileges. | Log streams, console, revisions, metrics, and diagnostics; no direct node/cluster administration. |
| Alerts and SLOs | Measure end-user availability, p95/p99 latency, saturation, errors, queue age, and dependency health. | Same; add replica/activation failures, quota saturation, job failures, and revision readiness. |

Sources: [ACA revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions), [ACA traffic splitting](https://learn.microsoft.com/en-us/azure/container-apps/traffic-splitting), [AKS monitoring](https://learn.microsoft.com/en-us/azure/aks/monitor-aks), [Container Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/kubernetes-monitoring-overview), [ACA observability](https://learn.microsoft.com/en-us/azure/container-apps/observability), [ACA OpenTelemetry agent](https://learn.microsoft.com/en-us/azure/container-apps/opentelemetry-agents).

## 9. Reliability, SLA, and disaster recovery

| Topic | AKS | ACA |
|---|---|---|
| Service SLA | Standard and Premium pricing tiers: Kubernetes API server uptime SLA of 99.95% with zones, 99.9% without. Free has no financially backed uptime SLA. | Published service availability commitment is 99.95%, subject to the applicable contract's definitions, eligibility, and exclusions. |
| Automatic SLA | Also includes a pod readiness SLA: 99.9% of qualifying readiness operations within five minutes. This is not application uptime. | No equivalent Kubernetes pod readiness contract; use the ACA service terms. |
| Zone resilience | Configure zone-aware node pools, replica placement, disruption budgets, and enough surviving capacity. A resilient control plane does not make workloads zone-resilient. | Enable zone redundancy at environment creation in a supported region/VNet. Set at least two minimum replicas; size surviving capacity for the SLO. |
| Maintenance | Configure upgrade and node-image strategy, maintenance windows, probes, termination, and disruption controls. | Platform maintenance is managed. Optional paid planned-maintenance windows apply to supported non-Consumption workloads: minimum eight hours weekly; critical updates can occur outside the window. |
| Multi-region | Deploy separate clusters and external dependencies per region; manage routing and data replication. | Deploy separate environments and dependencies per region; no automatic cross-region application replication. |
| Recovery | Define and test RTO/RPO for configuration, secrets, registry, persistent data, DNS, and traffic routing. | Same; IaC redeployment is not enough if state, images, identity permissions, or regional capacity are unavailable. |

> **Compare like-for-like availability**
> AKS API-server uptime, AKS Automatic pod readiness, and ACA service availability measure different things. None is an end-to-end application SLA. Use the current contractual SLA, then engineer and test your own application SLO.

Sources: [AKS pricing tiers and uptime](https://learn.microsoft.com/en-us/azure/aks/free-standard-pricing-tiers), [AKS Automatic SLA](https://learn.microsoft.com/en-us/azure/aks/intro-aks-automatic#service-level-agreement), [ACA reliability](https://learn.microsoft.com/en-us/azure/reliability/reliability-container-apps), [ACA planned maintenance](https://learn.microsoft.com/en-us/azure/container-apps/planned-maintenance), [current Microsoft contractual SLAs](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services).

## 10. Cost and commercial considerations

| Cost driver | AKS | ACA |
|---|---|---|
| Compute | Pay for allocated nodes and attached resources, plus the selected cluster-management tier. | Consumption meters allocated vCPU/memory and billable HTTP requests; Dedicated meters profile instances plus a management fee. Other profiles/features have specific meters. |
| Idle capacity | Nodes generally cost money while idle. Scale down user pools and improve bin packing; required system capacity remains. | Zero replicas remove replica resource charges, not all solution charges. Idle rates apply only under defined Consumption conditions. |
| Free grant | Free control-plane tier does not make worker compute or dependencies free. | Consumption currently includes 180,000 vCPU-seconds, 360,000 GiB-seconds, and 2 million HTTP requests monthly per subscription; eligibility and meters matter. |
| Commitments | Eligible VM reservations and Azure savings plan; match regional/SKU flexibility and utilization. | Azure savings plan eligibility exists; check the current eligible meters. Do not assume VM reservations apply to ACA profiles. |
| Spot | Supported AKS Spot node pools for interruptible workloads; no availability guarantee. | Do not assume ordinary ACA profiles provide equivalent customer-selected Spot node pools. |
| Supporting services | Disks, load balancing, public IPs, egress, NAT/firewall, WAF, registry, monitoring, backup, and support. | Network features/private endpoints, WAF, registry, observability, storage, egress, planned maintenance, and dependencies can dominate a small app's bill. |
| People and operations | Include platform engineering, upgrades, incident response, and security lifecycle. Automatic can reduce, not eliminate, this work. | Lower infrastructure operating burden; app reliability, governance, and integration still require ownership. |

Avoid publishing a universal dollar estimate: region, currency, contract, SKU, utilization, and telemetry volume change the outcome.

**Model at least three scenarios:** low utilization with bursts; steady production load; sustained high utilization. Include minimum replicas, HA headroom, scale-out lag, GPU warm-up, log retention, and engineering effort. Compare measured cost per successful request/job, not just vCPU list price.

Sources: [AKS pricing](https://azure.microsoft.com/en-us/pricing/details/kubernetes-service/), [ACA billing](https://learn.microsoft.com/en-us/azure/container-apps/billing), [ACA pricing](https://azure.microsoft.com/en-us/pricing/details/container-apps/), [savings plan eligible services](https://learn.microsoft.com/en-us/azure/cost-management-billing/savings-plan/savings-plan-overview), [pricing calculator](https://azure.microsoft.com/en-us/pricing/calculator/).

## 11. Retirement and migration watchlist

Retired components are excluded from recommended new architectures, but retained here so existing deployments can migrate safely. Dates below are a research snapshot, not a substitute for subscription service-health notices.

| Component / status on 5 November 2026 | Required architectural action | Official reference |
|---|---|---|
| Upstream ingress-nginx maintenance ended March 2026. Microsoft critical security-patch support for the AKS application-routing NGINX add-on runs through November 2026. | Treat migration as urgent. Evaluate application routing Gateway API, Application Gateway for Containers, or Istio Gateway API. Test annotations, timeouts, certificates, source IP, and traffic cutover; not every NGINX feature maps directly. | [Ingress transition guidance](https://learn.microsoft.com/en-us/azure/aks/concepts-network-ingress), [migration procedure](https://learn.microsoft.com/en-us/azure/aks/app-routing-nginx-to-gateway-api-migration) |
| AKS Basic Load Balancer unsupported since 30 September 2025; Availability Sets are also deprecated. | Upgrade to Standard Load Balancer and supported node-pool infrastructure; check migration constraints. | [Basic LB migration](https://learn.microsoft.com/en-us/azure/aks/upgrade-basic-load-balancer-on-aks) |
| Azure Linux 2.0 security support ended 30 November 2025. | Migrate to a supported node OS now. Microsoft pages contain differing image-removal dates; use the live retirement notice and actual node-pool status rather than treating an old date as a safety margin. | [Node OS lifecycle guidance](https://learn.microsoft.com/en-us/azure/aks/auto-upgrade-node-os-image), [supported OS upgrade](https://learn.microsoft.com/en-us/azure/aks/upgrade-os-version) |
| Azure Linux with OS Guard (preview): support ends 10 December 2026; image removal scheduled 10 March 2027. | Plan migration to the documented supported replacement, Azure Container Linux; validate current release status and regional/version requirements. | [OS retirement notice in upgrade guidance](https://learn.microsoft.com/en-us/azure/aks/auto-upgrade-node-os-image) |
| AKS pod-managed identity deprecated; managed add-on support ran through September 2025. | Replace with Microsoft Entra Workload ID and test federated credentials/SDK support. | [Deprecation and replacement](https://learn.microsoft.com/en-us/azure/aks/use-azure-ad-pod-identity) |
| AKS kubenet retirement scheduled for 31 March 2028. | Plan Azure CNI Overlay migration, validate network-policy changes, and test connectivity/IP design before the deadline. | [Kubenet retirement and migration](https://learn.microsoft.com/en-us/azure/aks/configure-kubenet) |
| ACA Consumption-only environments are documented as legacy, not the default modern environment model. | Prefer workload profiles environments for new deployments. Do not label the legacy model retired without a retirement notice. | [ACA network environment types](https://learn.microsoft.com/en-us/azure/container-apps/networking) |
| Kubernetes versions, ACA API versions, and preview features have independent lifecycles. | Select supported Kubernetes releases and stable ARM APIs. Review preview terms, SDK/provider support, regional rollout, and current release notes before adopting a feature. | [AKS version support](https://learn.microsoft.com/en-us/azure/aks/supported-kubernetes-versions), [ACA release history](https://learn.microsoft.com/en-us/azure/container-apps/whats-new) |

## 12. Reference architectures

### A. Managed API and event-driven platform

**Traffic path:** client -> Azure Front Door / WAF or API Management -> ACA ingress -> stateless apps -> managed data services.

- Use workload profiles environments, VNet integration, private dependencies, managed identity, and Key Vault references.
- Enable zone redundancy at creation and choose minimum replicas for latency/availability; use scale to zero only where the SLO permits.
- Use apps for HTTP/long-running services and jobs for bounded work. Keep durable state outside replicas.
- Apply revision-based delivery, OpenTelemetry instrumentation, cost budgets, and queue-age/latency alerts.
- Separate trust boundaries into environments; document regional recovery and deployment identity permissions.

### B. Kubernetes application platform

**Traffic path:** client -> WAF/API gateway -> supported Gateway API/ingress -> Kubernetes Services -> pods -> persistent/managed dependencies.

- Evaluate Automatic first where its supported defaults meet requirements. Choose Standard for justified control requirements.
- Use supported node OS/Kubernetes releases, Workload ID, private cluster access where required, and explicit network policies.
- Engineer node-pool placement, topology spreading, PDBs, probes, autoscaling, and spare zone capacity together.
- Govern operators/CRDs, images, Helm dependencies, and add-ons; define upgrade and incident ownership.
- Back up supported persistent resources and test restoration, not merely backup job completion.

Architecture guidance: [ACA Well-Architected recommendations](https://learn.microsoft.com/en-us/azure/well-architected/service-guides/azure-container-apps), [AKS baseline architecture](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/containers/aks/baseline-aks).

## 13. Production acceptance checklist

- **Fit:** confirm OS, protocols, container privileges, resource limits, storage, region, and feature maturity.
- **Ownership:** assign responsibility for images, dependencies, access, platform settings, upgrades, and incident response.
- **Security:** validate least privilege, secret rotation, image scanning, private DNS, egress, and tenant boundaries.
- **Availability:** set application SLOs; configure zones, replicas, probes, graceful shutdown, retries, and capacity headroom.
- **Performance:** measure cold starts, p95/p99 latency, scaling delays, queue drain time, and downstream throttling.
- **Delivery:** test rollout/rollback, schema compatibility, identity federation, and environment reproducibility.
- **Recovery:** rehearse regional failover and data restoration; record measured RTO and RPO.
- **Cost:** estimate low/steady/peak use, shared services, telemetry, commitments, and engineering effort.
- **Lifecycle:** resolve urgent retirements, review service-health notifications, and assign an owner for quarterly reassessment.
- **Evidence:** confirm feature availability, quotas, legal SLA, and successful deployment in the actual target subscription.

## 14. Research notes and maintenance

This refresh used Microsoft Learn service/concept documentation, Azure pricing/billing documentation, current Microsoft SLA publications, and official migration guidance. Topic-level source links above explain each comparison; a reachable page alone is not evidence that a feature is supported in your region.

**Important corrections from the previous guide:** ACA supports Key Vault secret references, ordinary sidecars, third-party OpenTelemetry destinations, and region-limited confidential compute. Its current replica ceiling is 1,000 per revision, not 300. AKS Standard pricing includes the uptime SLA; Premium adds LTS rather than being the only SLA tier. ACA zone redundancy must be configured; it is not automatically enabled for every environment. AKS does not have unlimited pods, and Container Insights does not automatically instrument application traces.

**Maturity discipline:** Flex and the Java deployment conveniences explicitly identified above are preview in their cited documentation. GPU, confidential compute, ingress options, Arc, and security coverage have feature-specific region/plan/version constraints; check the linked prerequisite pages rather than assuming uniform availability.

**Known documentation inconsistencies:** Azure Linux 2.0 image-removal dates differ between Microsoft pages. The ACA security overview describes serverless-container CSPM posture, while the general serverless protection page does not clearly enumerate identical ACA coverage. These are not treated as guarantees of extended OS support or full runtime protection.

**Update procedure:** recheck the [AKS release notes](https://github.com/Azure/AKS/releases), [ACA release notes](https://github.com/microsoft/azure-container-apps/releases), [ACA feature history](https://learn.microsoft.com/en-us/azure/container-apps/whats-new), service limits, pricing, and retirement notices. Update this research date only after revalidating the claims. Run the repository's link audit and document build, then inspect the rendered PDF and refreshed README preview.

This is an independent community guide, not a Microsoft product commitment, benchmark, or substitute for an architecture review and current contractual terms.
