import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import type { ServerResponse, IncomingMessage } from "http";

const RECORDS_LOCAL = path.resolve(__dirname, "records-local");

/**
 * Vite plugin that registers local-only dev API endpoints:
 *   POST   /api/update-record/<id>   (front-matter / discrepancies)
 *   GET    /api/record-files/<id>    (list files in records-local/<id>/)
 *   GET    /records-local/<id>/<file> (serve a single file, path-traversal safe)
 * Only active in dev mode; never bundled into production.
 */
function localRecordsApiPlugin() {
  return {
    name: "local-records-api",
    configureServer(server) {
      const sendJson = (
        res: ServerResponse,
        status: number,
        body: unknown
      ) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      };

      const readBody = (req: IncomingMessage): Promise<string> =>
        new Promise((resolve, reject) => {
          let data = "";
          req.on("data", (chunk) => (data += chunk));
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });

      const isSafeRecordId = (id: string): boolean =>
        /^[A-Za-z0-9_.-]+$/.test(id) && !id.includes("..");

      const isSafeFileName = (name: string): boolean =>
        /^[A-Za-z0-9_.() \-]+$/.test(name) && !name.includes("..");

      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        const method = req.method || "GET";

        // ---- POST /api/update-record/<id> ----
        if (method === "POST" && url.startsWith("/api/update-record/")) {
          const recordId = url.split("/").pop() || "";
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          readBody(req)
            .then((raw) => {
              try {
                const { section, content } = JSON.parse(raw);
                const recordMd = path.resolve(
                  RECORDS_LOCAL,
                  "..",
                  "records",
                  recordId,
                  "record.md"
                );
                if (!fs.existsSync(recordMd)) {
                  return sendJson(res, 404, { error: "Record not found" });
                }
                let fileRaw = fs.readFileSync(recordMd, "utf-8");
                const fmMatch = fileRaw.match(
                  /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
                );
                if (!fmMatch) {
                  return sendJson(res, 500, {
                    error: "Invalid front matter",
                  });
                }
                const [, fmYaml, bodyText] = fmMatch;
                let newRaw: string;

                if (section === "discrepancies") {
                  let newBody = bodyText;
                  const discHeader = "## Discrepancies";
                  const discIdx = newBody.indexOf(discHeader);
                  if (discIdx !== -1) {
                    const rest = newBody.slice(discIdx + discHeader.length);
                    const nextHeaderIdx = rest.indexOf("\n## ");
                    let insertionPoint: number;
                    if (nextHeaderIdx !== -1) {
                      insertionPoint =
                        discIdx + discHeader.length + nextHeaderIdx;
                    } else {
                      insertionPoint = newBody.length;
                    }
                    const before = newBody.slice(0, insertionPoint);
                    const after = newBody.slice(insertionPoint);
                    const sep = before.endsWith("\n") ? "" : "\n";
                    newBody =
                      before + sep + `- ${content}\n` + after;
                  } else {
                    newBody =
                      newBody.trimEnd() +
                      `\n\n## Discrepancies\n- ${content}\n`;
                  }
                  newRaw = `---\n${fmYaml}\n---\n${newBody}\n`;
                } else if (section === "front-matter") {
                  const [key, value] = String(content).split("=");
                  if (!key || !value) {
                    return sendJson(res, 400, {
                      error: "Use key=value format",
                    });
                  }
                  // Booleans stay boolean; everything else is written as a string
                  const normalized =
                    value === "true" || value === "false"
                      ? value
                      : `"${value}"`;
                  const lines = fmYaml.split("\n");
                  let found = false;
                  for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith(`${key}:`)) {
                      lines[i] = `${key}: ${normalized}`;
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    lines.push(`${key}: ${normalized}`);
                  }
                  newRaw = `---\n${lines.join("\n")}\n---\n${bodyText}\n`;
                } else {
                  return sendJson(res, 400, {
                    error: "Unknown section",
                  });
                }

                fs.writeFileSync(recordMd, newRaw);
                return sendJson(res, 200, { ok: true });
              } catch (e: any) {
                return sendJson(res, 500, { error: e.message });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- GET /api/record-files/<id> ----
        if (method === "GET" && url.startsWith("/api/record-files/")) {
          const recordId = url.split("/").pop() || "";
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          const dir = path.join(RECORDS_LOCAL, recordId);
          if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
            return sendJson(res, 404, { error: "Record folder not found" });
          }
          const files = fs
            .readdirSync(dir)
            .filter((f) => fs.statSync(path.join(dir, f)).isFile())
            .map((f) => ({
              name: f,
              path: `/records-local/${recordId}/${encodeURIComponent(f)}`,
              absPath: path.join(dir, f),
              ext: path.extname(f).toLowerCase(),
            }));
          return sendJson(res, 200, { files });
        }

        // ---- POST /api/open-in-finder/<id> ----
        if (method === "POST" && url.startsWith("/api/open-in-finder/")) {
          const recordId = url.split("/").pop() || "";
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          readBody(req)
            .then(async (raw) => {
              try {
                const { file } = JSON.parse(raw);
                const dir = path.join(RECORDS_LOCAL, recordId);
                if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
                  return sendJson(res, 404, { error: "Record folder not found" });
                }
                const files = fs
                  .readdirSync(dir)
                  .filter((f) => fs.statSync(path.join(dir, f)).isFile());
                if (files.length === 0) {
                  return sendJson(res, 404, { error: "No files in record folder" });
                }
                const targetFile = file
                  ? files.find((f) => f === file)
                  : files[0];
                if (!targetFile) {
                  return sendJson(res, 404, { error: "File not found in record folder" });
                }
                const filePath = path.join(dir, targetFile);
                const realPath = path.resolve(filePath);
                const realRoot = path.resolve(RECORDS_LOCAL);
                if (!realPath.startsWith(realRoot + path.sep)) {
                  return sendJson(res, 403, { error: "Path traversal denied" });
                }
                if (!fs.existsSync(realPath) || !fs.statSync(realPath).isFile()) {
                  return sendJson(res, 404, { error: "File not found" });
                }
                const { exec } = await import("child_process");
                exec(`open -R "${realPath}"`, (err) => {
                  if (err) {
                    return sendJson(res, 500, { error: err.message });
                  }
                  return sendJson(res, 200, { ok: true, path: realPath });
                });
              } catch (e: any) {
                return sendJson(res, 500, { error: e.message });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/update-record-links/<id> ----
        if (method === "POST" && url.startsWith("/api/update-record-links/")) {
          const recordId = url.split("/").pop() || "";
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          readBody(req)
            .then(async (raw) => {
              try {
                const { links } = JSON.parse(raw);
                if (!Array.isArray(links)) {
                  return sendJson(res, 400, { error: "links must be an array" });
                }
                const recordMd = path.resolve(
                  RECORDS_LOCAL,
                  "..",
                  "records",
                  recordId,
                  "record.md"
                );
                if (!fs.existsSync(recordMd)) {
                  return sendJson(res, 404, { error: "Record not found" });
                }
                let fileRaw = fs.readFileSync(recordMd, "utf-8");
                const fmMatch = fileRaw.match(
                  /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
                );
                if (!fmMatch) {
                  return sendJson(res, 500, { error: "Invalid front matter" });
                }
                const [, fmYaml, bodyText] = fmMatch;
                const lines = fmYaml.split("\n");
                let newYaml: string;

                // Remove any existing links block
                let filteredLines: string[] = [];
                let inLinksBlock = false;
                for (const line of lines) {
                  if (line.startsWith("links:")) {
                    inLinksBlock = true;
                    continue;
                  }
                  if (inLinksBlock) {
                    if (line.trim() && !line.startsWith(" ")) {
                      inLinksBlock = false;
                      filteredLines.push(line);
                    }
                    continue;
                  }
                  filteredLines.push(line);
                }

                // Append new links block
                if (links.length > 0) {
                  filteredLines.push("links:");
                  for (const link of links) {
                    filteredLines.push(`  - label: ${link.label}`);
                    filteredLines.push(`    url: ${link.url}`);
                  }
                }

                newYaml = filteredLines.join("\n");
                const newRaw = `---\n${newYaml}\n---\n${bodyText}\n`;

                fs.writeFileSync(recordMd, newRaw);
                return sendJson(res, 200, { ok: true });
              } catch (e: any) {
                return sendJson(res, 500, { error: e.message });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- GET /records-local/<id>/<file> ----
        if (method === "GET" && url.startsWith("/records-local/")) {
          const parts = url.slice("/records-local/".length).split("/");
          if (parts.length < 2) {
            return sendJson(res, 400, { error: "Missing file path" });
          }
          const recordId = parts[0];
          const fileNameEncoded = parts.slice(1).join("/");
          const fileName = decodeURIComponent(fileNameEncoded);
          if (!isSafeRecordId(recordId) || !isSafeFileName(fileName)) {
            return sendJson(res, 400, { error: "Invalid path" });
          }
          const filePath = path.join(RECORDS_LOCAL, recordId, fileName);
          // Resolve and confirm it's still under RECORDS_LOCAL
          const realPath = path.resolve(filePath);
          const realRoot = path.resolve(RECORDS_LOCAL);
          if (!realPath.startsWith(realRoot + path.sep)) {
            return sendJson(res, 403, { error: "Path traversal denied" });
          }
          if (!fs.existsSync(realPath) || !fs.statSync(realPath).isFile()) {
            return sendJson(res, 404, { error: "File not found" });
          }
          const ext = path.extname(fileName).toLowerCase();
          const mime =
            ext === ".pdf"
              ? "application/pdf"
              : ext === ".jpg" || ext === ".jpeg"
                ? "image/jpeg"
                : ext === ".png"
                  ? "image/png"
                  : ext === ".webp"
                    ? "image/webp"
                    : "application/octet-stream";
          res.writeHead(200, { "Content-Type": mime });
          const stream = fs.createReadStream(realPath);
          stream.pipe(res);
          stream.on("error", () =>
            sendJson(res, 500, { error: "Failed to read file" })
          );
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react(), localRecordsApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
