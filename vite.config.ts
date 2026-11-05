import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    configureServer: (server) => {
      // Local dev endpoint: write to record.md (front matter or discrepancies section)
      const apiMiddleware = (req: any, res: any, next: any) => {
        if (req.url?.startsWith("/api/update-record/") && req.method === "POST") {
          const recordId = req.url.split("/").pop();
          let body = "";
          req.on("data", (chunk: any) => (body += chunk));
          req.on("end", () => {
            try {
              const { section, content } = JSON.parse(body);
              const recordMd = path.resolve(
                "records",
                recordId,
                "record.md"
              );
              if (!fs.existsSync(recordMd)) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: "Record not found" }));
                return;
              }
              let raw = fs.readFileSync(recordMd, "utf-8");
              const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
              if (!fmMatch) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Invalid front matter" }));
                return;
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
                  let insertionPoint;
                  if (nextHeaderIdx !== -1) {
                    insertionPoint =
                      discIdx + discHeader.length + nextHeaderIdx;
                  } else {
                    insertionPoint = newBody.length;
                  }
                  newBody =
                    newBody.slice(0, insertionPoint) +
                    `- ${content}\n` +
                    newBody.slice(insertionPoint);
                } else {
                  newBody =
                    newBody.trimEnd() +
                    `\n\n## Discrepancies\n- ${content}\n`;
                }
                newRaw = `---\n${fmYaml}\n---\n${newBody}\n`;
              } else if (section === "front-matter") {
                const [key, value] = content.split("=");
                if (!key || !value) {
                  res.writeHead(400);
                  res.end(
                    JSON.stringify({ error: "Use key=value format" })
                  );
                  return;
                }
                const boolValue = value === "true";
                const lines = fmYaml.split("\n");
                let found = false;
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].startsWith(`${key}:`)) {
                    lines[i] = `${key}: ${boolValue}`;
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  lines.push(`${key}: ${boolValue}`);
                }
                newRaw = `---\n${lines.join("\n")}\n---\n${bodyText}\n`;
              } else {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "Unknown section" }));
                return;
              }

              fs.writeFileSync(recordMd, newRaw);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: true }));
            } catch (e: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }
        next();
      };

      // Insert at the front of the middleware stack so it runs before Vite's HTML fallback
      server.middlewares.stack.unshift({
        route: "/api/update-record",
        handle: apiMiddleware,
      });
    },
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
