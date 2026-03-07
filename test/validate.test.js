/**
 * test/validate.test.js
 *
 * Tests for the pure validation functions.
 * Pure functions are trivial to test: no mocks, no stubs, no async.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateMimeType,
  validateFileSize,
  validateAuth,
  buildBlobName,
  MAX_FILE_BYTES,
} = require("../api/upload/validate");

// ── validateMimeType ──────────────────────────────────────────────────────────

describe("validateMimeType", () => {
  it("accepts image/jpeg", () => {
    assert.deepEqual(validateMimeType("image/jpeg"), { ok: true });
  });

  it("accepts image/png", () => {
    assert.deepEqual(validateMimeType("image/png"), { ok: true });
  });

  it("accepts image/webp", () => {
    assert.deepEqual(validateMimeType("image/webp"), { ok: true });
  });

  it("rejects image/gif with code 415", () => {
    const result = validateMimeType("image/gif");
    assert.equal(result.ok, false);
    assert.equal(result.code, 415);
  });

  it("rejects application/pdf with code 415", () => {
    const result = validateMimeType("application/pdf");
    assert.equal(result.ok, false);
    assert.equal(result.code, 415);
  });

  it("rejects empty string with code 415", () => {
    const result = validateMimeType("");
    assert.equal(result.ok, false);
    assert.equal(result.code, 415);
  });
});

// ── validateFileSize ──────────────────────────────────────────────────────────

describe("validateFileSize", () => {
  it("accepts a 1-byte file", () => {
    assert.deepEqual(validateFileSize(1), { ok: true });
  });

  it("accepts a file exactly at the limit", () => {
    assert.deepEqual(validateFileSize(MAX_FILE_BYTES), { ok: true });
  });

  it("rejects a file one byte over the limit with code 413", () => {
    const result = validateFileSize(MAX_FILE_BYTES + 1);
    assert.equal(result.ok, false);
    assert.equal(result.code, 413);
  });

  it("rejects a 10 MB file with code 413", () => {
    const result = validateFileSize(10 * 1024 * 1024);
    assert.equal(result.ok, false);
    assert.equal(result.code, 413);
  });
});

// ── validateAuth ──────────────────────────────────────────────────────────────

describe("validateAuth", () => {
  const principal = { userId: "aad-object-id-abc123" };

  it("accepts a valid Bearer token with a principal", () => {
    const result = validateAuth("Bearer some.jwt.token", principal);
    assert.equal(result.ok, true);
    assert.equal(result.userId, "aad-object-id-abc123");
  });

  it("rejects a missing Authorization header", () => {
    const result = validateAuth(undefined, principal);
    assert.equal(result.ok, false);
    assert.equal(result.code, 401);
  });

  it("rejects a non-Bearer Authorization header", () => {
    const result = validateAuth("Basic dXNlcjpwYXNz", principal);
    assert.equal(result.ok, false);
    assert.equal(result.code, 401);
  });

  it("rejects when principal is missing", () => {
    const result = validateAuth("Bearer some.jwt.token", undefined);
    assert.equal(result.ok, false);
    assert.equal(result.code, 401);
  });

  it("rejects when principal has no userId", () => {
    const result = validateAuth("Bearer some.jwt.token", { userId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, 401);
  });
});

// ── buildBlobName ─────────────────────────────────────────────────────────────

describe("buildBlobName", () => {
  const ts = 1708738383000;

  it("includes the original filename", () => {
    const name = buildBlobName("user123", "photo.jpg", ts);
    assert.ok(name.includes("photo.jpg"), `Expected "photo.jpg" in "${name}"`);
  });

  it("includes the userId", () => {
    const name = buildBlobName("user123", "photo.jpg", ts);
    assert.ok(name.includes("user123"), `Expected "user123" in "${name}"`);
  });

  it("is deterministic for the same inputs", () => {
    assert.equal(
      buildBlobName("user123", "photo.jpg", ts),
      buildBlobName("user123", "photo.jpg", ts)
    );
  });

  it("sanitizes special characters in the filename", () => {
    const name = buildBlobName("user123", "my file (1).jpg", ts);
    assert.ok(!/[ ()]/u.test(name), `Name "${name}" should not contain spaces or parens`);
  });

  it("produces a non-empty string", () => {
    const name = buildBlobName("u", "f.png", ts);
    assert.ok(name.length > 0);
  });
});
