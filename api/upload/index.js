/**
 * index.js — Azure Function HTTP trigger: POST /api/upload
 *
 * Rich Hickey principle: the entry point is a thin adapter.
 * It translates HTTP into plain data, hands that data to pure
 * functions, then translates the results back into HTTP.
 * Business logic and I/O each live in their own modules.
 *
 * Flow (data, not objects):
 *   HTTP request
 *     → parseMultipartFile  (adapter: stream → plain data)
 *     → validateAuth        (pure: data → result)
 *     → validateMimeType    (pure: data → result)
 *     → validateFileSize    (pure: data → result)
 *     → buildBlobName       (pure: data → data)
 *     → uploadBlob          (I/O: data → plain result)
 *     → HTTP response
 */

"use strict";

const { parseMultipartFile } = require("./parse");
const {
  validateAuth,
  validateMimeType,
  validateFileSize,
  buildBlobName,
} = require("./validate");
const { buildBlobServiceClient, uploadBlob } = require("./storage");

// Build the storage client once at cold-start; reuse across invocations.
const STORAGE_ACCOUNT = process.env.STORAGE_ACCOUNT;
if (!STORAGE_ACCOUNT) {
  throw new Error(
    "Required environment variable STORAGE_ACCOUNT is not set. " +
    "Set it in local.settings.json (local) or Application Settings (Azure)."
  );
}
const storageClient = buildBlobServiceClient(STORAGE_ACCOUNT);

/**
 * Produce a JSON HTTP response.  Pure function.
 * @param {number} status
 * @param {object} body
 * @returns {{ status: number, body: string, headers: object }}
 */
const jsonResponse = (status, body) => ({
  status,
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
});

/**
 * Azure Function handler.
 */
module.exports = async (context, req) => {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const authResult = validateAuth(
    req.headers["authorization"] || req.headers["Authorization"],
    req.headers["x-ms-client-principal"]
      ? JSON.parse(
          Buffer.from(req.headers["x-ms-client-principal"], "base64").toString("utf8")
        )
      : undefined
  );
  if (!authResult.ok) {
    context.res = jsonResponse(authResult.code, { message: authResult.message });
    return;
  }
  const { userId } = authResult;

  // ── 2. Parse multipart body ────────────────────────────────────────────────
  let file;
  try {
    file = await parseMultipartFile(req);
  } catch (err) {
    context.res = jsonResponse(err.code ?? 400, { message: err.message });
    return;
  }

  // ── 3. Validate MIME type ─────────────────────────────────────────────────
  const mimeResult = validateMimeType(file.mimeType);
  if (!mimeResult.ok) {
    context.res = jsonResponse(mimeResult.code, { message: mimeResult.message });
    return;
  }

  // ── 4. Validate file size ─────────────────────────────────────────────────
  const sizeResult = validateFileSize(file.data.length);
  if (!sizeResult.ok) {
    context.res = jsonResponse(sizeResult.code, { message: sizeResult.message });
    return;
  }

  // ── 5. Build blob name (pure) ─────────────────────────────────────────────
  const blobName = buildBlobName(userId, file.filename, Date.now());

  // ── 6. Upload (I/O) ────────────────────────────────────────────────────────
  try {
    await uploadBlob(storageClient, blobName, file.data, file.mimeType);
  } catch (err) {
    context.log.error("Blob upload failed", err.message);
    context.res = jsonResponse(500, { message: "Internal server error" });
    return;
  }

  // ── 7. Respond ────────────────────────────────────────────────────────────
  context.res = jsonResponse(200, {
    message: "Upload successful",
    fileName: blobName,
  });
};
