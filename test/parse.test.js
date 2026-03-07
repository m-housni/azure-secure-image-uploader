/**
 * test/parse.test.js
 *
 * Tests for the multipart parser adapter.
 * The parser converts stream I/O into plain data; these tests construct
 * minimal multipart buffers to verify that contract.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseMultipartFile } = require("../api/upload/parse");

/** Build a minimal multipart/form-data body buffer */
const buildMultipart = (boundary, fieldname, filename, mimeType, content) => {
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldname}"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(body, "binary");
};

describe("parseMultipartFile", () => {
  const boundary = "----TestBoundary123";
  const contentType = `multipart/form-data; boundary=${boundary}`;

  it("resolves with filename, mimeType, and data buffer", async () => {
    const content = "fake-image-bytes";
    const body = buildMultipart(boundary, "file", "photo.png", "image/png", content);

    const result = await parseMultipartFile({
      headers: { "content-type": contentType },
      rawBody: body,
    });

    assert.equal(result.filename, "photo.png");
    assert.equal(result.mimeType, "image/png");
    assert.ok(Buffer.isBuffer(result.data));
    assert.equal(result.data.toString("binary"), content);
  });

  it("rejects with code 400 when content-type is missing", async () => {
    await assert.rejects(
      () =>
        parseMultipartFile({
          headers: {},
          rawBody: Buffer.from(""),
        }),
      (err) => {
        assert.equal(err.code, 400);
        return true;
      }
    );
  });

  it("rejects with code 400 when body has no file field", async () => {
    // An empty multipart body with no file parts
    const emptyBody = Buffer.from(`--${boundary}--\r\n`, "binary");
    await assert.rejects(
      () =>
        parseMultipartFile({
          headers: { "content-type": contentType },
          rawBody: emptyBody,
        }),
      (err) => {
        assert.equal(err.code, 400);
        return true;
      }
    );
  });
});
