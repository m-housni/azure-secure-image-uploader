/**
 * parse.js — Multipart request parser.
 *
 * Rich Hickey principle: a function that turns messy I/O (streaming
 * multipart bytes) into plain data.  Once it resolves, callers work
 * purely with values — they never touch the stream again.
 */

"use strict";

const Busboy = require("busboy");

/**
 * Parse a multipart/form-data request and return the first file as plain data.
 *
 * @param {object} req  Azure Functions HttpRequest
 * @returns {Promise<{ fieldname: string, filename: string, mimeType: string, data: Buffer }>}
 */
const parseMultipartFile = (req) =>
  new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] || req.headers["Content-Type"];

    let bb;
    try {
      bb = Busboy({ headers: { "content-type": contentType } });
    } catch (err) {
      return reject(Object.assign(new Error("Invalid multipart request"), { code: 400 }));
    }

    let settled = false;

    const settle = (fn) => (...args) => {
      if (settled) return;
      settled = true;
      fn(...args);
    };

    const resolveOnce = settle(resolve);
    const rejectOnce = settle(reject);

    bb.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () =>
        resolveOnce({ fieldname, filename, mimeType, data: Buffer.concat(chunks) })
      );
      file.on("error", rejectOnce);
    });

    bb.on("error", rejectOnce);
    bb.on("finish", () => {
      if (!settled) {
        const err = new Error("No file found in request");
        err.code = 400;
        rejectOnce(err);
      }
    });

    // req.rawBody is a Buffer in Azure Functions v3/v4; fall back to req.body
    const body = req.rawBody ?? req.body;
    if (Buffer.isBuffer(body)) {
      bb.end(body);
    } else if (typeof body === "string") {
      bb.end(Buffer.from(body, "binary"));
    } else {
      rejectOnce(Object.assign(new Error("Unable to read request body"), { code: 400 }));
    }
  });

module.exports = { parseMultipartFile };
