import fs from "fs";
import path from "path";

type EndpointAnalysis = {
  route: string;
  file: string;
  methods: string;
  hasAuth: boolean;
  hasValidation: boolean;
  hasRateLimit: boolean;
  hasAuditLog: boolean;
  hasSecurityHeaders: boolean;
};

async function collectRouteFiles(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectRouteFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name === "route.ts") {
      files.push(fullPath);
    }
  }

  return files;
}

function analyzeFileContent(
  filePath: string,
  apiDir: string,
  content: string
): EndpointAnalysis {
  const relFromApi = path.relative(apiDir, filePath).replace(/\\/g, "/");
  const segments = relFromApi.split("/");
  segments.pop();
  const route = "/api/" + segments.join("/");

  const methods = new Set<string>();

  const regexes = [
    /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g,
    /\bexport\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g,
    /\bexport\s+const\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g,
  ];

  for (const re of regexes) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      methods.add(match[1]);
    }
  }

  const hasAuth = content.includes("getSession(") || content.includes("verifyToken(");
  const hasValidation =
    content.includes("withValidation(") ||
    content.includes("withRateLimitAndValidation(");
  const hasRateLimit =
    content.includes("withRateLimit(") ||
    content.includes("withRateLimitAndValidation(") ||
    content.includes("checkRateLimit(");
  const hasAuditLog =
    content.includes("logAudit(") || content.includes("logAuditFromSession(");
  const hasSecurityHeaders =
    content.includes("securityHeaders") ||
    content.includes("getBillingSecurityHeaders(");

  return {
    route,
    file: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
    methods: Array.from(methods).sort().join("|"),
    hasAuth,
    hasValidation,
    hasRateLimit,
    hasAuditLog,
    hasSecurityHeaders,
  };
}

function escapeCsv(value: string): string {
  if (value.includes("\"") || value.includes(",") || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function toCsv(rows: EndpointAnalysis[]): string {
  const header = [
    "route",
    "file",
    "methods",
    "hasAuth",
    "hasValidation",
    "hasRateLimit",
    "hasAuditLog",
    "hasSecurityHeaders",
  ].join(",");

  const lines = rows.map((row) => {
    const values = [
      row.route,
      row.file,
      row.methods,
      String(row.hasAuth),
      String(row.hasValidation),
      String(row.hasRateLimit),
      String(row.hasAuditLog),
      String(row.hasSecurityHeaders),
    ];
    return values.map(escapeCsv).join(",");
  });

  return [header, ...lines].join("\n");
}

async function main() {
  const projectRoot = process.cwd();
  const apiDir = path.join(projectRoot, "app", "api");

  const exists = await fs.promises
    .access(apiDir)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    console.error(`Directorio de API no encontrado: ${apiDir}`);
    process.exitCode = 1;
    return;
  }

  const files = await collectRouteFiles(apiDir);
  const analyses: EndpointAnalysis[] = [];

  for (const filePath of files) {
    const content = await fs.promises.readFile(filePath, "utf8");
    analyses.push(analyzeFileContent(filePath, apiDir, content));
  }

  analyses.sort((a, b) => a.route.localeCompare(b.route));

  const csv = toCsv(analyses);
  const outPath = path.join(projectRoot, "audit-endpoints.csv");
  await fs.promises.writeFile(outPath, csv, "utf8");

  const total = analyses.length;
  const withoutAuth = analyses.filter((r) => !r.hasAuth).length;
  const withoutValidation = analyses.filter((r) => !r.hasValidation).length;
  const withoutRateLimit = analyses.filter((r) => !r.hasRateLimit).length;
  const withoutAuditLog = analyses.filter((r) => !r.hasAuditLog).length;

  console.log(`Audit de endpoints generado en: ${outPath}`);
  console.log(`Total endpoints: ${total}`);
  console.log(`Sin auth (heurístico): ${withoutAuth}`);
  console.log(`Sin validación (heurístico): ${withoutValidation}`);
  console.log(`Sin rate limit (heurístico): ${withoutRateLimit}`);
  console.log(`Sin auditoría (heurístico): ${withoutAuditLog}`);
}

main().catch((err) => {
  console.error("Error ejecutando audit-endpoints:", err);
  process.exitCode = 1;
});
