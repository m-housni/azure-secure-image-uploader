## 🔐 Zero-Trust Image Upload System — Technical Specs

Designed for production-grade security on Microsoft Azure.

---

# 1️⃣ Functional Specifications

### Core Features

* Authenticated users can upload images
* Only approved MIME types (jpg, png, webp)
* Max file size (example: 5MB)
* Images stored privately in Blob Storage
* Every upload tied to user identity (AAD Object ID)
* Audit logging enabled

---

# 2️⃣ Non-Functional Requirements

| Category     | Spec                                 |
| ------------ | ------------------------------------ |
| Security     | No public access, no shared keys     |
| Auth         | Entra ID only                        |
| Networking   | Private Endpoint only                |
| Availability | 99.9%                                |
| Scalability  | Serverless auto-scale                |
| Encryption   | TLS 1.2+, Storage encryption at rest |
| Compliance   | RBAC enforced                        |

---

# 3️⃣ Architecture Specification

<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/6e44a647-f2ca-460a-96f5-f1653b2352ad" />

---

### Components

| Layer    | Service                                        |
| -------- | ---------------------------------------------- |
| Frontend | Azure Static Web Apps                          |
| Backend  | Azure Functions (Node.js)                      |
| Storage  | Azure Blob Storage                             |
| Identity | Microsoft Entra ID                             |
| Network  | Azure Virtual Network + Azure Private Endpoint |

---

# 4️⃣ Security Specifications

### Storage Account

* Public network access → Disabled
* Blob public access → Disabled
* Shared key access → Disabled
* Minimum TLS → 1.2
* Soft delete → Enabled

### Identity & Access

* Managed Identity enabled on Function App
* Role: `Storage Blob Data Contributor`
* Scope: Container-level (least privilege)

---

# 5️⃣ API Specification

### Endpoint

```
POST /api/upload
```

### Headers

```
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

### Request Body

```
file: binary
```

### Response

```json
{
  "message": "Upload successful",
  "fileName": "1708738383-profile.png"
}
```

### Error Codes

| Code | Meaning          |
| ---- | ---------------- |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 413  | File too large   |
| 415  | Unsupported type |
| 500  | Internal error   |

---

# 6️⃣ Backend Implementation Spec (Node.js)

### Required Packages

```bash
npm install @azure/storage-blob @azure/identity busboy
```

---

### Upload Logic Flow

1. Validate JWT
2. Validate file type
3. Validate size
4. Use `DefaultAzureCredential`
5. Upload via Managed Identity

---

### Sample Code Snippet

```js
const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

const credential = new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${process.env.STORAGE_ACCOUNT}.blob.core.windows.net`,
  credential
);
```

No:

* Connection string
* Access key
* SAS token

---

# 7️⃣ Network Specification

### Virtual Network

* Address Space: 10.0.0.0/16
* Subnet: 10.0.1.0/24
* Function integrated with VNet
* Storage connected via Private Endpoint

### DNS

* Private DNS zone:

  ```
  privatelink.blob.core.windows.net
  ```

---

# 8️⃣ DevOps Specification

### Infrastructure as Code

* Bicep or Terraform
* No manual portal config

### CI/CD

* GitHub Actions
* OIDC federation (no service principal secret)

---

# 9️⃣ Monitoring & Observability

* Application Insights
* Storage logs enabled
* Diagnostic settings → Log Analytics
* Alerts on:

  * Failed auth
  * High upload rate
  * Large file attempts

---

# 🔟 Threat Model Summary

| Threat                    | Mitigation           |
| ------------------------- | -------------------- |
| Public access             | Disabled             |
| Credential leak           | No shared keys       |
| MITM                      | TLS enforced         |
| Unauthorized user         | Entra ID auth        |
| Internal lateral movement | Private Endpoint     |
| Malware upload            | Defender for Storage |

---

# 🔥 Advanced Optional Specs

* Customer Managed Keys (CMK)
* File hash validation
* Rate limiting
* WAF in front of API
* Upload queue + background scanning

---

# 🎯 Production-Grade Checklist

* [x] Identity-based auth
* [x] Private networking
* [x] No secrets
* [x] RBAC scoped
* [x] Monitoring enabled
* [x] Secure CI/CD

---

# 🧠 System Mental Model

Think of it like:

* Storage = Vault
* Private Endpoint = Private underground tunnel
* Managed Identity = Employee badge
* Entra ID = Security gate
* RBAC = Door access control

No badge → no tunnel → no vault.

---

# ✅ Final Takeaways

* Zero-trust = identity + private network.
* Managed Identity replaces secrets.
* Private Endpoint eliminates internet exposure.
* RBAC enforces least privilege.
* This design is audit-ready and enterprise compliant.

If you want, I can now provide:

* 📄 Full API contract (OpenAPI spec)
* 🏗 Terraform/Bicep template
* 🧪 Local dev setup guide
* 📦 GitHub-ready folder structure

