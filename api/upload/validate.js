/**
 * validate.js — Pure validation functions.
 *
 * Rich Hickey principle: complect nothing.
 * Each function here takes plain data and returns plain data.
 * No I/O. No side effects. No shared mutable state.
 * These are the facts of what is allowed; they know nothing
 * of HTTP, Azure, or busboy.
 */

"use strict";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validate a MIME type against the allow-list.
 * @param {string} mimeType
 * @returns {{ ok: true } | { ok: false, code: number, message: string }}
 */
const validateMimeType = (mimeType) =>
  ALLOWED_MIME_TYPES.has(mimeType)
    ? { ok: true }
    : { ok: false, code: 415, message: `Unsupported media type: ${mimeType}` };

/**
 * Validate that a file size is within the allowed maximum.
 * @param {number} byteLength
 * @returns {{ ok: true } | { ok: false, code: number, message: string }}
 */
const validateFileSize = (byteLength) =>
  byteLength <= MAX_FILE_BYTES
    ? { ok: true }
    : {
        ok: false,
        code: 413,
        message: `File too large: ${byteLength} bytes (max ${MAX_FILE_BYTES})`,
      };

/**
 * Validate that an Authorization header carries a Bearer token and return
 * the raw token string.  JWT signature verification is delegated to the
 * Azure Functions Easy Auth layer (Entra ID), so here we only check that
 * the token is structurally present and extract the sub/oid claim from the
 * already-decoded principal injected by the runtime.
 *
 * @param {string | undefined} authorizationHeader
 * @param {object | undefined} clientPrincipal  — decoded by Easy Auth
 * @returns {{ ok: true, userId: string } | { ok: false, code: number, message: string }}
 */
const validateAuth = (authorizationHeader, clientPrincipal) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return { ok: false, code: 401, message: "Missing or malformed Authorization header" };
  }
  if (!clientPrincipal || !clientPrincipal.userId) {
    return { ok: false, code: 401, message: "Unauthenticated: no principal found" };
  }
  return { ok: true, userId: clientPrincipal.userId };
};

/**
 * Build a deterministic, collision-resistant blob name from the user's
 * Entra ID object-id, the original file name, and a caller-supplied timestamp.
 * Pure function: same inputs always produce the same output.
 *
 * @param {string} userId
 * @param {string} originalName
 * @param {number} timestampMs  — e.g. Date.now() from the call site
 * @returns {string}
 */
const buildBlobName = (userId, originalName, timestampMs) =>
  `${timestampMs}-${userId}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

module.exports = {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  validateMimeType,
  validateFileSize,
  validateAuth,
  buildBlobName,
};
