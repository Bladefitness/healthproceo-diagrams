import { defineConfig } from "vite";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
  publicDir: false,
  build: {
    outDir: "dist",
  },
  plugins: [
    {
      name: "diagram-list",
      configureServer(server) {
        server.middlewares.use("/api/diagrams", (_req, res) => {
          const files = readdirSync(resolve(__dirname, "diagrams"))
            .filter((f) => f.endsWith(".excalidraw"))
            .map((f) => f.replace(".excalidraw", ""));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(files));
        });
      },
    },
    {
      name: "generate-diagram-list",
      generateBundle() {
        const diagramDir = resolve(__dirname, "diagrams");
        const files = readdirSync(diagramDir).filter((f) =>
          f.endsWith(".excalidraw")
        );

        // Emit the diagram list
        this.emitFile({
          type: "asset",
          fileName: "api/diagrams.json",
          source: JSON.stringify(files.map((f) => f.replace(".excalidraw", ""))),
        });

        // Copy each diagram file into dist/diagrams/
        for (const file of files) {
          this.emitFile({
            type: "asset",
            fileName: `diagrams/${file}`,
            source: readFileSync(resolve(diagramDir, file), "utf-8"),
          });
        }
      },
    },
  ],
});
