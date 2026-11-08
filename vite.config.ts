import { defineConfig, type Plugin } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import os from "os";
import type { ServerResponse, IncomingMessage } from "http";

const RECORDS_LOCAL = path.resolve(__dirname, "records-local");

interface CorrespondenceStatement {
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

interface CorrespondenceDb {
  pragma(source: string, options?: Record<string, unknown>): unknown;
  prepare(source: string): CorrespondenceStatement;
}

interface CorrespondenceDbModule {
  getDb: () => CorrespondenceDb;
  getDbPath: () => string;
}

/**
 * Vite plugin that registers local-only dev API endpoints:
 *   POST   /api/update-record/<id>   (front-matter / discrepancies)
 *   POST   /api/update-record-links/<id> (links: label + url)
 *   GET    /api/record-files/<id>    (list files in records-local/<id>/)
 *   POST   /api/event-override       (Next card event state -> src/data/event-requests.json)
 *   POST   /api/create-record        (record.md for a document found online)
 *   POST   /api/open-inbox           (reveal ~/Downloads/FAMILY TREE/_inbox in Finder)
 *   GET    /records-local/<id>/<file> (serve a single file, path-traversal safe)
 * Only active in dev mode; never bundled into production.
 */
function localRecordsApiPlugin(): Plugin {
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
                    const label = typeof link?.label === "string" ? link.label : "";
                    const url = typeof link?.url === "string" ? link.url : "";
                    if (!url) continue;
                    filteredLines.push(`  - label: ${JSON.stringify(label)}`);
                    filteredLines.push(`    url: ${JSON.stringify(url)}`);
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

        // ---- POST /api/fs-check ----
        // Saves a FamilySearch person check into src/data/fs-checks.json:
        // { personId, patch } — patch fields are merged; null deletes a field.
        if (method === "POST" && url.startsWith("/api/fs-check")) {
          readBody(req)
            .then((raw) => {
              try {
                const { personId, patch } = JSON.parse(raw);
                if (typeof personId !== "string" || !/^[a-z0-9-]+$/i.test(personId)) {
                  return sendJson(res, 400, { error: "invalid personId" });
                }
                const storePath = path.resolve(__dirname, "src", "data", "fs-checks.json");
                let store: Record<string, Record<string, unknown>> = {};
                if (fs.existsSync(storePath)) {
                  try { store = JSON.parse(fs.readFileSync(storePath, "utf-8")) || {}; } catch { store = {}; }
                }
                const entry: Record<string, unknown> = { ...(store[personId] ?? {}) };
                for (const [k, v] of Object.entries(patch ?? {})) {
                  if (v === null || v === undefined) delete entry[k];
                  else entry[k] = v;
                }
                store[personId] = entry;
                fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n");
                return sendJson(res, 200, { ok: true, entry });
              } catch (e) {
                return sendJson(res, 500, { error: (e as Error).message });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/event-override ----
        // Persists what the Next card knows about one life event into
        // src/data/event-requests.json. patch === null deletes the entry;
        // a null/empty value inside the patch deletes that single field.
        if (method === "POST" && url.startsWith("/api/event-override")) {
          readBody(req)
            .then((raw) => {
              try {
                const { key, patch } = JSON.parse(raw);
                if (typeof key !== "string" || !key.includes("|")) {
                  return sendJson(res, 400, {
                    error: "key must be '<personId>|<eventType>'",
                  });
                }
                if (patch !== null && typeof patch !== "object") {
                  return sendJson(res, 400, {
                    error: "patch must be an object or null",
                  });
                }
                const storePath = path.resolve(
                  __dirname,
                  "src",
                  "data",
                  "event-requests.json"
                );
                let store: Record<string, Record<string, unknown>> = {};
                if (fs.existsSync(storePath)) {
                  try {
                    const parsed = JSON.parse(
                      fs.readFileSync(storePath, "utf-8")
                    );
                    if (parsed && typeof parsed === "object") store = parsed;
                  } catch {
                    store = {};
                  }
                }

                if (patch === null) {
                  delete store[key];
                } else {
                  const entry: Record<string, unknown> = {
                    ...(store[key] ?? {}),
                  };
                  for (const [k, v] of Object.entries(patch)) {
                    if (v === null || v === undefined || v === "") {
                      delete entry[k];
                    } else {
                      entry[k] = v;
                    }
                  }
                  if (Object.keys(entry).length === 0) delete store[key];
                  else store[key] = entry;
                }

                fs.writeFileSync(
                  storePath,
                  JSON.stringify(store, null, 2) + "\n"
                );
                return sendJson(res, 200, { ok: true, store });
              } catch (e: any) {
                return sendJson(res, 500, { error: e.message });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/person-skip ----
        // Persists person-level skip (skipped_on) into src/data/person-skips.json.
        if (method === "POST" && url.startsWith("/api/person-skip")) {
          readBody(req)
            .then((raw) => {
              try {
                const { personId, skippedOn } = JSON.parse(raw);
                if (typeof personId !== "string" || !/^[a-z0-9-]+$/i.test(personId)) {
                  return sendJson(res, 400, { error: "invalid personId" });
                }
                const storePath = path.resolve(__dirname, "src", "data", "person-skips.json");
                let store: Record<string, Record<string, unknown>> = {};
                if (fs.existsSync(storePath)) {
                  try { store = JSON.parse(fs.readFileSync(storePath, "utf-8")) || {}; } catch { store = {}; }
                }
                if (skippedOn === null || skippedOn === undefined || skippedOn === "") {
                  delete store[personId];
                } else {
                  store[personId] = { ...(store[personId] ?? {}), skippedOn };
                }
                fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n");
                return sendJson(res, 200, { ok: true });
              } catch (e: any) {
                return sendJson(res, 500, { error: e.message });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/person-meta ----
        // Persists per-person extras (FamilySearch ID, alt profiles, links,
        // notes) into src/data/person-meta.json. The client merges the entry
        // over familyData.ts via withMeta(), so familyData.ts is never edited
        // by hand. Same conventions as /api/event-override: patch === null
        // deletes the entry; a null/empty value inside the patch deletes that
        // single field.
        if (method === "POST" && url === "/api/person-meta") {
          readBody(req)
            .then((raw) => {
              try {
                const { personId, patch } = JSON.parse(raw);
                if (typeof personId !== "string" || !/^[a-z0-9-]+$/i.test(personId)) {
                  return sendJson(res, 400, { error: "invalid personId" });
                }
                if (patch !== null && typeof patch !== "object") {
                  return sendJson(res, 400, { error: "patch must be an object or null" });
                }
                const storePath = path.resolve(__dirname, "src", "data", "person-meta.json");
                let store: Record<string, Record<string, unknown>> = {};
                if (fs.existsSync(storePath)) {
                  try { store = JSON.parse(fs.readFileSync(storePath, "utf-8")) || {}; } catch { store = {}; }
                }

                if (patch === null) {
                  delete store[personId];
                } else {
                  const entry: Record<string, unknown> = { ...(store[personId] ?? {}) };
                  for (const [k, v] of Object.entries(patch)) {
                    if (v === null || v === undefined || v === "") {
                      delete entry[k];
                    } else {
                      entry[k] = v;
                    }
                  }
                  if (Object.keys(entry).length === 0) delete store[personId];
                  else store[personId] = entry;
                }

                fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n");
                return sendJson(res, 200, { ok: true, entry: store[personId] ?? null });
              } catch (e) {
                return sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/create-record ----
        // Creates records/<id>/record.md for a document spotted online, so the
        // Next card can hand it straight to step 1 of the workflow.
        if (method === "POST" && url.startsWith("/api/create-record")) {
          readBody(req)
            .then((raw) => {
              try {
                const {
                  personId,
                  personName,
                  eventType,
                  note,
                  place,
                  url: linkUrl,
                } = JSON.parse(raw);
                if (!personId || !personName || !eventType || !linkUrl) {
                  return sendJson(res, 400, {
                    error: "personId, personName, eventType and url are required",
                  });
                }

                const TYPE_NAMES: Record<string, string> = {
                  birth: "Birth Record",
                  baptism: "Baptism Record",
                  marriage: "Marriage Record",
                  death: "Death Record",
                  burial: "Burial Record",
                  migration_naturalisation: "Naturalisation Record",
                };

                const slug = (s: unknown) =>
                  String(s ?? "")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^A-Za-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");

                // Quote YAML scalars only when they would otherwise break.
                const yamlScalar = (v: unknown) => {
                  const s = String(v ?? "");
                  if (!s) return "''";
                  if (
                    /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(s) ||
                    /: | #|\n/.test(s) ||
                    /^(true|false|null|~)$/i.test(s)
                  ) {
                    return JSON.stringify(s);
                  }
                  return s;
                };

                const year =
                  (String(note ?? "").match(/\b(1[5-9]\d{2}|20\d{2})\b/) ||
                    [])[1] ?? "undated";
                const placeSlug = slug(place) || "unknown-place";

                // Person ids are already slugged "<given>-<surname>…"; flip them
                // to this repo's Surname-Given record naming, dropping suffixes.
                const tokens = String(personId).split("-").filter(Boolean);
                while (
                  tokens.length > 2 &&
                  /^(sr|jr|ii|iii|iv|bis)$/i.test(tokens[tokens.length - 1])
                ) {
                  tokens.pop();
                }
                const cap = (s?: string) =>
                  s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
                const given = cap(tokens[0]);
                const surname = cap(
                  tokens.length > 1 ? tokens[tokens.length - 1] : tokens[0]
                );
                const personSlug = slug(`${surname}-${given}`);

                const recordsRoot = path.resolve(__dirname, "records");
                const baseId = `${year}_${placeSlug}_${eventType}_${personSlug}`;
                let id = baseId;
                let n = 2;
                while (fs.existsSync(path.join(recordsRoot, id))) {
                  id = `${baseId}-${n++}`;
                }

                const frontMatter = [
                  "---",
                  `id: ${id}`,
                  `type: ${TYPE_NAMES[eventType] ?? "Record"}`,
                  "date: ''",
                  `place: ${yamlScalar(place)}`,
                  "comune: ''",
                  "register: ''",
                  `year: '${year}'`,
                  "atto: ''",
                  "people:",
                  `- ${personId}`,
                  "source_office: ''",
                  "protocol: ''",
                  "transcribed_by: ''",
                  "translated_by: ''",
                  "filed: false",
                  "transcribed: false",
                  "verified: false",
                  "in_app: false",
                  "on_familysearch: false",
                  `image_link: ${JSON.stringify(String(linkUrl))}`,
                  "original_filename: ''",
                  "original_sha256: ''",
                  "links:",
                  '  - label: "Found online"',
                  `    url: ${JSON.stringify(String(linkUrl))}`,
                ];

                const body = [
                  "",
                  "## Notes",
                  `- Created ${new Date().toISOString().slice(0, 10)} from the Next card`,
                  `  ("Found online") for ${personId}. Source link:`,
                  `  ${linkUrl}`,
                  "- No local copy yet: `filed` stays false until the document is",
                  "  downloaded and put through `process inbox`.",
                  "",
                ];

                const newRaw =
                  frontMatter.join("\n") + "\n---\n" + body.join("\n");

                fs.mkdirSync(path.join(recordsRoot, id), { recursive: true });
                fs.writeFileSync(path.join(recordsRoot, id, "record.md"), newRaw);

                return sendJson(res, 200, { ok: true, id });
              } catch (e: any) {
                return sendJson(res, 500, { error: e.message });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/open-inbox ----
        // Reveals ~/Downloads/FAMILY TREE/_inbox in Finder.
        if (method === "POST" && url.startsWith("/api/open-inbox")) {
          try {
            const inbox = path.join(
              os.homedir(),
              "Downloads",
              "FAMILY TREE",
              "_inbox"
            );
            if (!fs.existsSync(inbox)) {
              fs.mkdirSync(inbox, { recursive: true });
            }
            import("child_process").then(({ exec }) => {
              exec(`open "${inbox}"`, (err) => {
                if (err) return sendJson(res, 500, { error: err.message });
                return sendJson(res, 200, { ok: true, path: inbox });
              });
            });
          } catch (e: any) {
            return sendJson(res, 500, { error: e.message });
          }
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


function localCorrespondenceApiPlugin(): Plugin {
  return {
    name: "local-correspondence-api",
    configureServer(server) {
      let dbModulePromise: Promise<{ getDb: () => CorrespondenceDb; getDbPath: () => string }> | null = null;
      const loadDbModule = async (): Promise<{ getDb: () => CorrespondenceDb; getDbPath: () => string }> => {
        if (!dbModulePromise) {
          dbModulePromise = import("./scripts/correspondence-db.mjs").then(
            (m) => ({ getDb: m.getDb, getDbPath: m.getDbPath })
          );
        }
        const mod = await dbModulePromise;
        return mod;
      };
      const loadDb = async (): Promise<CorrespondenceDb> => (await loadDbModule()).getDb();

      const sendJson = (res: ServerResponse, status: number, body: unknown) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      };

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        const method = req.method || "GET";

        // ---- GET /api/correspondence/health ----
        if (method === "GET" && url === "/api/correspondence/health") {
          try {
            const db = await loadDb();
            const version = db.pragma("user_version", { simple: true });
            const tables = db
              .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
              .all()
              .map((r) => String(r.name));
            const counts: Record<string, number> = {};
            for (const t of tables) {
              counts[t] = Number(db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get()?.n ?? 0);
            }
            return sendJson(res, 200, {
              ok: true,
              dbPath: (await loadDbModule()).getDbPath(),
              schemaVersion: version,
              tables,
              counts,
            });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/genealogy/summary ----
        if (method === "GET" && url === "/api/correspondence/genealogy/summary") {
          try {
            const db = await loadDb();
            const definite = Number(db.prepare("SELECT COUNT(*) AS n FROM message_classification WHERE genealogy_relevance = 'definite'").get()?.n ?? 0);
            const possible = Number(db.prepare("SELECT COUNT(*) AS n FROM message_classification WHERE genealogy_relevance = 'possible'").get()?.n ?? 0);
            const unreviewed = Number(db.prepare("SELECT COUNT(*) AS n FROM message_classification WHERE genealogy_relevance IS NULL").get()?.n ?? 0);
            const total = Number(db.prepare("SELECT COUNT(*) AS n FROM messages").get()?.n ?? 0);
            const byAccountRows = db.prepare(
              "SELECT m.account_email, COUNT(*) AS n FROM messages m JOIN message_classification mc ON mc.message_id = m.id GROUP BY m.account_email"
            ).all();
            const byAccount: Record<string, number> = {};
            for (const r of byAccountRows) byAccount[String(r.account_email)] = Number(r.n ?? 0);
            const byTypeRows = db.prepare(
              "SELECT mc.message_type, COUNT(*) AS n FROM message_classification mc GROUP BY mc.message_type"
            ).all();
            const byType: Record<string, number> = {};
            for (const r of byTypeRows) byType[String(r.message_type || 'unknown')] = Number(r.n ?? 0);
            return sendJson(res, 200, {
              ok: true,
              definite,
              possible,
              unreviewed,
              total,
              by_account: byAccount,
              by_type: byType,
            });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/genealogy/messages ----
        if (method === "GET" && url.startsWith("/api/correspondence/genealogy/messages")) {
          try {
            const db = await loadDb();
            const urlObj = new URL(url, "http://localhost");
            const relevance = urlObj.searchParams.get("relevance") || "definite";
            const account = urlObj.searchParams.get("account");
            const type = urlObj.searchParams.get("type");
            const status = urlObj.searchParams.get("status");
            const search = urlObj.searchParams.get("search");
            const dateFilter = urlObj.searchParams.get("date");

            const params = [relevance];
            let whereClause = "mc.genealogy_relevance = ?";

            if (account) {
              whereClause += " AND m.account_email = ?";
              params.push(account);
            }
            if (type) {
              whereClause += " AND mc.message_type = ?";
              params.push(type);
            }
            if (status) {
              whereClause += " AND mc.action_status = ?";
              params.push(status);
            }
            if (search) {
              whereClause += " AND (m.subject LIKE ? OR m.from_name LIKE ? OR m.from_email LIKE ? OR m.account_email LIKE ? OR m.snippet LIKE ?)";
              const s = `%${search}%`;
              params.push(s, s, s, s, s);
            }
            if (dateFilter) {
              const now = new Date();
              if (dateFilter === "today") {
                const today = now.toISOString().slice(0, 10);
                whereClause += " AND m.received_at >= ? AND m.received_at < ?";
                params.push(`${today}T00:00:00Z`, `${today}T23:59:59Z`);
              } else if (dateFilter === "week") {
                whereClause += " AND m.received_at >= ?";
                params.push(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
              } else if (dateFilter === "month") {
                whereClause += " AND m.received_at >= ?";
                params.push(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
              } else if (dateFilter === "year") {
                whereClause += " AND m.received_at >= ?";
                params.push(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
              }
            }

            const rows = db.prepare(
              `SELECT m.id, m.account_email, m.gmail_message_id, m.gmail_thread_id, m.direction,
                      m.from_name, m.from_email, m.subject, m.snippet, m.received_at, m.sent_at,
                      mc.message_type, mc.action_status, mc.genealogy_relevance,
                      (SELECT COUNT(*) FROM attachments a WHERE a.message_id = m.id) AS attachment_count
               FROM messages m
               JOIN message_classification mc ON mc.message_id = m.id
               WHERE ${whereClause}
               ORDER BY m.received_at DESC`
            ).all(params);

            return sendJson(res, 200, { ok: true, messages: rows, count: rows.length });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/messages/:id/detail ----
        const messageDetailMatch = url.match(/^\/api\/correspondence\/messages\/(\d+)\/detail$/);
        if (method === "GET" && messageDetailMatch) {
          try {
            const db = await loadDb();
            const messageId = messageDetailMatch[1];
            const msg = db.prepare(
              `SELECT m.id, m.account_email, m.gmail_message_id, m.gmail_thread_id, m.direction,
                      m.from_name, m.from_email, m.to_json, m.cc_json, m.subject, m.received_at,
                      m.sent_at, m.snippet, m.body_text, m.body_html_path, m.language, m.raw_path,
                      mc.message_type, mc.action_status, mc.genealogy_relevance
               FROM messages m
               JOIN message_classification mc ON mc.message_id = m.id
               WHERE m.id = ?`
            ).get(messageId);

            if (!msg) {
              return sendJson(res, 404, { ok: false, error: "Message not found" });
            }

            const attachments = db.prepare(
              `SELECT id, filename, safe_filename, mime_type, size_bytes, gmail_attachment_id,
                      local_path, ocr_text, created_at, unavailable, unavailable_reason, unavailable_at
               FROM attachments WHERE message_id = ?`
            ).all(messageId);

            return sendJson(res, 200, {
              ok: true,
              message: {
                ...msg,
                attachments,
                attachment_count: attachments.length,
              },
            });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
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
  plugins: [dyadComponentTagger(), react(), localRecordsApiPlugin(), localCorrespondenceApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
