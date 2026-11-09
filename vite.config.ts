import crypto from 'node:crypto';
import { defineConfig, type Plugin } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import os from "os";
import type { ServerResponse, IncomingMessage } from "http";

// Detect if we're running in family mode (use a custom env var; Vite forces
// NODE_ENV to 'production' during `vite build`, which would defeat the check).
const isFamilyBuild = process.env.FAMILY_BUILD === '1';

// Conditional alias for familyData
const conditionalAlias = (isFamilyBuild
  ? { "@/data/familyData": path.resolve(__dirname, "./src/data/family/familyData.generated.ts") }
  : {}) as Record<string, string>;

// Override the plugins configuration for family build
if (isFamilyBuild) {
  // In family mode, we only need the react plugin
  // We don't need the local API plugins in the family build
  // For simplicity, we'll just keep the original plugins but we could filter them here
}

const RECORDS_LOCAL = path.resolve(__dirname, "records-local");

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = "gemini-2.5-flash";

// Gemini key pool: .local/gemini_api_key.txt holds one key per line, `#` comment
// lines and blank lines are skipped, and placeholders like YOUR_KEY_HERE are
// ignored. Keys must start with "AIza...". The app rotates through the pool in
// order; a key that fails (quota / invalid) is marked unusable and the next one
// is tried.
let geminiKeyPool: string[] = [];
let geminiKeyCursor = 0;
const geminiUnusable = new Set<number>();

function loadGeminiKeyPool(): string[] {
  geminiKeyPool = [];
  const geminiKeyPath = path.resolve(process.cwd(), ".local", "gemini_api_key.txt");
  if (fs.existsSync(geminiKeyPath)) {
    const keyLines = fs.readFileSync(geminiKeyPath, "utf8").split("\n");
    for (const ln of keyLines) {
      const t = ln.trim();
      if (!t || t.startsWith("#") || t === "YOUR_KEY_HERE" || !t.startsWith("AIza")) continue;
      geminiKeyPool.push(t);
    }
  }
  geminiKeyCursor = 0;
  geminiUnusable.clear();
  return geminiKeyPool;
}

function nextGeminiKey(): { key: string | null; index: number } {
  if (geminiKeyPool.length === 0) loadGeminiKeyPool();
  const n = geminiKeyPool.length;
  if (n === 0) return { key: null, index: -1 };
  for (let i = 0; i < n; i++) {
    const idx = (geminiKeyCursor + i) % n;
    if (geminiUnusable.has(idx)) continue;
    geminiKeyCursor = (idx + 1) % n;
    return { key: geminiKeyPool[idx], index: idx };
  }
  geminiKeyCursor = 0;
  geminiUnusable.clear();
  return { key: n > 0 ? geminiKeyPool[0] : null, index: 0 };
}

interface CorrespondenceStatement {
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
  run(...params: unknown[]): { changes: number };
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

