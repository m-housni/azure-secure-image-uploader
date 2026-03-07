/**
 * storage.js — All Azure Blob Storage I/O, and nothing else.
 *
 * Rich Hickey principle: separate what (data/logic) from how (I/O).
 * This module knows how to talk to Azure.  It knows nothing about
 * HTTP, validation, or auth.  It receives plain data and returns
 * plain data — or throws on irrecoverable I/O errors.
 */

"use strict";

const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

const CONTAINER_NAME = "images";

/**
 * Build a BlobServiceClient using Managed Identity — no secrets, no keys,
 * no connection strings.  DefaultAzureCredential picks up the system-assigned
 * Managed Identity automatically when running in Azure.
 *
 * @param {string} storageAccountName
 * @returns {BlobServiceClient}
 */
const buildBlobServiceClient = (storageAccountName) => {
  const credential = new DefaultAzureCredential();
  return new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );
};

/**
 * Upload a buffer to Blob Storage.
 * Returns plain data describing the result.
 *
 * @param {BlobServiceClient} client
 * @param {string} blobName
 * @param {Buffer} data
 * @param {string} contentType
 * @returns {Promise<{ blobName: string, url: string }>}
 */
const uploadBlob = async (client, blobName, data, contentType) => {
  const containerClient = client.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return { blobName, url: blockBlobClient.url };
};

module.exports = {
  CONTAINER_NAME,
  buildBlobServiceClient,
  uploadBlob,
};
