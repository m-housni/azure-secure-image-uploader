## 🔐 Secure Image Uploader – Azure + Node.js

Designed and implemented a **secure, zero-trust image upload system** on Microsoft Azure, eliminating public access and shared keys while enforcing identity-based authentication.

### 🚀 What I Built

* **Network Isolation**

  * Deployed Azure Virtual Network (VNet) with dedicated subnet
  * Restricted Storage Account access to private network only

* **Access Control**

  * Disabled public access on the Storage Account
  * Configured Network Rules to allow traffic exclusively from the VNet

* **Identity-Based Security**

  * Enabled **System-Assigned Managed Identity** on Azure VM
  * Assigned **Storage Blob Data Contributor** RBAC role
  * Eliminated usage of storage account keys

* **Node.js Integration**

  * Built upload script using:

    * `@azure/storage-blob`
    * `@azure/identity`
  * Used `DefaultAzureCredential` for secure, keyless authentication

* **Zero-Trust Validation**

  * ❌ Negative test: Verified blocked access from local machine
  * ✅ Positive test: Confirmed secure upload from VM within VNet

---

## 🧠 Key Skills Demonstrated

* Azure CLI infrastructure provisioning
* Secure cloud networking (VNet + Service Endpoints)
* RBAC & Managed Identity implementation
* Secure SDK integration in Node.js
* Zero-trust validation strategy

---

## 💡 Architecture Snapshot (Simplified)

```
Local Machine ❌ (Blocked)
        |
Internet
        |
Azure VM (Managed Identity) ✅
        |
   Azure VNet
        |
Azure Storage Account (Private Access Only)
```

---

## 📌 Impact

* Removed dependency on storage keys (reduced attack surface)
* Enforced least-privilege access model
* Implemented production-ready cloud security pattern
* Demonstrated full-stack cloud + backend integration skills