      server.middlewares.use(async (req, res, next) => {
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

        // ---- POST /api/split-pdf/<id> ----
        // Splits a multi-page PDF into individual page images in records-local/<id>/
        const splitPdfMatch = url.match(/^\/api\/split-pdf\/([^/]+)$/);
        if (method === "POST" && splitPdfMatch) {
          const recordId = splitPdfMatch[1];
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
            .filter((f) => /\.pdf$/i.test(f));
          if (files.length === 0) {
            return sendJson(res, 404, { error: "No PDF files in record folder" });
          }
          const targetFile = files[0];
          const filePath = path.join(dir, targetFile);
          const realPath = path.resolve(filePath);
          const realRoot = path.resolve(RECORDS_LOCAL);
          if (!realPath.startsWith(realRoot + path.sep)) {
            return sendJson(res, 403, { error: "Path traversal denied" });
          }
          try {
            const { execFileSync } = await import("node:child_process");
            // Get page count
            const info = execFileSync("pdfinfo", [realPath], { encoding: "utf8", timeout: 30000 });
            const pageMatch = info.match(/Pages:\s*(\d+)/);
            const pageCount = pageMatch ? parseInt(pageMatch[1], 10) : 1;
            if (pageCount <= 1) {
              return sendJson(res, 200, { ok: true, message: "PDF has only 1 page, nothing to split", pageCount: 1 });
            }
            // Split into individual pages
            const baseName = path.basename(targetFile, ".pdf");
            const splitFiles = [];
            for (let p = 1; p <= pageCount; p++) {
              const outPath = path.join(dir, `${baseName}_p${p}.png`);
              execFileSync("pdftoppm", ["-png", "-r", "300", "-f", String(p), "-l", String(p), "-singlefile", realPath, outPath.replace(/\.png$/, "")], {
                encoding: "utf8",
                timeout: 60000,
              });
              // pdftoppm may append -1.png; find the actual file
              const candidates = fs.readdirSync(dir).filter((f) => f.startsWith(`${baseName}_p${p}`) && f.endsWith(".png"));
              if (candidates.length > 0) {
                splitFiles.push(candidates[0]);
              }
            }
            return sendJson(res, 200, { ok: true, pageCount, splitFiles, message: `Split into ${splitFiles.length} page images` });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/save-transcription/<id> ----
        // Writes transcription text directly to record.md body and sets transcribed=true
        const saveTransMatch = url.match(/^\/api\/save-transcription\/([^/]+)$/);
        if (method === "POST" && saveTransMatch) {
          const recordId = saveTransMatch[1];
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          readBody(req)
            .then((raw) => {
              try {
                const { transcription, setTranscribed } = JSON.parse(raw);
                if (!transcription || typeof transcription !== "string") {
                  return sendJson(res, 400, { error: "transcription required" });
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

                // Set transcribed flag in front matter if requested
                if (setTranscribed === true) {
                  let found = false;
                  for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith("transcribed:")) {
                      lines[i] = "transcribed: true";
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    lines.push("transcribed: true");
                  }
                } else if (setTranscribed === false) {
                  let found = false;
                  for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith("transcribed:")) {
                      lines[i] = "transcribed: false";
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    lines.push("transcribed: false");
                  }
                }

                const newFmYaml = lines.join("\n");
                const newRaw = `---\n${newFmYaml}\n---\n${transcription}\n`;
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

        // ---- POST /api/correspondence/vision/<recordId> ----
        // Gemini visual reading for handwritten/typed acts. Renders up to 4
        // pages to PNG and asks gemini-2.5-flash to transcribe line by line.
        // Dev-only; uses the existing .local/gemini_api_key.txt pool (# comments skipped).
        if (method === "POST" && url.split("?")[0].startsWith("/api/correspondence/vision/")) {
          try {
            const pathOnly = url.split("?")[0];
            const recordId = pathOnly.split("/").pop() || "";
            if (!isSafeRecordId(recordId)) {
              return sendJson(res, 400, { error: "Invalid record id" });
            }
            const urlObj = new URL(url, "http://localhost");
            const requestedFile = urlObj.searchParams.get("file") || "";
            const dir = path.join(RECORDS_LOCAL, recordId);
            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
              return sendJson(res, 404, { error: "Record folder not found" });
            }
            const files = fs.readdirSync(dir)
              .filter((f) => fs.statSync(path.join(dir, f)).isFile())
              .filter((f) => /\.(jpg|jpeg|png|webp|tiff|tif|pdf)$/i.test(f));
            const target = (requestedFile && files.includes(requestedFile)) ? requestedFile : (files.find((f) => /\.pdf$/i.test(f)) || files[0]);
            if (!target) return sendJson(res, 404, { error: "No image/PDF files in record folder" });
            const fp = path.join(dir, target);
            const { execFileSync } = await import("node:child_process");
            const pdftoppm = fs.existsSync("/opt/homebrew/bin/pdftoppm") ? "/opt/homebrew/bin/pdftoppm" : "pdftoppm";
            const tmpBase = path.join(fs.realpathSync(os.tmpdir()), `vision-${Date.now()}`);
            let pagePngs: string[];
            if (/\.pdf$/i.test(target)) {
              const info = execFileSync("pdfinfo", [fp], { encoding: "utf8", timeout: 30000 });
              const m = info.match(/Pages:\s+(\d+)/);
              const n = Math.min(parseInt(m?.[1] || "1", 10), 4);
              execFileSync(pdftoppm, ["-png", "-r", "300", "-f", "1", "-l", String(n), fp, tmpBase], { encoding: "utf8", timeout: 120000 });
              pagePngs = [];
              for (let pgi = 1; pgi <= n; pgi++) pagePngs.push(`${tmpBase}-${pgi}.png`);
            } else {
              pagePngs = [fp];
            }
            const keyFile = path.join(process.cwd(), ".local", "gemini_api_key.txt");
            const keys = fs.readFileSync(keyFile, "utf-8").split("\n")
              .map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.startsWith("AIza"));
            if (keys.length === 0) return sendJson(res, 500, { ok: false, error: "No Gemini keys configured" });
            const prompt = "Transcribe this Italian civil registry act line by line. It mixes pre-printed form text with handwriting. Output format, one per line: `- <field label>: <exact reading as written>`. Rules: transcribe handwriting diplomatically (as written, not normalized); mark unreadable words [?]; keep Italian number words as written; do not translate; do not summarize; skip empty boilerplate lines.";
            const allLines: Array<{ id: string; number: number; text: string; label: string | null; value: string; page: number }> = [];
            const pageTexts: string[] = [];
            let lineNo = 0;
            for (let pi = 0; pi < pagePngs.length; pi++) {
              const b64 = fs.readFileSync(pagePngs[pi]).toString("base64");
              let text = "";
              let lastErr = "";
              for (const key of keys) {
                try {
                  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contents: [{ parts: [
                        { inline_data: { mime_type: "image/png", data: b64 } },
                        { text: prompt },
                      ] }],
                      generationConfig: { temperature: 0.1, maxOutputTokens: 3000, thinkingConfig: { thinkingBudget: 0 } },
                    }),
                  });
                  if (!resp.ok) { lastErr = `HTTP ${resp.status}`; continue; }
                  const data = await resp.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
                  const parts = data.candidates?.[0]?.content?.parts ?? [];
                  text = parts.map((x) => x.text || "").join("");
                  if (text.trim()) break;
                } catch (e) { lastErr = e instanceof Error ? e.message : String(e); }
              }
              if (!text.trim()) return sendJson(res, 502, { ok: false, error: `Gemini reading failed on page ${pi + 1}: ${lastErr}` });
              pageTexts.push(`--- Page ${pi + 1} ---\n${text}`);
              for (const rawLine of text.split("\n")) {
                const t = rawLine.trim().replace(/^-\s*/, "");
                if (!t) continue;
                lineNo++;
                allLines.push({
                  id: `v${pi + 1}-line-${lineNo}`,
                  number: lineNo,
                  text: t,
                  label: t.includes(":") ? t.split(":")[0].trim() : null,
                  value: t.includes(":") ? t.split(":").slice(1).join(":").trim() : t.trim(),
                  page: pi + 1,
                });
              }
            }
            try { for (const f of fs.readdirSync(path.dirname(tmpBase))) { if (f.startsWith(path.basename(tmpBase))) fs.unlinkSync(path.join(path.dirname(tmpBase), f)); } } catch {}
            return sendJson(res, 200, {
              ok: true, text: pageTexts.join("\n\n"), lines: allLines,
              quality: { lineCount: allLines.length, confidence: allLines.length > 5 ? "good" : "fair", pageCount: pagePngs.length, backend: "gemini-vision" },
              file: target, pageCount: pagePngs.length,
            });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/record-page-png/<id>?file=X&page=N ----
        // Renders one record page as PNG bytes (for copy-to-clipboard).
        // PDFs via pdftoppm (absolute binary, symlink-safe paths); images
        // via sips conversion to PNG. Always returns image/png.
        if (method === "GET" && url.split("?")[0].startsWith("/api/record-page-png/")) {
          try {
            const pathOnly = url.split("?")[0];
            const recordId = pathOnly.split("/").pop() || "";
            if (!isSafeRecordId(recordId)) {
              return sendJson(res, 400, { error: "Invalid record id" });
            }
            const urlObj = new URL(url, "http://localhost");
            const file = urlObj.searchParams.get("file") || "";
            const page = Math.max(1, parseInt(urlObj.searchParams.get("page") || "1", 10) || 1);
            const dir = path.join(RECORDS_LOCAL, recordId);
            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
              return sendJson(res, 404, { error: "Record folder not found" });
            }
            const safeDir = path.resolve(dir);
            const fp = path.resolve(safeDir, file);
            if (!file || !fp.startsWith(safeDir + path.sep) || !fs.existsSync(fp)) {
              return sendJson(res, 404, { error: "File not found in record folder" });
            }
            const { execFileSync } = await import("node:child_process");
            const ext = path.extname(fp).toLowerCase();
            let pngBytes: Buffer;
            if (ext === ".pdf") {
              const tmpBase = path.join(fs.realpathSync(os.tmpdir()), `pagepng-${Date.now()}`);
              const pdftoppm = fs.existsSync("/opt/homebrew/bin/pdftoppm") ? "/opt/homebrew/bin/pdftoppm" : "pdftoppm";
              execFileSync(pdftoppm, ["-png", "-r", "200", "-f", String(page), "-l", String(page), "-singlefile", fp, tmpBase], { encoding: "utf8", timeout: 60000 });
              pngBytes = fs.readFileSync(tmpBase + ".png");
              try { fs.unlinkSync(tmpBase + ".png"); } catch {}
            } else if ([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"].includes(ext)) {
              if (ext === ".png") {
                pngBytes = fs.readFileSync(fp);
              } else {
                const tmpOut = path.join(fs.realpathSync(os.tmpdir()), `pagepng-${Date.now()}.png`);
                execFileSync("/usr/bin/sips", ["-s", "format", "png", fp, "--out", tmpOut], { encoding: "utf8", timeout: 60000 });
                pngBytes = fs.readFileSync(tmpOut);
                try { fs.unlinkSync(tmpOut); } catch {}
              }
            } else {
              return sendJson(res, 400, { error: "Not a renderable file" });
            }
            res.writeHead(200, { "Content-Type": "image/png", "Content-Length": pngBytes.length });
            res.end(pngBytes);
            return;
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/ocr/<recordId> ----
        // Runs tesseract OCR. For PDFs, converts ALL pages. For multiple image files,
        // OCRs each one. Returns per-page results with "--- Page N ---" markers.
        const ocrMatch = url.split("?")[0].match(/^\/api\/correspondence\/ocr\/([^/]+)$/);
        if (method === "POST" && ocrMatch) {
          const recordId = ocrMatch[1];
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          const dir = path.join(RECORDS_LOCAL, recordId);
          if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
            return sendJson(res, 404, { error: "Record folder not found" });
          }
          const urlObj = new URL(url, "http://localhost");
          const requestedFile = urlObj.searchParams.get("file");
          const files = fs
            .readdirSync(dir)
            .filter((f) => fs.statSync(path.join(dir, f)).isFile())
            .filter((f) => /\.(jpg|jpeg|png|webp|tiff|tif|pdf)$/i.test(f));
          if (files.length === 0) {
            return sendJson(res, 404, { error: "No image/PDF files in record folder" });
          }
          try {
            const { execFileSync } = await import("node:child_process");
            // Resolve binaries absolutely — the dev server's PATH may not
            // include /opt/homebrew/bin when launched from a GUI app.
            const binCandidates = (name: string) =>
              [`/opt/homebrew/bin/${name}`, `/usr/local/bin/${name}`, name];
            const resolveBin = (name: string): string => {
              for (const c of binCandidates(name)) {
                if (c === name) return c;
                try {
                  if (fs.existsSync(c)) return c;
                } catch { /* ignore */ }
              }
              return name;
            };
            const PDFTOPPM = resolveBin("pdftoppm");
            const TESSERACT = resolveBin("tesseract");
            // Resolve symlinks (/tmp -> /private/tmp) — this tesseract build
            // fails to open files whose path contains a symlink.
            const real = (p: string): string => {
              try { return fs.realpathSync(p); } catch { return p; }
            };
            // Junk-line detector: drops seal/stamp specks (single chars, ©,
            // isolated punctuation) from the editable line list. Raw page
            // text is kept intact.
            const isJunkLine = (line: string): boolean => {
              const t = line.trim();
              if (t.length === 0) return true;
              if (t.length <= 2 && !/[0-9]/.test(t)) return true;
              if (/^[©®©|—–\-_=+*~°º§¶•·…\/\\()\[\]{}<>"'.,;:!?]+$/.test(t)) return true;
              return false;
            };
            let ocrInputs: string[] = [];
            // If a specific file is requested, OCR just that one
            if (requestedFile && files.includes(requestedFile)) {
              const fp = path.join(dir, requestedFile);
              if (/\.pdf$/i.test(requestedFile)) {
                const tmpBase = path.join(os.tmpdir(), `ocr-${Date.now()}`);
                execFileSync(PDFTOPPM, ["-png", "-r", "600", real(fp), real(path.dirname(tmpBase)) + "/" + path.basename(tmpBase)], { encoding: "utf8", timeout: 120000 });
                const cands = fs.readdirSync(path.dirname(tmpBase)).filter((f) => f.startsWith(path.basename(tmpBase)) && f.endsWith(".png")).sort();
                ocrInputs = cands.map((f) => path.join(path.dirname(tmpBase), f));
              } else {
                ocrInputs = [fp];
              }
            } else {
              // No specific file — prefer PNGs over PDFs
              const pngs = files.filter((f) => /\.png$/i.test(f));
              if (pngs.length > 0) {
                ocrInputs = pngs.map((f) => path.join(dir, f));
              } else {
                // Fall back to first PDF, convert all pages
                const pdf = files.find((f) => /\.pdf$/i.test(f));
                if (pdf) {
                  const realPath = path.join(dir, pdf);
                  const tmpBase = path.join(os.tmpdir(), `ocr-${Date.now()}`);
                  execFileSync(PDFTOPPM, ["-png", "-r", "600", real(realPath), real(path.dirname(tmpBase)) + "/" + path.basename(tmpBase)], { encoding: "utf8", timeout: 120000 });
                  const cands = fs.readdirSync(path.dirname(tmpBase)).filter((f) => f.startsWith(path.basename(tmpBase)) && f.endsWith(".png")).sort();
                  ocrInputs = cands.map((f) => path.join(path.dirname(tmpBase), f));
                } else {
                  ocrInputs = [path.join(dir, files[0])];
                }
              }
            }
            if (ocrInputs.length === 0) {
              return sendJson(res, 404, { error: "No files to OCR" });
            }
            // Run tesseract on each input
            const pageResults = [];
            for (let pi = 0; pi < ocrInputs.length; pi++) {
              const result = execFileSync(TESSERACT, [
                real(ocrInputs[pi]), "stdout",
                "-l", "ita+eng",
                "--psm", "6",
              ], { encoding: "utf8", timeout: 120000, maxBuffer: 10 * 1024 * 1024 });
              const text = result || "";
              const rawLines = text.split("\n").filter((l) => l.trim().length > 0);
              const lines = rawLines.map((line, i) => ({
                id: `p${pi + 1}-line-${i + 1}`,
                number: i + 1,
                text: line.trim(),
                label: line.includes(":") ? line.split(":")[0].trim() : null,
                value: line.includes(":") ? line.split(":").slice(1).join(":").trim() : line.trim(),
                page: pi + 1,
                junk: isJunkLine(line),
              }));
              const cleanedText = rawLines.filter((l) => !isJunkLine(l)).join("\n");
              const totalChars = text.replace(/\s/g, "").length;
              const avgLineLength = rawLines.length > 0 ? totalChars / rawLines.length : 0;
              pageResults.push({
                page: pi + 1,
                text,
                cleanedText,
                lines,
                quality: {
                  lineCount: rawLines.length,
                  totalChars,
                  avgLineLength: Math.round(avgLineLength),
                  hasLabels: lines.filter((l) => l.label).length,
                  confidence: rawLines.length > 5 ? "good" : rawLines.length > 2 ? "fair" : "low",
                },
              });
            }
            const markedText = pageResults.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n");
            const allLines = pageResults.flatMap((p) => p.lines);
            const totalChars = pageResults.reduce((sum, p) => sum + p.quality.totalChars, 0);
            const totalLines = pageResults.reduce((sum, p) => sum + p.quality.lineCount, 0);
            const quality = {
              lineCount: totalLines,
              totalChars,
              avgLineLength: totalLines > 0 ? Math.round(totalChars / totalLines) : 0,
              hasLabels: allLines.filter((l) => l.label).length,
              confidence: totalLines > 5 ? "good" : totalLines > 2 ? "fair" : "low",
              pageCount: pageResults.length,
            };
            return sendJson(res, 200, { ok: true, text: markedText, lines: allLines, quality, file: requestedFile || files[0], pageCount: pageResults.length, pages: pageResults });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/ocr-validate ----
        // Accepts pasted text, parses it, and returns a quality assessment
        // with field-by-field validation against known patterns.
        const ocrValidateMatch = url === "/api/correspondence/ocr-validate";
        if (method === "POST" && ocrValidateMatch) {
          try {
            const raw = await readBody(req);
            const { text } = JSON.parse(raw || "{}");
            if (!text || typeof text !== "string") {
              return sendJson(res, 400, { ok: false, error: "text required" });
            }
            const lines = text.split("\n").filter((l) => l.trim().length > 0);
            // Parse field patterns
            const fields: { field: string; value: string; confidence: string; note?: string }[] = [];
            const datePattern = /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/;
            const yearPattern = /\b(1[6-9]\d{2}|20[0-2]\d)\b/;
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.includes(":")) {
                const [label, ...valueParts] = trimmed.split(":");
                const value = valueParts.join(":").trim();
                let confidence = "fair";
                const notes: string[] = [];
                if (datePattern.test(value)) {
                  confidence = "good";
                  notes.push("date pattern found");
                }
                if (yearPattern.test(value)) {
                  if (confidence !== "good") confidence = "fair";
                  notes.push("year found");
                }
                if (value.length < 3) {
                  confidence = "low";
                  notes.push("value too short");
                }
                if (value.length > 100) {
                  confidence = "low";
                  notes.push("value unusually long");
                }
                fields.push({
                  field: label.trim(),
                  value,
                  confidence,
                  note: notes.length > 0 ? notes.join("; ") : undefined,
                });
              } else if (trimmed.length > 0) {
                fields.push({
                  field: "unstructured",
                  value: trimmed,
                  confidence: "low",
                  note: "no label:value separator found",
                });
              }
            }
            const totalFields = fields.length;
            const goodFields = fields.filter((f) => f.confidence === "good").length;
            const fairFields = fields.filter((f) => f.confidence === "fair").length;
            const lowFields = fields.filter((f) => f.confidence === "low").length;
            const score = totalFields > 0
              ? Math.round(((goodFields * 1.0 + fairFields * 0.6 + lowFields * 0.2) / totalFields) * 100)
              : 0;
            return sendJson(res, 200, {
              ok: true,
              fields,
              summary: {
                totalFields,
                goodFields,
                fairFields,
                lowFields,
                score,
                assessment: score >= 80 ? "good" : score >= 50 ? "fair" : "poor",
              },
            });
          } catch (e) {
            return sendJson(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/split-into-records ----
        if (method === "POST" && url === "/api/split-into-records") {
          readBody(req)
            .then(async (raw) => {
              try {
                const { sourceRecordId, sourceFile, assignments } = JSON.parse(raw);
                if (!sourceRecordId || !Array.isArray(assignments) || assignments.length === 0) {
                  return sendJson(res, 400, { error: "sourceRecordId and assignments required" });
                }
                const sourceDir = path.join(RECORDS_LOCAL, sourceRecordId);
                if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
                  return sendJson(res, 404, { error: "Source record folder not found" });
                }
                // Find the source PDF
                const pdfFile = sourceFile || fs.readdirSync(sourceDir).find((f) => /\.pdf$/i.test(f));
                if (!pdfFile) {
                  return sendJson(res, 404, { error: "No PDF in source folder" });
                }
                const sourcePdf = path.join(sourceDir, pdfFile);
                const realSource = path.resolve(sourcePdf);
                const realRoot = path.resolve(RECORDS_LOCAL);
                if (!realSource.startsWith(realRoot + path.sep)) {
                  return sendJson(res, 403, { error: "Path traversal denied" });
                }

                // Step 1: pdfseparate into temp single-page PDFs
                const tmpDir = path.join(os.tmpdir(), `split-${Date.now()}`);
                fs.mkdirSync(tmpDir, { recursive: true });
                const pagePattern = path.join(tmpDir, "page-%d.pdf");
                const { execFileSync } = await import("node:child_process");
                execFileSync("pdfseparate", [realSource, pagePattern], { encoding: "utf8", timeout: 60000 });
                const pageFiles = fs.readdirSync(tmpDir).filter((f) => /^page-\d+\.pdf$/.test(f)).sort((a, b) => {
                  const na = parseInt(a.match(/page-(\d+)\.pdf/)?.[1] || "0", 10);
                  const nb = parseInt(b.match(/page-(\d+)\.pdf/)?.[1] || "0", 10);
                  return na - nb;
                });
                const totalPages = pageFiles.length;

                // Step 2: process each assignment
                const results = [];
                for (const assign of assignments) {
                  const pages = assign.pages;
                  if (!Array.isArray(pages) || pages.length === 0) continue;

                  // Determine target record ID
                  let targetId = assign.targetRecordId;
                  let created = false;
                  if (!targetId || targetId === "new") {
                    // Create a new record
                    const newRec = assign.newRecord || {};
                    const TYPE_NAMES: Record<string, string> = {
                      birth: "Birth Record", baptism: "Baptism Record", marriage: "Marriage Record",
                      death: "Death Record", burial: "Burial Record", migration_naturalisation: "Naturalisation Record",
                    };
                    const slug = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    const year = newRec.year || "undated";
                    const placeSlug = slug(newRec.place) || "unknown-place";
                    const personSlug = slug(newRec.people?.[0] || "unknown").replace(/^([a-z]+)-([a-z]+)$/i, "$2-$1");
                    const baseId = `${year}_${placeSlug}_${newRec.type || "record"}_${personSlug}`;
                    let id = baseId;
                    let n = 2;
                    const recordsRoot = path.resolve(process.cwd(), "records");
                    while (fs.existsSync(path.join(recordsRoot, id))) {
                      id = `${baseId}-${n++}`;
                    }
                    targetId = id;
                    created = true;

                    // Create record.md
                    const recordsDir = path.join(recordsRoot, targetId);
                    fs.mkdirSync(recordsDir, { recursive: true });
                    const frontMatter = [
                      "---",
                      `id: ${targetId}`,
                      `type: ${TYPE_NAMES[newRec.type] ?? "Record"}`,
                      `date: ''`,
                      `place: ${newRec.place || ""}`,
                      "comune: ''",
                      "register: ''",
                      `year: '${year}'`,
                      `atto: '${newRec.atto || ""}'`,
                      "people:",
                      ...(newRec.people || []).map((p: string) => `  - ${p}`),
                      "source_office: ''",
                      "protocol: ''",
                      "transcribed_by: ''",
                      "translated_by: ''",
                      "filed: true",
                      "transcribed: false",
                      "verified: false",
                      "in_app: false",
                      "on_familysearch: false",
                      "pages:",
                      ...pages.map((pg: number) => `  - ${pg}`),
                      "---",
                      "",
                      "# Italian transcription",
                      "",
                      "Transcription pending.",
                      "",
                      "# English translation",
                      "",
                      "Translation pending.",
                      "",
                      "# Uncertain readings",
                      "",
                      "N/A - image not yet transcribed.",
                    ].join("\\n");
                    fs.writeFileSync(path.join(recordsDir, "record.md"), frontMatter);
                  }

                  // Create target record folder
                  const targetDir = path.join(RECORDS_LOCAL, targetId);
                  fs.mkdirSync(targetDir, { recursive: true });

                  // Build the per-record PDF using pdfunite
                  const pagePdfs = pages.map((pg: number) => path.join(tmpDir, `page-${pg}.pdf`));
                  const outPdf = path.join(targetDir, `${targetId}.pdf`);
                  if (pagePdfs.length === 1) {
                    fs.copyFileSync(pagePdfs[0], outPdf);
                  } else {
                    execFileSync("pdfunite", [...pagePdfs, outPdf], { encoding: "utf8", timeout: 60000 });
                  }

                  // Write pages to front matter if record already exists
                  const recordMd = path.join(process.cwd(), "records", targetId, "record.md");
                  if (fs.existsSync(recordMd)) {
                    let fileRaw = fs.readFileSync(recordMd, "utf-8");
                    const fmMatch = fileRaw.match(/^---\\n([\\s\\S]*?)\\n---\\n([\\s\\S]*)$/);
                    if (fmMatch) {
                      const [, fmYaml, bodyText] = fmMatch;
                      const lines = fmYaml.split("\\n");
                      // Remove existing pages block
                      let filtered: string[] = [];
                      let inPages = false;
                      for (const line of lines) {
                        if (line.startsWith("pages:")) { inPages = true; continue; }
                        if (inPages) {
                          if (line.trim() && !line.startsWith(" ")) { inPages = false; filtered.push(line); }
                          continue;
                        }
                        filtered.push(line);
                      }
                      // Append new pages block
                      filtered.push("pages:");
                      for (const pg of pages) filtered.push(`  - ${pg}`);
                      const newYaml = filtered.join("\\n");
                      fs.writeFileSync(recordMd, `---\\n${newYaml}\\n---\\n${bodyText}\\n`);
                    }
                  }

                  results.push({ targetRecordId: targetId, pages, file: `${targetId}.pdf`, created });
                }

                // Clean up temp
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

                const createdCount = results.filter((r) => r.created).length;
                const msg = `Split into ${results.length} record(s)${createdCount > 0 ? ` (${createdCount} new)` : ""}.`;
                return sendJson(res, 200, { ok: true, results, message: msg });
              } catch (e) {
                return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
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

        // ---- POST /api/update-record-people/<id> ----
        if (method === "POST" && url.startsWith("/api/update-record-people/")) {
          const recordId = url.split("/").pop() || "";
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          readBody(req)
            .then(async (raw) => {
              try {
                const { people, mentioned } = JSON.parse(raw);
                if (people !== undefined && !Array.isArray(people)) {
                  return sendJson(res, 400, { error: "people must be an array" });
                }
                if (mentioned !== undefined && !Array.isArray(mentioned)) {
                  return sendJson(res, 400, { error: "mentioned must be an array" });
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

                // Rewrite one YAML list block (people or mentioned).
                // Absent key = leave untouched; empty array writes `key: []`.
                const rewriteBlock = (input: string[], key: string, values: unknown): string[] => {
                  if (values === undefined) return input;
                  const list = Array.isArray(values) ? values : [];
                  const out: string[] = [];
                  let inBlock = false;
                  for (const line of input) {
                    if (line.startsWith(key + ":")) {
                      inBlock = true;
                      continue;
                    }
                    if (inBlock) {
                      if (line.trim() && !line.startsWith(" ")) {
                        inBlock = false;
                        out.push(line);
                      }
                      continue;
                    }
                    out.push(line);
                  }
                  if (list.length > 0) {
                    out.push(key + ":");
                    for (const p of list) {
                      if (typeof p !== "string" || !p.trim()) continue;
                      out.push(`  - ${p.trim()}`);
                    }
                  } else {
                    out.push(key + ": []");
                  }
                  return out;
                };

                let rewritten = rewriteBlock(lines, "people", people);
                rewritten = rewriteBlock(rewritten, "mentioned", mentioned);
                const newYaml = rewritten.join("\n");
                const newRaw = `---\n${newYaml}\n---\n${bodyText}\n`;
                fs.writeFileSync(recordMd, newRaw);
                return sendJson(res, 200, { ok: true });
              } catch (e) {
                return sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) });
              }
            })
            .catch(() => sendJson(res, 500, { error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/update-record-pages/<id> ----
        if (method === "POST" && url.startsWith("/api/update-record-pages/")) {
          const recordId = url.split("/").pop() || "";
          if (!isSafeRecordId(recordId)) {
            return sendJson(res, 400, { error: "Invalid record id" });
          }
          readBody(req)
            .then(async (raw) => {
              try {
                const { pages } = JSON.parse(raw);
                if (!Array.isArray(pages)) {
                  return sendJson(res, 400, { error: "pages must be an array" });
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

                // Remove any existing pages block
                let filteredLines: string[] = [];
                let inPagesBlock = false;
                for (const line of lines) {
                  if (line.startsWith("pages:")) {
                    inPagesBlock = true;
                    continue;
                  }
                  if (inPagesBlock) {
                    if (line.trim() && !line.startsWith(" ")) {
                      inPagesBlock = false;
                      filteredLines.push(line);
                    }
                    continue;
                  }
                  filteredLines.push(line);
                }

                // Append new pages block
                if (pages.length > 0) {
                  filteredLines.push("pages:");
                  for (const pg of pages) {
                    filteredLines.push(`  - ${pg}`);
                  }
                }

                newYaml = filteredLines.join("\n");
                const newRaw = `---\n${newYaml}\n---\n${bodyText}\n`;
                fs.writeFileSync(recordMd, newRaw);
                return sendJson(res, 200, { ok: true });
              } catch (e) {
                return sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) });
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

        // ---- GET /api/free-routes ----
        if (method === "GET" && url === "/api/free-routes") {
          try {
            const p = path.resolve(process.cwd(), "src", "data", "free-routes.json");
            const store = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : { version: 1, routes: {} };
            return sendJson(res, 200, store);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/decisions ----
        if (method === "GET" && url === "/api/decisions") {
          try {
            const storePath = path.resolve(process.cwd(), "src", "data", "decisions-log.json");
            let store = { version: 1, entries: [] as unknown[] };
            if (fs.existsSync(storePath)) {
              try { store = JSON.parse(fs.readFileSync(storePath, "utf-8")) || store; } catch { /* keep default */ }
            }
            return sendJson(res, 200, store);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/decisions ----
        if (method === "POST" && url === "/api/decisions") {
          readBody(req)
            .then((raw) => {
              try {
                const { kind, subject, detail, by } = JSON.parse(raw || "{}");
                if (typeof kind !== "string" || !kind.trim()) {
                  return sendJson(res, 400, { ok: false, error: "kind required" });
                }
                const storePath = path.resolve(process.cwd(), "src", "data", "decisions-log.json");
                let store: { version: number; entries: unknown[] } = { version: 1, entries: [] };
                if (fs.existsSync(storePath)) {
                  try { store = JSON.parse(fs.readFileSync(storePath, "utf-8")) || store; } catch { store = { version: 1, entries: [] }; }
                }
                if (!Array.isArray(store.entries)) store.entries = [];
                store.entries.unshift({
                  ts: new Date().toISOString(),
                  kind: kind.trim(),
                  subject: typeof subject === "string" ? subject : "",
                  detail: typeof detail === "string" ? detail : "",
                  by: typeof by === "string" ? by : "user",
                });
                // keep last 500
                store.entries = store.entries.slice(0, 500);
                fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n");
                return sendJson(res, 200, { ok: true, entry: store.entries[0] });
              } catch (e) {
                return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
              }
            })
            .catch(() => sendJson(res, 500, { ok: false, error: "Failed to read body" }));
          return;
        }

        // ---- POST /api/tree-overrides ----
        // Sidecar persistence for UI-added/edited data (Add Ancestor, delete
        // person, Add Lead / Add Question, status updates). familyData.ts is
        // never written: the store holds operations only (added entities,
        // deleted ids, status overrides), merged over the initial data by
        // src/lib/tree-overrides.ts. `op: "reset"` empties every key (the
        // Reset button in the header).
        if (method === "POST" && url === "/api/tree-overrides") {
          readBody(req)
            .then((raw) => {
              try {
                const body = JSON.parse(raw);
                const storePath = path.resolve(process.cwd(), "src", "data", "tree-overrides.json");
                let store: Record<string, unknown> = {};
                if (fs.existsSync(storePath)) {
                  try { store = JSON.parse(fs.readFileSync(storePath, "utf-8")) || {}; } catch { store = {}; }
                }
                const empty = () => {
                  store = {
                    addedPeople: [],
                    deletedPersonIds: [],
                    addedLeads: [],
                    leadStatus: {},
                    addedQuestions: [],
                    questionStatus: {},
                  };
                };
                if (!store.addedPeople) empty();

                const ID_RE = /^[A-Za-z0-9-]+$/;
                const pushOrReplace = (key: string, entity: { id: unknown }, label: string) => {
                  if (
                    !entity ||
                    typeof entity !== "object" ||
                    typeof entity.id !== "string" ||
                    !ID_RE.test(entity.id)
                  ) {
                    return sendJson(res, 400, { error: `invalid ${label}` });
                  }
                  const list = store[key] as any[];
                  const i = list.findIndex((x) => x.id === entity.id);
                  if (i >= 0) list[i] = entity;
                  else list.push(entity);
                };

                switch (body.op) {
                  case "addPerson": {
                    pushOrReplace("addedPeople", body.person, "person");
                    // Re-adding a previously deleted id revives it.
                    store.deletedPersonIds = (store.deletedPersonIds as string[]).filter(
                      (id) => id !== body.person.id
                    );
                    break;
                  }
                  case "deletePerson": {
                    if (typeof body.personId !== "string" || !ID_RE.test(body.personId)) {
                      return sendJson(res, 400, { error: "invalid personId" });
                    }
                    const ids = new Set(store.deletedPersonIds as string[]);
                    ids.add(body.personId);
                    store.deletedPersonIds = [...ids];
                    break;
                  }
                  case "addLead": {
                    pushOrReplace("addedLeads", body.lead, "lead");
                    break;
                  }
                  case "setLeadStatus": {
                    if (
                      typeof body.leadId !== "string" ||
                      !ID_RE.test(body.leadId) ||
                      !["To Investigate", "In Progress", "Ruled Out", "Completed"].includes(body.status)
                    ) {
                      return sendJson(res, 400, { error: "invalid leadId or status" });
                    }
                    (store.leadStatus as Record<string, string>)[body.leadId] = body.status;
                    break;
                  }
                  case "addQuestion": {
                    pushOrReplace("addedQuestions", body.question, "question");
                    break;
                  }
                  case "setQuestionStatus": {
                    if (
                      typeof body.questionId !== "string" ||
                      !ID_RE.test(body.questionId) ||
                      !["Pending", "In Progress", "Resolved"].includes(body.status)
                    ) {
                      return sendJson(res, 400, { error: "invalid questionId or status" });
                    }
                    (store.questionStatus as Record<string, string>)[body.questionId] = body.status;
                    break;
                  }
                  case "reset": {
                    empty();
                    break;
                  }
                  default:
                    return sendJson(res, 400, { error: "unknown op" });
                }

                fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n");
                return sendJson(res, 200, { ok: true });
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
          const download = new URLSearchParams(url.split("?")[1] || "").get("download") === "1";
          const headers: Record<string, string> = { "Content-Type": mime };
          if (download) {
            const fallback = fileName.replace(/[^\\x20-\\x7E]/g, "_").replace(/["\\\\]/g, "_");
            headers["Content-Disposition"] = `attachment; filename="${fallback}"`;
          }
          res.writeHead(200, headers);
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



const CORRESPONDENCE_MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  xml: "application/xml",
  eml: "message/rfc822",
  p7s: "application/pkcs7-signature",
  txt: "text/plain",
  html: "text/html",
  json: "application/json",
  png: "image/png",
};

const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream", "binary/octet-stream"]);

function sniffMimeType(data: Buffer): string | null {
  if (data.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  const head = data.subarray(0, 256).toString("utf8").replace(/^\uFEFF/, "").trimStart();
  if (head.startsWith("<?xml")) return "application/xml";
  if (data.subarray(0, 2).toString("latin1") === "PK") return "application/zip";
  return null;
}

function attachmentContentDisposition(kind: "inline" | "attachment", filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename).replace(/'/g, "%27");
  return `${kind}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}


// ---- Safe write helper (mirrors scripts/safe_write.py) ----
function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function auditLog(entry: Record<string, unknown>) {
  const auditPath = path.resolve(process.cwd(), "correspondence", "extracted", "audit-log.jsonl");
  const dir = path.dirname(auditPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(auditPath, JSON.stringify(entry) + "\n", "utf8");
}

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock(lockPath: string, timeoutMs: number = 10000): number {
  const start = Date.now();
  const dir = path.dirname(lockPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  while (true) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      fs.writeSync(fd, process.pid + "\n" + Date.now());
      fs.closeSync(fd);
      return fs.openSync(lockPath, 'r+');
    } catch (e: any) {
      if (e.code !== 'EEXIST') throw e;

      try {
        const content = fs.readFileSync(lockPath, 'utf8');
        const lines = content.trim().split("\n");
        const pid = parseInt(lines[0], 10);
        const ts = parseFloat(lines[1] || '0');
        const age = (Date.now() - ts) / 1000;

        if (!isNaN(pid) && !isPidRunning(pid)) {
          try { fs.unlinkSync(lockPath); } catch {}
          continue;
        }
        if (isNaN(pid) && age > 60) {
          try { fs.unlinkSync(lockPath); } catch {}
          continue;
        }
      } catch {
        try { fs.unlinkSync(lockPath); } catch {}
        continue;
      }

      if (Date.now() - start > timeoutMs) {
        throw new Error("Lock timeout: could not acquire " + lockPath);
      }
      const waitUntil = Date.now() + 50;
      while (Date.now() < waitUntil) { /* spin */ }
    }
  }
}

function releaseLock(fd: number, lockPath: string) {
  try { fs.closeSync(fd); } catch {}
  try { fs.unlinkSync(lockPath); } catch {}
}

function safeWriteJson(filePath: string, data: unknown, source: string, expectedVersion?: string | null, changedFields?: string[], reason?: string): string {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const lockPath = filePath + ".lock";
  const lockFd = acquireLock(lockPath, 10000);
  try {
    let currentContent: string | null = null;
    let currentHash: string | null = null;
    if (fs.existsSync(filePath)) {
      currentContent = fs.readFileSync(filePath, "utf8");
      currentHash = computeHash(currentContent);
    }

    if (expectedVersion && expectedVersion !== currentHash) {
      auditLog({
        ts: new Date().toISOString(),
        file: filePath.replace(process.cwd() + "/", ""),
        source,
        status: "rejected",
        changed_fields: changedFields || [],
        reason: reason || null,
        version_before: currentHash ? currentHash.slice(0, 12) : null,
        error: "Stale version: file modified since last read",
      });
      throw new Error("Stale version: " + filePath + " has been modified since last read.");
    }

    const tempPath = filePath + ".tmp." + process.pid;
    const content = JSON.stringify(data, null, 2) + "\n";
    fs.writeFileSync(tempPath, content, "utf8");
    fs.renameSync(tempPath, filePath);

    const newContent = fs.readFileSync(filePath, "utf8");
    const newHash = computeHash(newContent);

    auditLog({
      ts: new Date().toISOString(),
      file: filePath.replace(process.cwd() + "/", ""),
      source,
      status: "accepted",
      changed_fields: changedFields || [],
      reason: reason || null,
      version_before: currentHash ? currentHash.slice(0, 12) : null,
      version_after: newHash.slice(0, 12),
    });

    return newHash;
  } finally {
    releaseLock(lockFd, lockPath);
  }
}


function localCorrespondenceApiPlugin(): Plugin {
  return {
    name: "local-correspondence-api",
    configureServer(server) {
      let dbModulePromise: Promise<{ getDb: () => CorrespondenceDb; getDbPath: () => string; getAttachmentsDir: () => string }> | null = null;
      const loadDbModule = async (): Promise<{ getDb: () => CorrespondenceDb; getDbPath: () => string; getAttachmentsDir: () => string }> => {
        if (!dbModulePromise) {
          dbModulePromise = import("./scripts/correspondence-db.mjs").then(
            (m) => ({ getDb: m.getDb, getDbPath: m.getDbPath, getAttachmentsDir: m.getAttachmentsDir })
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

      const readBody = (req: IncomingMessage): Promise<string> =>
        new Promise((resolve, reject) => {
          let data = "";
          req.on("data", (chunk) => (data += chunk));
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });

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
            const scan = db
              .prepare("SELECT account_email, last_scan_at, last_scan_status, last_error FROM scan_state ORDER BY account_email")
              .all()
              .map((r: any) => ({
                account_email: String(r.account_email),
                last_scan_at: r.last_scan_at ? String(r.last_scan_at) : null,
                last_scan_status: String(r.last_scan_status ?? "ok"),
                last_error: r.last_error ? String(r.last_error) : null,
              }));
            return sendJson(res, 200, {
              ok: true,
              dbPath: (await loadDbModule()).getDbPath(),
              schemaVersion: version,
              tables,
              counts,
              scan,
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
            const relevance = urlObj.searchParams.get("relevance");
            const account = urlObj.searchParams.get("account");
            const type = urlObj.searchParams.get("type");
            const status = urlObj.searchParams.get("status");
            const search = urlObj.searchParams.get("search");
            const dateFilter = urlObj.searchParams.get("date");

            const params: any[] = [];
            let whereClause = "1=1";
            if (relevance && relevance !== "all") {
              whereClause += " AND mc.genealogy_relevance = ?";
              params.push(relevance);
            }

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
              whereClause += " AND (m.subject LIKE ? OR m.from_name LIKE ? OR m.from_email LIKE ? OR m.account_email LIKE ? OR m.snippet LIKE ? OR m.body_text LIKE ?)";
              const s = `%${search}%`;
              params.push(s, s, s, s, s, s);
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

        // ---- GET /api/correspondence/threads/:thread_id/messages ----
        const threadMessagesMatch = url.match(/^\/api\/correspondence\/threads\/([^/]+)\/messages$/);
        if (method === "GET" && threadMessagesMatch) {
          try {
            const db = await loadDb();
            const gmailThreadId = decodeURIComponent(threadMessagesMatch[1]);
            const rows = db.prepare(
              `SELECT m.id, m.direction, m.from_name, m.from_email, m.to_json, m.subject,
                      m.received_at, m.sent_at, m.body_text, m.snippet, m.account_email,
                      mc.message_type, mc.action_status, mc.genealogy_relevance
               FROM messages m
               LEFT JOIN message_classification mc ON mc.message_id = m.id
               WHERE m.gmail_thread_id = ?
               ORDER BY COALESCE(m.received_at, m.sent_at)`
            ).all(gmailThreadId);

            const attStmt = db.prepare(
              `SELECT id, filename, safe_filename, mime_type, size_bytes, gmail_attachment_id,
                      (local_path IS NOT NULL AND local_path != '') AS downloaded,
                      unavailable, unavailable_reason
               FROM attachments WHERE message_id = ?`
            );
            const messages = rows.map((r: any) => {
              const attachments = attStmt.all(r.id).map((a: any) => ({ ...a, downloaded: Boolean(a.downloaded) }));
              return { ...r, attachments, attachment_count: attachments.length };
            });
            return sendJson(res, 200, { ok: true, messages, count: messages.length });
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
                      m.sent_at, m.snippet, m.body_text, m.language,
                      (m.body_html_path IS NOT NULL AND m.body_html_path != '') AS has_body_html,
                      (m.raw_path IS NOT NULL AND m.raw_path != '') AS has_raw,
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
                      (local_path IS NOT NULL AND local_path != '') AS downloaded,
                      created_at, unavailable, unavailable_reason, unavailable_at
               FROM attachments WHERE message_id = ?`
            ).all(messageId).map((a: any) => ({ ...a, downloaded: Boolean(a.downloaded) }));

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

        // ---- GET /api/correspondence/attachments/:id ----
        const attachmentMatch = url.match(/^\/api\/correspondence\/attachments\/(\d+)(?:\?([^#]*))?$/);
        if (method === "GET" && attachmentMatch) {
          try {
            const db = await loadDb();
            const att = db.prepare(
              `SELECT id, filename, safe_filename, mime_type, size_bytes, gmail_attachment_id,
                      local_path, ocr_text, created_at, unavailable, unavailable_reason, unavailable_at
               FROM attachments WHERE id = ?`
            ).get(attachmentMatch[1]);

            if (!att) {
              return sendJson(res, 404, { ok: false, error: "Attachment not found" });
            }
            if (!att.local_path) {
              return sendJson(res, 404, { ok: false, error: "Attachment not downloaded yet" });
            }

            const attachmentsDir = (await loadDbModule()).getAttachmentsDir();
            const resolvedPath = path.resolve(String(att.local_path));
            const allowedRoot = path.resolve(attachmentsDir);
            if (!resolvedPath.startsWith(allowedRoot + path.sep)) {
              return sendJson(res, 403, { ok: false, error: "Attachment path not allowed" });
            }

            const data = fs.readFileSync(resolvedPath);
            const storedMime = typeof att.mime_type === "string" ? att.mime_type.trim() : "";
            const extension = path.extname(String(att.safe_filename || att.filename || "")).replace(".", "").toLowerCase();
            const mimeType = GENERIC_MIME_TYPES.has(storedMime.toLowerCase())
              ? (CORRESPONDENCE_MIME_BY_EXT[extension] || sniffMimeType(data) || "application/octet-stream")
              : storedMime;
            const originalFilename = String(att.filename || att.safe_filename || "attachment");
            const download = new URLSearchParams(attachmentMatch[2] || "").get("download") === "1";
            res.writeHead(200, {
              "Content-Type": mimeType,
              "Content-Length": data.length,
              "Content-Disposition": attachmentContentDisposition(download ? "attachment" : "inline", originalFilename),
              "X-Content-Type-Options": "nosniff",
            });
            return res.end(data);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/assistant/suggestions ----
        if (method === "GET" && url === "/api/assistant/suggestions") {
          try {
            const { execFileSync } = await import("node:child_process");
            const evaluatorPath = path.resolve(process.cwd(), "scripts", "assistant-rules-evaluator.py");
            const output = execFileSync("python3", [evaluatorPath], {
              cwd: process.cwd(),
              encoding: "utf8",
              timeout: 60000,
            });
            const data = JSON.parse(output);
            return sendJson(res, 200, { ok: true, ...data });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/attachment-integrity ----
        if (method === "GET" && url === "/api/correspondence/attachment-integrity") {
          try {
            const { execFileSync } = await import("node:child_process");
            const output = execFileSync("python3", [
              path.resolve(process.cwd(), "scripts", "check-attachment-integrity.py"),
              "--json",
            ], { cwd: process.cwd(), encoding: "utf8", timeout: 120000 });
            const data = JSON.parse(output);
            return sendJson(res, 200, { ok: true, ...data });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/attachment-gate/:messageId ----
        const gateMatch = url.match(/^\/api\/correspondence\/attachment-gate\/(\d+)$/);
        if (method === "GET" && gateMatch) {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "attachment-gate.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, gate: null, reason: "attachment gate has not been run yet" });
            }
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            const gate = (data && data.messages && data.messages[String(gateMatch[1])]) || null;
            return sendJson(res, 200, { ok: true, gate });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
}
 
         // ---- GET /api/assistant/summary ----
         if (method === "GET" && url === "/api/assistant/summary") {
           try {
             const { execFileSync } = await import("node:child_process");
             const scriptPath = path.resolve(process.cwd(), "scripts", "assistant-summary.py");
             const output = execFileSync("python3", [scriptPath], {
               cwd: process.cwd(),
               encoding: "utf8",
               timeout: 30000,
             });
             const data = JSON.parse(output);
             return sendJson(res, 200, { ok: true, ...data });
           } catch (e) {
             return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
           }
         }
 
         // ---- POST /api/assistant/draft ----
         if (method === "POST" && url === "/api/assistant/draft") {
           try {
             const raw = await readBody(req);
             const { threadId, gmailThreadId, accountEmail, prompt, model: requestedModel } = JSON.parse(raw || "{}");
             if (!threadId || !prompt) {
               return sendJson(res, 400, { ok: false, error: "Missing threadId or prompt" });
             }

             const modelChoice = (requestedModel || "").toLowerCase();
             let draft = "";
             let usedModel = "";

             const generateGeminiDraft = async (key: string) => {
               const geminiPrompt = `${prompt}\n\nGenerate ONLY the email body (no subject, no signature placeholders). Keep it concise and professional.`;
               const { execFileSync } = await import("node:child_process");
               const result = execFileSync("curl", [
                 "-s", "-X", "POST",
                 `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`,
                 "-H", "Content-Type: application/json",
                 "-d", JSON.stringify({
                   contents: [{ parts: [{ text: geminiPrompt }] }],
                   generationConfig: { temperature: 0.3, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
                 }),
               ], { cwd: process.cwd(), encoding: "utf8", timeout: 120000 });
               const geminiResponse = JSON.parse(result);
               if (geminiResponse?.error) {
                 return { ok: false as const, text: "" };
               }
               const text = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
               return { ok: true as const, text };
             };

             // Gemini via key pool (rotate to next key when one fails)
             const useGemini = (modelChoice === "gemini" || modelChoice === "");
             if (useGemini) {
               for (let attempt = 0; attempt < 3; attempt++) {
                 const { key, index } = nextGeminiKey();
                 if (!key) break;
                 try {
                   const out = await generateGeminiDraft(key);
                   if (out.ok) {
                     draft = out.text;
                     usedModel = GEMINI_MODEL;
                     break;
                   }
                   geminiUnusable.add(index);
                 } catch {
                   geminiUnusable.add(index);
                 }
               }
             }

             // Ollama fallback (qwen or llama)
             if (!draft) {
               const ollamaModel = modelChoice === "llama" ? "llama3.2:latest" : "qwen2.5:14b";
               const { execFileSync } = await import("node:child_process");
               const ollamaPrompt = `${prompt}\n\nGenerate ONLY the email body (no subject, no signature placeholders). Keep it concise and professional.`;
               const result = execFileSync("curl", [
                 "-s", "-X", "POST", "http://localhost:11434/api/generate",
                 "-H", "Content-Type: application/json",
                 "-d", JSON.stringify({
                   model: ollamaModel,
                   prompt: ollamaPrompt,
                   stream: false,
                   options: { temperature: 0.3, top_p: 0.9, num_predict: 512 },
                 }),
               ], { cwd: process.cwd(), encoding: "utf8", timeout: 120000 });
               const ollamaResponse = JSON.parse(result);
               draft = ollamaResponse.response || "";
               usedModel = ollamaModel;
             }

             // Generate subject from draft first line or institution
             const subject = `Re: ${accountEmail.includes("info") ? "Genealogy Inquiry" : "Genealogy Correspondence"}`;
 
             return sendJson(res, 200, { ok: true, draft, subject, model: usedModel });
           } catch (e) {
             return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
           }
         }

         // ---- POST /api/assistant/translate ----
         if (method === "POST" && url === "/api/assistant/translate") {
           try {
             const raw = await readBody(req);
             const { text, target } = JSON.parse(raw || "{}");
             if (!text || typeof text !== "string") {
               return sendJson(res, 400, { ok: false, error: "text required" });
             }
             const targetLang = target === "it" ? "Italian" : "English";
             const prompt = `Translate the following text to ${targetLang}. Output ONLY the translation, nothing else.\n\n${text}`;
             const generateGeminiTranslation = async (key: string) => {
               const { execFileSync } = await import("node:child_process");
               const result = execFileSync("curl", [
                 "-s", "-X", "POST",
                 `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`,
                 "-H", "Content-Type: application/json",
                 "-d", JSON.stringify({
                   contents: [{ parts: [{ text: prompt }] }],
                   generationConfig: { temperature: 0.1, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
                 }),
               ], { cwd: process.cwd(), encoding: "utf8", timeout: 120000 });
               const geminiResponse = JSON.parse(result);
               if (geminiResponse?.error) {
                 return { ok: false as const, text: "" };
               }
               const text = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
               return { ok: true as const, text };
             };
             let translation = "";
             for (let attempt = 0; attempt < 3; attempt++) {
               const { key, index } = nextGeminiKey();
               if (!key) break;
               try {
                 const out = await generateGeminiTranslation(key);
                 if (out.ok) {
                   translation = out.text;
                   break;
                 }
                 geminiUnusable.add(index);
               } catch {
                 geminiUnusable.add(index);
               }
             }
             if (!translation) {
               return sendJson(res, 503, { ok: false, error: "Gemini unavailable after rotating through configured keys (.local/gemini_api_key.txt)" });
             }
             return sendJson(res, 200, { ok: true, translation: translation.trim() });
           } catch (e) {
             return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
           }
         }
 
         // ---- POST /api/assistant/draft-save ----
         if (method === "POST" && url === "/api/assistant/draft-save") {
           try {
             const raw = await readBody(req);
             const { threadId, gmailThreadId, accountEmail, draft, subject, to } = JSON.parse(raw || "{}");
             if (!threadId || !draft) {
               return sendJson(res, 400, { ok: false, error: "Missing threadId or draft" });
             }
 
             const draftsDir = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
             if (!fs.existsSync(draftsDir)) fs.mkdirSync(draftsDir, { recursive: true });
 
             const safeId = gmailThreadId.replace(/[^A-Za-z0-9_-]/g, "_");
             const draftPath = path.join(draftsDir, `${safeId}.json`);
             const draftData = {
               threadId,
               gmailThreadId,
               accountEmail,
               draft,
               subject,
               to,
               createdAt: new Date().toISOString(),
             };
             fs.writeFileSync(draftPath, JSON.stringify(draftData, null, 2), "utf8");
 
             return sendJson(res, 200, { ok: true, path: draftPath });
           } catch (e) {
             return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
           }
         }
 
         // ---- POST /api/assistant/draft-send-gmail ----
         if (method === "POST" && url === "/api/assistant/draft-send-gmail") {
           try {
             const raw = await readBody(req);
             const { threadId, gmailThreadId, accountEmail, draft, subject, to } = JSON.parse(raw || "{}");
             if (!threadId || !draft || !accountEmail) {
               return sendJson(res, 400, { ok: false, error: "Missing required fields" });
             }
 
             // Only available for accounts with compose scope
             const composeAuthPath = path.resolve(process.cwd(), ".local", "gmail_auth_compose.json");
             if (!fs.existsSync(composeAuthPath)) {
               return sendJson(res, 403, { ok: false, error: "No compose auth configured" });
             }
             const composeAuth = JSON.parse(fs.readFileSync(composeAuthPath, "utf8"));
             if (!composeAuth[accountEmail] || !composeAuth[accountEmail].scopes?.some((s: string) => s.includes("gmail.compose"))) {
               return sendJson(res, 403, { ok: false, error: "Account does not have Gmail compose scope" });
             }
 
             // Use googleapis to create draft in Gmail
             const { google } = require("googleapis");
             const auth = new google.auth.OAuth2(
               composeAuth[accountEmail].client_id,
               composeAuth[accountEmail].client_secret,
               "http://localhost:8080/oauth2callback"
             );
             auth.setCredentials({
               access_token: composeAuth[accountEmail].access_token,
               refresh_token: composeAuth[accountEmail].refresh_token,
             });
 
             const gmail = google.gmail({ version: "v1", auth });
 
             // Build RFC 2822 message
             const messageParts = [
               `From: ${accountEmail}`,
               `To: ${to || accountEmail}`,
               `Subject: ${subject}`,
               `In-Reply-To: <${gmailThreadId}>`,
               `References: <${gmailThreadId}>`,
               "Content-Type: text/plain; charset=UTF-8",
               "",
               draft,
             ];
             const rawMessage = messageParts.join("\r\n");
             const encodedMessage = Buffer.from(rawMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
 
             await gmail.users.drafts.create({
               userId: "me",
               requestBody: {
                 message: { raw: encodedMessage, threadId: gmailThreadId },
               },
             });
 
             return sendJson(res, 200, { ok: true, message: "Draft created in Gmail" });
           } catch (e) {
             return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
           }
         }
 
         // ---- GET /api/correspondence/request-links ----
        if (method === "GET" && url === "/api/correspondence/request-links") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "request-links.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, request_links: { version: 1, requests: {} } });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            return sendJson(res, 200, { ok: true, request_links: JSON.parse(raw) });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        const requestLinkMatch = url.match(/^\/api\/correspondence\/request-links\/([^/]+)$/);
        if (method === "GET" && requestLinkMatch) {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "request-links.json");
            if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: "not found" });
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            const r = (data.requests || {})[requestLinkMatch[1]];
            if (!r) return sendJson(res, 404, { ok: false, error: "request not found" });
            return sendJson(res, 200, { ok: true, request: r });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/request-links/:id/confirm-link ----
        const confirmLinkMatch = url.match(/^\/api\/correspondence\/request-links\/([^/]+)\/confirm-link$/);
        if (method === "POST" && confirmLinkMatch) {
          try {
            const raw = await readBody(req);
            const { thread_id, message_id } = JSON.parse(raw || "{}");
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "build-request-links.py"), "--confirm-link", confirmLinkMatch[1], String(thread_id), String(message_id)], { cwd: process.cwd(), timeout: 60000 });
            return sendJson(res, 200, { ok: true });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/request-links/:id/reject-link ----
        const rejectLinkMatch = url.match(/^\/api\/correspondence\/request-links\/([^/]+)\/reject-link$/);
        if (method === "POST" && rejectLinkMatch) {
          try {
            const raw = await readBody(req);
            const { thread_id, message_id } = JSON.parse(raw || "{}");
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "build-request-links.py"), "--reject-link", rejectLinkMatch[1], String(thread_id), String(message_id)], { cwd: process.cwd(), timeout: 60000 });
            return sendJson(res, 200, { ok: true });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/request-links/:id/mark-reviewed ----
        const markReviewedMatch = url.match(/^\/api\/correspondence\/request-links\/([^/]+)\/mark-reviewed$/);
        if (method === "POST" && markReviewedMatch) {
          try {
            const raw = await readBody(req);
            const { reason } = JSON.parse(raw || "{}");
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "build-request-links.py"), "--mark-reviewed", markReviewedMatch[1], reason || "reviewed"], { cwd: process.cwd(), timeout: 60000 });
            return sendJson(res, 200, { ok: true });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/request-links/:id/review-ambiguity ----
        const reviewAmbMatch = url.match(/^\/api\/correspondence\/request-links\/([^/]+)\/review-ambiguity$/);
        if (method === "POST" && reviewAmbMatch) {
          try {
            const raw = await readBody(req);
            const { decision } = JSON.parse(raw || "{}");
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "build-request-links.py"), "--review-ambiguity", reviewAmbMatch[1], decision || "reviewed"], { cwd: process.cwd(), timeout: 60000 });
            return sendJson(res, 200, { ok: true });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/request-links/:id/confirm-fulfilled ----
        const confirmMatch = url.match(/^\/api\/correspondence\/request-links\/([^/]+)\/confirm-fulfilled$/);
        if (method === "POST" && confirmMatch) {
          try {
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "build-request-links.py"), "--confirm-fulfilled", confirmMatch[1]], { cwd: process.cwd(), timeout: 60000 });
            return sendJson(res, 200, { ok: true });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/sent-request?personId=…&eventType=… ----
        if (method === "GET" && url.startsWith("/api/correspondence/sent-request")) {
          try {
            const u = new URL(url, "http://localhost");
            const personId = u.searchParams.get("personId") || "";
            const eventType = u.searchParams.get("eventType") || "";
            if (!personId) return sendJson(res, 400, { ok: false, error: "personId required" });

            const db = await loadDb();
            // Primary signal: threads linked to this person via thread_links.
            const linkedThreads = db.prepare(
              "SELECT thread_id FROM thread_links WHERE entity_type='person' AND entity_id=?"
            ).all(personId).map((r: any) => Number(r.thread_id));

            // Event keyword map.
            const kwMap: Record<string, string[]> = {
              birth: ["nascita", "birth", "atto di nascita"],
              baptism: ["battesimo", "baptism", "baptismal"],
              marriage: ["matrimonio", "marriage", "atto di matrimonio"],
              death: ["morte", "death", "atto di morte"],
              burial: ["sepoltura", "burial", "cimitero", "cemetery"],
              migration_naturalisation: ["naturalizzazione", "naturalisation", "naturalization", "passenger", "emigrazione"],
            };
            const keywords = kwMap[eventType] || [];

            // Search outbound messages in linked threads (and fallback: all outbound mentioning person surname).
            let candidates: any[] = [];
            if (linkedThreads.length > 0) {
              const placeholders = linkedThreads.map(() => "?").join(",");
              candidates = db.prepare(
                `SELECT id, gmail_thread_id, from_email, to_json, subject, sent_at, body_text
                 FROM messages WHERE direction='out' AND thread_id IN (${placeholders})
                 ORDER BY sent_at DESC`
              ).all(...linkedThreads);
            }

            // Filter by event keyword if possible.
            let best = null;
            for (const c of candidates) {
              const text = `${c.subject || ""} ${c.body_text || ""}`.toLowerCase();
              const matchesKw = keywords.length === 0 || keywords.some((k) => text.includes(k));
              if (matchesKw) { best = c; break; }
            }
            // Fallback: any outbound in linked threads.
            if (!best && candidates.length > 0) best = candidates[0];

            // Surname fallback: thread_links is often empty, so search ALL
            // outbound mail mentioning the person's surname + event keywords.
            // This is what catches requests the linker never saw.
            if (!best) {
              const surname = (u.searchParams.get("surname") || "").trim();
              if (surname.length > 2) {
                const surnameHits = db.prepare(
                  `SELECT id, gmail_thread_id, from_email, to_json, subject, sent_at, body_text
                   FROM messages WHERE direction='out'
                   AND (subject LIKE ? OR body_text LIKE ?)
                   ORDER BY sent_at DESC LIMIT 25`
                ).all(`%${surname}%`, `%${surname}%`);
                for (const c of surnameHits) {
                  const text = `${c.subject || ""} ${c.body_text || ""}`.toLowerCase();
                  const matchesKw = keywords.length === 0 || keywords.some((k) => text.includes(k));
                  if (matchesKw) { best = c; break; }
                }
                if (!best && surnameHits.length > 0) best = surnameHits[0];
              }
            }

            if (!best) return sendJson(res, 200, { ok: true, found: false });

            let recipient = "";
            try {
              const to = JSON.parse(best.to_json || "[]");
              recipient = (to[0]?.email || to[0]?.name || "").toString();
            } catch { recipient = ""; }

            return sendJson(res, 200, {
              ok: true,
              found: true,
              sent_at: best.sent_at,
              recipient,
              message_id: best.id,
              thread_id: best.gmail_thread_id,
              subject: best.subject,
            });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/person-requests (per-person open request counts) ----
        if (method === "GET" && url === "/api/correspondence/person-requests") {
          try {
            const db = await loadDb();
            // Open actions linked to a person via thread_links.
            const stmt = db.prepare(`
              SELECT tl.entity_id AS person_id,
                     a.id AS action_id,
                     a.description AS description,
                     a.status AS status,
                     a.owner AS owner,
                     t.id AS thread_id,
                     t.subject AS subject,
                     t.status AS thread_status
              FROM thread_links tl
              JOIN threads t ON t.id = tl.thread_id
              LEFT JOIN actions a ON a.thread_id = t.id
              WHERE tl.entity_type = 'person'
            `);
            const rows = stmt.all();
            const byPerson = new Map();
            for (const r of rows) {
              const pid = String(r.person_id);
              if (!byPerson.has(pid)) byPerson.set(pid, { person_id: pid, open_count: 0, actions: [] });
              const entry = byPerson.get(pid);
              if (r.status === 'open' || r.status === null) {
                entry.open_count += 1;
                entry.actions.push({
                  action_id: r.action_id,
                  description: r.description,
                  owner: r.owner,
                  thread_id: r.thread_id,
                  subject: r.subject,
                  thread_status: r.thread_status,
                });
              }
            }
            const result = Array.from(byPerson.values()).map((e) => ({
              ...e,
              hold: e.open_count >= 2,
              rule: e.open_count >= 2
                ? 'HOLD: 2+ open requests for this person — wait for replies before sending more.'
                : 'OK: fewer than 2 open requests.',
            }));
            return sendJson(res, 200, { ok: true, people: result });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/threads/:id/close (close loop + thank-you draft) ----
        const closeThreadMatch = url.match(/^\/api\/correspondence\/threads\/([^/]+)\/close$/);
        if (method === "POST" && closeThreadMatch) {
          try {
            const idParam = decodeURIComponent(closeThreadMatch[1]);
            const db = await loadDb();
            // Resolve to db thread row.
            let row = db.prepare("SELECT id, account_email, gmail_thread_id, subject FROM threads WHERE gmail_thread_id = ?").get(idParam);
            if (!row) {
              const n = Number(idParam);
              if (!isNaN(n)) row = db.prepare("SELECT id, account_email, gmail_thread_id, subject FROM threads WHERE id = ?").get(n);
            }
            if (!row) return sendJson(res, 404, { ok: false, error: "Thread not found" });
            const tid = Number(row.id);
            const gtid = String(row.gmail_thread_id);
            const acct = String(row.account_email);
            const subject = String(row.subject || '');
            // Mark thread completed.
            db.prepare("UPDATE threads SET status='completed', waiting_on='none', updated_at=datetime('now') WHERE id=?").run(tid);
            // Mark actions done.
            db.prepare("UPDATE actions SET status='done', completed_at=datetime('now') WHERE thread_id=? AND status='open'").run(tid);
            // Generate thank-you draft file.
            const draftsDir = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
            fs.mkdirSync(draftsDir, { recursive: true });
            const thankYou = "Gentili Signori,\n\nDesidero ringraziarvi per la risposta e per il lavoro svolto in relazione alla mia richiesta. " +
              "Apprezzo molto la vostra disponibilità e la professionalità dimostrata.\n\n" +
              "Cordiali saluti,\nDaniele Buatti\ndaniele.buatti@gmail.com\ninfo@danielebuatti.com";
            // Record a decision (memory as data).
            try {
              const decPath = path.resolve(process.cwd(), "src", "data", "decisions-log.json");
              let decStore: { version: number; entries: unknown[] } = { version: 1, entries: [] };
              if (fs.existsSync(decPath)) {
                try { decStore = JSON.parse(fs.readFileSync(decPath, "utf-8")) || decStore; } catch { decStore = { version: 1, entries: [] }; }
              }
              if (!Array.isArray(decStore.entries)) decStore.entries = [];
              decStore.entries.unshift({ ts: new Date().toISOString(), kind: "close_thread", subject: gtid, detail: `Closed thread "${subject}" and generated thank-you draft.`, by: "user" });
              decStore.entries = decStore.entries.slice(0, 500);
              fs.writeFileSync(decPath, JSON.stringify(decStore, null, 2) + "\\n");
            } catch { /* non-fatal */ }

            const draftPath = path.resolve(draftsDir, gtid + "_thankyou.json");
            fs.writeFileSync(draftPath, JSON.stringify({
              thread_id: gtid,
              draft_text: thankYou,
              language: "Italian",
              generated_at: new Date().toISOString(),
              model: "template",
              context_summary: `Thank-you / close for thread: ${subject}`,
              review_status: "draft",
              edited_text: null,
              reviewed_at: null,
              reply_reason: "close_loop",
              provenance: { source_thread: gtid, account: acct },
            }, null, 2), "utf8");
            return sendJson(res, 200, { ok: true, thread_id: gtid, draft_path: draftPath });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/drafts ----
        if (method === "GET" && url === "/api/correspondence/drafts") {
          try {
            const draftsDir = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
            if (!fs.existsSync(draftsDir)) return sendJson(res, 200, { ok: true, drafts: [] });
            const files = fs.readdirSync(draftsDir).filter((f: string) => f.endsWith(".json"));
            let threadsData: any = {};
            try {
              const tp = path.resolve(process.cwd(), "correspondence", "extracted", "threads.json");
              if (fs.existsSync(tp)) threadsData = (JSON.parse(fs.readFileSync(tp, "utf8")) || {}).threads || {};
            } catch { /* ignore */ }
            const drafts: any[] = [];
            for (const f of files) {
              try {
                const raw = fs.readFileSync(path.join(draftsDir, f), "utf8");
                const d = JSON.parse(raw);
                const thread = threadsData[d.thread_id] || {};
                const lastInbound = thread.chronology ? thread.chronology.filter((c: any) => c.direction === 'in').pop() : null;
                const originalSummary = lastInbound ? (lastInbound.subject || lastInbound.evidence || '').slice(0, 200) : (thread.title || '').slice(0, 200);
                const _readiness = d.readiness || d.review_status || "draft";
                const _suppressed = !!(d.suppressed) || !!(d.provenance && d.provenance.suppressed) || !!(d.provenance && d.provenance.suggested_new_correspondence && d.provenance.suggested_new_correspondence.suppressed);
                const _suppressionReason = (d.suppression_reason) ||
                  (d.provenance && d.provenance.suppression_reason) ||
                  (d.provenance && d.provenance.suggested_new_correspondence && d.provenance.suggested_new_correspondence.suppression_reason) || null;
                // Lifecycle category: actionable | needs_review | blocked | sent | retired
                const _lifecycle = (() => {
                  const r = String(_readiness).toLowerCase();
                  if (r === 'retired' || r === 'superseded') return 'retired';
                  if (r === 'sent' || r === 'possible_sent_reply') return 'sent';
                  if (r === 'blocked' || _suppressed) return 'blocked';
                  if (r === 'incomplete') return 'needs_review';
                  if (r === 'ready' || r === 'ready_for_review') return 'actionable';
                  return 'needs_review';
                })();
                drafts.push({
                  filename: f,
                  thread_id: d.thread_id,
                  draft_type: d.draft_type || "reply",
                  recipient: d.recipient,
                  recipient_email: d.recipient_email || null,
                  subject: d.subject_suggestion || thread.title || null,
                  readiness: _readiness,
                  status: d.status || _readiness,
                  lifecycle: d.lifecycle || _lifecycle,
                  lifecycle_category: _lifecycle,
                  is_actionable: _lifecycle === 'actionable',
                  is_retired: _lifecycle === 'retired',
                  is_blocked: _lifecycle === 'blocked',
                  is_suppressed: _suppressed,
                  suppressed: _suppressed,
                  reply_required: d.reply_required !== undefined ? !!d.reply_required : null,
                  retirement_reason: d.retirement_reason || null,
                  postal_address_supplied: !!d.postal_address_supplied,
                  physical_certificate_outstanding: !!d.physical_certificate_outstanding,
                  warnings: d.warnings || [],
                  verification_readiness: (d.verification && d.verification.readiness) || d.readiness || null,
                  verification_findings: (d.verification && d.verification.findings) || [],
                  gmail_draft_id: d.gmail_draft_id || null,
                  gmail_draft_created_at: d.gmail_draft_created_at || null,
                  gmail_draft_status: d.gmail_draft_status || null,
                  gmail_body_changed: !!d.gmail_draft_id && !!d.gmail_draft_body_hash && d.gmail_draft_body_hash !== crypto.createHash('sha256').update(d.draft_text || '').digest('hex'),
                  sent_message_id: d.sent_message_id || null,
                  sent_at: d.sent_at || null,
                  match_confidence: d.match_confidence || null,
                  match_type: d.match_type || null,
                  has_gmail_draft: !!d.gmail_draft_id,
                  source_messages: (d.provenance && d.provenance.source_messages) || [],
                  request_links: (d.provenance && d.provenance.request_links) || [],
                  suppression_reason: _suppressionReason,
                  ancestors: thread.person_names || [],
                  record_refs: thread.record_refs || [],
                  reply_reason: d.reply_reason || null,
                  generated_at: d.generated_at,
                  draft_text: d.draft_text,
                  draft_text_en: d.draft_text_en || null,
                  subject_translation_en: d.subject_translation_en || null,
                  translation_status: d.translation_status || null,
                  translation_error: d.translation_error || null,
                  correspondence_action: d.draft_type === "new_correspondence"
                    ? (d.thread_id && !d.thread_id.endsWith("_new") ? "Start new thread (originating from existing correspondence)" : "New standalone enquiry")
                    : "Reply in existing thread",
                });
              } catch { /* skip malformed */ }
            }
            const _prio: any = { actionable: 0, needs_review: 1, blocked: 2, sent: 3, retired: 4 };
            drafts.sort((a: any, b: any) => (_prio[a.lifecycle_category] ?? 9) - (_prio[b.lifecycle_category] ?? 9) || String(a.filename).localeCompare(String(b.filename)));
            return sendJson(res, 200, { ok: true, drafts });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        // ---- POST /api/correspondence/drafts/:filename/translate ----
        const translateMatch = url.match(/^\/api\/correspondence\/drafts\/([^/]+)\/translate$/);
        if (method === "POST" && translateMatch) {
          try {
            const filename = decodeURIComponent(translateMatch[1]);
            const draftPath = path.resolve(process.cwd(), "correspondence", "extracted", "drafts", filename);
            const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
            if (!draftPath.startsWith(allowedRoot + path.sep)) {
              return sendJson(res, 403, { ok: false, error: "Path not allowed" });
            }
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "translate-draft.py"), draftPath], { cwd: process.cwd(), timeout: 300000 });
            const updated = JSON.parse(fs.readFileSync(draftPath, "utf8"));
            return sendJson(res, 200, { ok: true, translation_status: updated.translation_status, draft_text_en: updated.draft_text_en, subject_translation_en: updated.subject_translation_en, translation_error: updated.translation_error });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/drafts/:filename/create-gmail ----
        const createGmailMatch = url.match(/^\/api\/correspondence\/drafts\/([^/]+)\/create-gmail$/);
        if (method === "POST" && createGmailMatch) {
          try {
            const filename = decodeURIComponent(createGmailMatch[1]);
            const draftPath = path.resolve(process.cwd(), "correspondence", "extracted", "drafts", filename);
            const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
            if (!draftPath.startsWith(allowedRoot + path.sep)) {
              return sendJson(res, 403, { ok: false, error: "Path not allowed" });
            }
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "create-gmail-draft.py"), draftPath, "--approve"], { cwd: process.cwd(), timeout: 120000 });
            const updated = JSON.parse(fs.readFileSync(draftPath, "utf8"));
            return sendJson(res, 200, { ok: true, gmail_draft_id: updated.gmail_draft_id, gmail_draft_status: updated.gmail_draft_status });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/sweep/summary ----
        if (method === "GET" && url === "/api/sweep/summary") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "sweep-summary.json");
            if (!fs.existsSync(filePath)) return sendJson(res, 200, { ok: true, summary: null });
            return sendJson(res, 200, { ok: true, summary: JSON.parse(fs.readFileSync(filePath, "utf8")) });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        // ---- POST /api/sweep/run ----
        if (method === "POST" && url === "/api/sweep/run") {
          try {
            const raw = await readBody(req);
            const body = JSON.parse(raw || "{}");
            const args = [path.resolve(process.cwd(), "scripts", "run-sweep.py")];
            if (body.dry_run) args.push("--dry-run");
            if (body.limit) { args.push("--limit"); args.push(String(body.limit)); }
            if (body.since) { args.push("--since"); args.push(String(body.since)); }
            if (body.skip_sync) args.push("--skip-sync");
            if (body.skip_analysis) args.push("--skip-analysis");
            if (body.skip_drafts) args.push("--skip-drafts");
            if (body.max_drafts) { args.push("--max-drafts"); args.push(String(body.max_drafts)); }
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", args, { cwd: process.cwd(), timeout: 590000 });
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "sweep-summary.json");
            const summary = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
            return sendJson(res, 200, { ok: true, summary });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/analysis/:id ----
        const analysisMatch = url.match(/^\/api\/correspondence\/analysis\/(\d+)$/);
        if (method === "GET" && analysisMatch) {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "analysis", `message_${analysisMatch[1]}.json`);
            const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "analysis");
            if (!filePath.startsWith(allowedRoot + path.sep)) {
              return sendJson(res, 403, { ok: false, error: "Path not allowed" });
            }
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 404, { ok: false, error: "Analysis not available" });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(raw);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/reviews ----
        if (method === "GET" && url === "/api/correspondence/reviews") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "reviews.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, reviews: {} });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, reviews: (data && data.reviews) || {} });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/reviews ----
        if (method === "POST" && url === "/api/correspondence/reviews") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const payload = JSON.parse(body || "{}");
              const messageId = String(payload.message_id || "");
              const factKey = String(payload.fact_key || "");
              const decision = String(payload.decision || "pending");
              if (!messageId || !factKey) {
                return sendJson(res, 400, { ok: false, error: "message_id and fact_key required" });
              }
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "reviews.json");
              let store: { reviews: Record<string, Record<string, any>> } = { reviews: {} };
              if (fs.existsSync(filePath)) {
                try { const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")); store = (parsed && parsed.reviews) ? parsed : { reviews: {} }; } catch { store = { reviews: {} }; }
              }
              if (!store.reviews) store.reviews = {};
              if (!store.reviews[messageId]) store.reviews[messageId] = {};
              store.reviews[messageId][factKey] = {
                decision,
                original: payload.original ?? null,
                edited_value: payload.edited_value ?? null,
                evidence: payload.evidence ?? null,
                reviewed_at: new Date().toISOString(),
              };
              fs.mkdirSync(path.dirname(filePath), { recursive: true });
              const expectedVersion = (payload as any)?.expected_version || null;
              safeWriteJson(filePath, store, "app_ui", expectedVersion, ["reviews"], "Review saved via UI");
              return sendJson(res, 200, { ok: true });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- GET /api/correspondence/threads ----
        if (method === "GET" && url === "/api/correspondence/threads") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "threads.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 404, { ok: false, error: "Thread intelligence not available" });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(raw);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/thread-reviews ----
        if (method === "GET" && url === "/api/correspondence/thread-reviews") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "thread-reviews.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, reviews: {} });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, reviews: (data && data.reviews) || {} });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/thread-reviews ----
        if (method === "POST" && url === "/api/correspondence/thread-reviews") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const payload = JSON.parse(body || "{}");
              const threadId = String(payload.thread_id || "");
              if (!threadId) {
                return sendJson(res, 400, { ok: false, error: "thread_id required" });
              }
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "thread-reviews.json");
              let store: { reviews: Record<string, Record<string, any>> } = { reviews: {} };
              if (fs.existsSync(filePath)) {
                try { const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")); store = (parsed && parsed.reviews) ? parsed : { reviews: {} }; } catch { store = { reviews: {} }; }
              }
              if (!store.reviews) store.reviews = {};
              if (!store.reviews[threadId]) store.reviews[threadId] = {};
              const existing = store.reviews[threadId];
              if (payload.status !== undefined) existing.status = payload.status;
              if (payload.title !== undefined) existing.title = payload.title;
              if (payload.note !== undefined) {
                if (!Array.isArray(existing.notes)) existing.notes = [];
                existing.notes.push({ text: payload.note, at: new Date().toISOString() });
              }
              if (payload.link_target !== undefined && payload.link_decision !== undefined) {
                if (!existing.link_decisions) existing.link_decisions = {};
                existing.link_decisions[payload.link_target] = payload.link_decision;
              }
              existing.reviewed_at = new Date().toISOString();
              store.reviews[threadId] = existing;
              fs.mkdirSync(path.dirname(filePath), { recursive: true });
              const expectedVersion = (payload as any)?.expected_version || null;
              safeWriteJson(filePath, store, "app_ui", expectedVersion, ["thread_reviews"], "Thread review saved via UI");
              return sendJson(res, 200, { ok: true });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- GET /api/correspondence/actions ----
        if (method === "GET" && url === "/api/correspondence/actions") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "actions.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 404, { ok: false, error: "Actions not available" });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(raw);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/pipeline-status ----
        if (method === "GET" && url === "/api/correspondence/pipeline-status") {
          try {
            const logPath = path.resolve(process.cwd(), ".local", "pipeline.log");
            const lockPath = path.resolve(process.cwd(), ".local", "pipeline.lock");
            const isRunning = fs.existsSync(lockPath);
            let lastRun = null;
            let lastLines: string[] = [];
            if (fs.existsSync(logPath)) {
              const raw = fs.readFileSync(logPath, "utf8");
              const lines = raw.split("\n").filter(Boolean);
              lastLines = lines.slice(-10);
              // Find last "Pipeline run complete" or "Pipeline run started"
              for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].includes("Pipeline run complete") || lines[i].includes("Pipeline run started")) {
                  lastRun = lines[i];
                  break;
                }
              }
            }
            return sendJson(res, 200, { ok: true, isRunning, lastRun, lastLines });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/new-items ----
        if (method === "GET" && url === "/api/correspondence/new-items") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "new-items.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, detected_at: null, new_message_count: 0, items: [], message: "No detection run yet." });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, parsed);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/source?q=... (source-in-email lookup) ----
        if (method === "GET" && (url === "/api/correspondence/source" || url.startsWith("/api/correspondence/source?"))) {
          try {
            const urlObj = new URL(url, "http://localhost");
            const q = urlObj.searchParams.get("q")?.trim() || "";
            const db = await loadDb();
            if (!q) {
              return sendJson(res, 200, { ok: true, query: "", hits: [], count: 0 });
            }
            const rows = db.prepare(
              `SELECT m.id, m.account_email, m.gmail_message_id, m.gmail_thread_id, m.direction,
                      m.from_name, m.from_email, m.subject, m.snippet, m.received_at, m.sent_at,
                      (SELECT COUNT(*) FROM attachments a WHERE a.message_id = m.id) AS attachment_count
               FROM messages m
               WHERE (m.subject LIKE ? OR m.from_name LIKE ? OR m.from_email LIKE ? OR m.snippet LIKE ? OR m.body_text LIKE ?)
               ORDER BY m.received_at DESC
               LIMIT 25`
            ).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
            return sendJson(res, 200, { ok: true, query: q, hits: rows, count: rows.length });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/review-state ----
        if (method === "GET" && url === "/api/correspondence/review-state") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "review-state.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, last_reviewed_message_id: 0, last_reviewed_at: null });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, parsed);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/detect-new ----
        if (method === "POST" && url === "/api/correspondence/detect-new") {
          try {
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "detect-new-correspondence.py")], { cwd: process.cwd(), timeout: 300000 });
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "new-items.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, new_message_count: 0, items: [] });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, parsed);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/mark-reviewed ----
        if (method === "POST" && url === "/api/correspondence/mark-reviewed") {
          try {
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "detect-new-correspondence.py"), "--mark-reviewed"], { cwd: process.cwd(), timeout: 60000 });
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "review-state.json");
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, parsed);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/draft-new/:thread_id (generate new correspondence draft) ----
        const draftNewMatch = url.match(/^\/api\/correspondence\/draft-new\/([^/?]+)$/);
        if (method === "POST" && draftNewMatch) {
          try {
            const threadId = decodeURIComponent(draftNewMatch[1]);
            const { execFileSync } = await import("node:child_process");
            // The script is authoritative: it re-verifies an existing draft in
            // memory, refuses suppressed suggestions, and records readiness.
            const output = execFileSync(
              "python3",
              [path.resolve(process.cwd(), "scripts", "draft-new-correspondence.py"), threadId],
              { cwd: process.cwd(), encoding: "utf8", timeout: 300000 },
            );
            const result = JSON.parse(output);
            return sendJson(res, result.ok ? 200 : 409, result);
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/draft-new/:thread_id ----
        const draftNewGetMatch = url.match(/^\/api\/correspondence\/draft-new\/([^/?]+)$/);
        if (method === "GET" && draftNewGetMatch) {
          try {
            const threadId = decodeURIComponent(draftNewGetMatch[1]);
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "drafts", threadId + "_new.json");
            const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
            if (!filePath.startsWith(allowedRoot + path.sep)) {
              return sendJson(res, 403, { ok: false, error: "Path not allowed" });
            }
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 404, { ok: false, error: "No new correspondence draft available" });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, draft: parsed });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/draft-new/:thread_id/save ----
        const draftNewSaveMatch = url.match(/^\/api\/correspondence\/draft-new\/([^/?]+)\/save$/);
        if (method === "POST" && draftNewSaveMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const threadId = decodeURIComponent(draftNewSaveMatch[1]);
              const payload = JSON.parse(body || "{}");
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "drafts", threadId + "_new.json");
              const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
              if (!filePath.startsWith(allowedRoot + path.sep)) {
                return sendJson(res, 403, { ok: false, error: "Path not allowed" });
              }
              if (!fs.existsSync(filePath)) {
                return sendJson(res, 404, { ok: false, error: "No draft to save" });
              }
              const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
              const expectedVersion = payload.expected_version || null;
              if (payload.edited_text !== undefined) existing.edited_text = payload.edited_text;
              existing.reviewed_at = new Date().toISOString();
              safeWriteJson(filePath, existing, "app_ui", expectedVersion, ["edited_text"], "Draft edit saved via UI");
              return sendJson(res, 200, { ok: true, draft: existing });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- POST /api/corrections (register a correction) ----
        if (method === "POST" && url === "/api/corrections") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const payload = JSON.parse(body || "{}");
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "corrections.json");
              let store: { version: number; corrections: Record<string, any>; generated_at: string | null } = { version: 1, corrections: {}, generated_at: null };
              if (fs.existsSync(filePath)) {
                try { const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")); store = parsed; } catch { store = { version: 1, corrections: {}, generated_at: null }; }
              }
              if (!store.corrections) store.corrections = {};
              // Generate ID
              const corrId = "corr_" + String(Object.keys(store.corrections).length + 1).padStart(4, "0");
              const entry = {
                id: corrId,
                timestamp: new Date().toISOString(),
                source: payload.source || "app_ui",
                source_detail: payload.source_detail || "UI correction",
                message_id: payload.message_id || null,
                thread_id: payload.thread_id || null,
                field: payload.field || "",
                stage: payload.stage || "other",
                original: payload.original ?? null,
                corrected: payload.corrected ?? null,
                evidence: payload.evidence ?? null,
                correction_type: payload.correction_type || "other",
                scope: payload.scope || "case_specific",
                model_version: payload.model_version || null,
                prompt_version: payload.prompt_version || null,
                human_confirmed: payload.human_confirmed !== false,
                rule_proposed: null,
                rule_approved: null,
                notes: payload.notes || "",
              };
              store.corrections[corrId] = entry;
              store.generated_at = new Date().toISOString();
              const expectedVersion = payload.expected_version || null;
              safeWriteJson(filePath, store, "app_ui", expectedVersion, [payload.field || "correction"], "Correction registered via UI");
              return sendJson(res, 200, { ok: true, correction_id: corrId });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- POST /api/corrections/:id/confirm ----
        const corrConfirmMatch = url.match(/^\/api\/corrections\/([^/]+)\/confirm$/);
        if (method === "POST" && corrConfirmMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const corrId = decodeURIComponent(corrConfirmMatch[1]);
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "corrections.json");
              if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: "No corrections file" });
              const store = JSON.parse(fs.readFileSync(filePath, "utf8"));
              if (!store.corrections?.[corrId]) return sendJson(res, 404, { ok: false, error: "Correction not found" });
              const expectedVersion = JSON.parse(body || "{}")?.expected_version || null;
              store.corrections[corrId].human_confirmed = true;
              store.corrections[corrId].confirmed_at = new Date().toISOString();
              safeWriteJson(filePath, store, "app_ui", expectedVersion, ["human_confirmed"], "Correction confirmed via UI");
              return sendJson(res, 200, { ok: true });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- POST /api/corrections/:id/reject ----
        const corrRejectMatch = url.match(/^\/api\/corrections\/([^/]+)\/reject$/);
        if (method === "POST" && corrRejectMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const corrId = decodeURIComponent(corrRejectMatch[1]);
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "corrections.json");
              if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: "No corrections file" });
              const store = JSON.parse(fs.readFileSync(filePath, "utf8"));
              if (!store.corrections?.[corrId]) return sendJson(res, 404, { ok: false, error: "Correction not found" });
              const expectedVersion = JSON.parse(body || "{}")?.expected_version || null;
              store.corrections[corrId].human_confirmed = false;
              store.corrections[corrId].rejected = true;
              store.corrections[corrId].rejected_at = new Date().toISOString();
              safeWriteJson(filePath, store, "app_ui", expectedVersion, ["human_confirmed", "rejected"], "Correction rejected via UI");
              return sendJson(res, 200, { ok: true });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- GET /api/correspondence/rules ----
        if (method === "GET" && url === "/api/correspondence/rules") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "rules.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, rules: {}, count: 0 });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, rules: parsed.rules || {}, count: Object.keys(parsed.rules || {}).length });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/rules/:id/approve ----
        const ruleApproveMatch = url.match(/^\/api\/rules\/([^/]+)\/approve$/);
        if (method === "POST" && ruleApproveMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const ruleId = decodeURIComponent(ruleApproveMatch[1]);
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "rules.json");
              if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: "No rules file" });
              const store = JSON.parse(fs.readFileSync(filePath, "utf8"));
              if (!store.rules?.[ruleId]) return sendJson(res, 404, { ok: false, error: "Rule not found" });
              const payload = JSON.parse(body || "{}");
              const expectedVersion = payload?.expected_version || null;
              store.rules[ruleId].status = "active";
              store.rules[ruleId].approved_at = new Date().toISOString();
              store.rules[ruleId].approved_by = "human";
              safeWriteJson(filePath, store, "app_ui", expectedVersion, ["status", "approved_at"], "Rule approved via UI");
              return sendJson(res, 200, { ok: true });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- POST /api/rules/:id/reject ----
        const ruleRejectMatch = url.match(/^\/api\/rules\/([^/]+)\/reject$/);
        if (method === "POST" && ruleRejectMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const ruleId = decodeURIComponent(ruleRejectMatch[1]);
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "rules.json");
              if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: "No rules file" });
              const store = JSON.parse(fs.readFileSync(filePath, "utf8"));
              if (!store.rules?.[ruleId]) return sendJson(res, 404, { ok: false, error: "Rule not found" });
              const payload = JSON.parse(body || "{}");
              const expectedVersion = payload?.expected_version || null;
              store.rules[ruleId].status = "rejected";
              store.rules[ruleId].rejected_at = new Date().toISOString();
              safeWriteJson(filePath, store, "app_ui", expectedVersion, ["status", "rejected_at"], "Rule rejected via UI");
              return sendJson(res, 200, { ok: true });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- POST /api/rules/propose ----
        if (method === "POST" && url === "/api/rules/propose") {
          try {
            const { execFileSync } = await import("node:child_process");
            execFileSync("python3", [path.resolve(process.cwd(), "scripts", "propose-rules.py")], { cwd: process.cwd(), timeout: 60000 });
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "rules.json");
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, rules: parsed.rules || {}, count: Object.keys(parsed.rules || {}).length });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/investigations ----
        if (method === "GET" && url === "/api/correspondence/investigations") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "investigations.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, investigations: {}, count: 0 });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, investigations: parsed.investigations || {}, count: Object.keys(parsed.investigations || {}).length });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/investigations (create) ----
        if (method === "POST" && url === "/api/correspondence/investigations") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const payload = JSON.parse(body || "{}");
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "investigations.json");
              let store: { version: number; investigations: Record<string, any>; generated_at: string | null } = { version: 1, investigations: {}, generated_at: null };
              if (fs.existsSync(filePath)) {
                try { const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")); store = parsed; } catch { store = { version: 1, investigations: {}, generated_at: null }; }
              }
              if (!store.investigations) store.investigations = {};
              const invId = "inv_" + String(Object.keys(store.investigations).length + 1).padStart(3, "0");
              const entry = {
                id: invId,
                created_at: new Date().toISOString(),
                created_by: payload.created_by || "app_ui",
                status: "pending",
                thread_id: payload.thread_id || null,
                lead_id: payload.lead_id || null,
                title: payload.title || "Untitled investigation",
                objective: payload.objective || "",
                findings: [],
                sources: [],
                recommended_action: null,
                draft_id: null,
                activity_log: [{ ts: new Date().toISOString(), by: payload.created_by || "app_ui", action: "created", detail: "Investigation created" }],
                human_decision: null,
                updated_at: new Date().toISOString(),
              };
              store.investigations[invId] = entry;
              store.generated_at = new Date().toISOString();
              const expectedVersion = payload.expected_version || null;
              safeWriteJson(filePath, store, "app_ui", expectedVersion, ["investigations"], "Investigation created");
              return sendJson(res, 200, { ok: true, investigation_id: invId });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- POST /api/investigations/:id/process (launch OpenCode) ----
        const invProcessMatch = url.match(/^\/api\/investigations\/([^/]+)\/process$/);
        if (method === "POST" && invProcessMatch) {
          try {
            const invId = decodeURIComponent(invProcessMatch[1]);
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "investigations.json");
            if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: "No investigations file" });
            const store = JSON.parse(fs.readFileSync(filePath, "utf8"));
            const inv = store.investigations?.[invId];
            if (!inv) return sendJson(res, 404, { ok: false, error: "Investigation not found" });
            if (inv.status !== "pending" && inv.status !== "in_progress") {
              return sendJson(res, 400, { ok: false, error: "Investigation is not in a processable state: " + inv.status });
            }

            // Set status to in_progress
            inv.status = "in_progress";
            inv.updated_at = new Date().toISOString();
            if (!Array.isArray(inv.activity_log)) inv.activity_log = [];
            inv.activity_log.push({ ts: new Date().toISOString(), by: "app_ui", action: "process_requested", detail: "OpenCode processing requested from app" });
            store.investigations[invId] = inv;
            safeWriteJson(filePath, store, "app_ui", null, ["status", "activity_log"], "Investigation processing started");

            // Launch OpenCode as child process
            const { spawn } = await import("node:child_process");
            const prompt = "Process investigation " + invId + " in correspondence/extracted/investigations.json. " +
              "Read the investigation and its thread_id. Read all messages in that thread from the database. " +
              "Research the recommended institution's official website for contact details and procedures. " +
              "Write findings, sources, recommended_action, and draft_id back to the investigation file using the API: " +
              "POST /api/investigations/" + invId + "/update with JSON body. " +
              "Set status to in_progress while working, then leave status as in_progress for human review. " +
              "Do NOT mark as completed or approved. Do NOT send any emails. " +
              "Record all activity in the activity_log with by=opencode. " +
              "Use safe_write for any file modifications.";

            const child = spawn("opencode", ["run", prompt, process.cwd()], {
              cwd: process.cwd(),
              detached: true,
              stdio: ["ignore", "pipe", "pipe"],
            });
            child.unref();

            // Log the spawn
            const logPath = path.resolve(process.cwd(), ".local", "opencode-tasks.log");
            const logEntry = JSON.stringify({ ts: new Date().toISOString(), invId, pid: child.pid, prompt: prompt.slice(0, 200) }) + "\n";
            fs.appendFileSync(logPath, logEntry, "utf8");

            return sendJson(res, 200, { ok: true, pid: child.pid, message: "OpenCode launched for investigation " + invId });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/investigations/:id/update ----
        const invUpdateMatch = url.match(/^\/api\/investigations\/([^/]+)\/update$/);
        if (method === "POST" && invUpdateMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const invId = decodeURIComponent(invUpdateMatch[1]);
              const payload = JSON.parse(body || "{}");
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "investigations.json");
              if (!fs.existsSync(filePath)) return sendJson(res, 404, { ok: false, error: "No investigations file" });
              const store = JSON.parse(fs.readFileSync(filePath, "utf8"));
              if (!store.investigations?.[invId]) return sendJson(res, 404, { ok: false, error: "Investigation not found" });
              const inv = store.investigations[invId];
              const expectedVersion = payload.expected_version || null;
              if (payload.status !== undefined) inv.status = payload.status;
              if (payload.findings !== undefined) inv.findings = payload.findings;
              if (payload.sources !== undefined) inv.sources = payload.sources;
              if (payload.recommended_action !== undefined) inv.recommended_action = payload.recommended_action;
              if (payload.draft_id !== undefined) inv.draft_id = payload.draft_id;
              if (payload.human_decision !== undefined) inv.human_decision = payload.human_decision;
              if (payload.activity !== undefined) {
                if (!Array.isArray(inv.activity_log)) inv.activity_log = [];
                inv.activity_log.push({ ts: new Date().toISOString(), by: payload.activity_by || "opencode", action: payload.activity, detail: payload.activity_detail || "" });
              }
              inv.updated_at = new Date().toISOString();
              store.investigations[invId] = inv;
              safeWriteJson(filePath, store, payload.source || "app_ui", expectedVersion, ["investigation"], "Investigation updated");
              return sendJson(res, 200, { ok: true });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- GET /api/correspondence/corrections ----
        if (method === "GET" && url === "/api/correspondence/corrections") {
          try {
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "corrections.json");
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 200, { ok: true, corrections: {}, count: 0 });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, corrections: parsed.corrections || {}, count: Object.keys(parsed.corrections || {}).length });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- GET /api/correspondence/draft-reply/:thread_id ----
        const draftGetMatch = url.match(/^\/api\/correspondence\/draft-reply\/([^/?]+)$/);
        if (method === "GET" && draftGetMatch) {
          try {
            const threadId = decodeURIComponent(draftGetMatch[1]);
            const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "drafts", threadId + ".json");
            const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
            if (!filePath.startsWith(allowedRoot + path.sep)) {
              return sendJson(res, 403, { ok: false, error: "Path not allowed" });
            }
            if (!fs.existsSync(filePath)) {
              return sendJson(res, 404, { ok: false, error: "No draft available" });
            }
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return sendJson(res, 200, { ok: true, draft: parsed });
          } catch (e) {
            return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // ---- POST /api/correspondence/draft-reply/:thread_id (generate) ----
        const draftGenMatch = url.match(/^\/api\/correspondence\/draft-reply\/([^/?]+)$/);
        if (method === "POST" && draftGenMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", async () => {
            try {
              const threadId = decodeURIComponent(draftGenMatch[1]);
              const payload = JSON.parse(body || "{}");
              const force = payload.force === true;
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "drafts", threadId + ".json");
              const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
              if (!filePath.startsWith(allowedRoot + path.sep)) {
                return sendJson(res, 403, { ok: false, error: "Path not allowed" });
              }
              // The script is authoritative: it re-verifies an existing draft in
              // memory (never rewriting it) and records readiness, so the UI can
              // never present an unverified draft as ready.
              const { execFileSync } = await import("child_process");
              const args = ["scripts/draft-reply.py", threadId];
              if (force) args.push("--force");
              const output = execFileSync("python3", args, { cwd: process.cwd(), encoding: "utf8", timeout: 300000 });
              const result = JSON.parse(output);
              return sendJson(res, result.ok ? 200 : 500, result);
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
          return;
        }

        // ---- POST /api/correspondence/draft-reply/:thread_id/save ----
        const draftSaveMatch = url.match(/^\/api\/correspondence\/draft-reply\/([^/?]+)\/save$/);
        if (method === "POST" && draftSaveMatch) {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const threadId = decodeURIComponent(draftSaveMatch[1]);
              const payload = JSON.parse(body || "{}");
              const filePath = path.resolve(process.cwd(), "correspondence", "extracted", "drafts", threadId + ".json");
              const allowedRoot = path.resolve(process.cwd(), "correspondence", "extracted", "drafts");
              if (!filePath.startsWith(allowedRoot + path.sep)) {
                return sendJson(res, 403, { ok: false, error: "Path not allowed" });
              }
              if (!fs.existsSync(filePath)) {
                return sendJson(res, 404, { ok: false, error: "Draft not found" });
              }
              const draft = JSON.parse(fs.readFileSync(filePath, "utf8"));
              draft.edited_text = payload.edited_text ?? draft.edited_text;
              draft.review_status = "edited";
              draft.reviewed_at = new Date().toISOString();
              fs.writeFileSync(filePath, JSON.stringify(draft, null, 2) + "\n", "utf8");
              return sendJson(res, 200, { ok: true, draft });
            } catch (e) {
              return sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
            }
          });
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
  ...(isFamilyBuild
    ? { build: { rollupOptions: { input: path.resolve(__dirname, "family.html") } } }
    : {}),
  plugins: [dyadComponentTagger(), react(), localRecordsApiPlugin(), localCorrespondenceApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...conditionalAlias,
    },
  },
}));
