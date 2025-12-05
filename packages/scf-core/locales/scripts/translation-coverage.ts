import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type TranslationRecord = Record<string, unknown>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");
const localesDir = path.resolve(__dirname, "..");
const reportsDir = path.resolve(localesDir, "reports");
const reportPath = path.join(reportsDir, "translation-coverage-report.json");

const loadLocaleData = (code: string): TranslationRecord => {
  const localeDir = path.join(localesDir, code);
  const files = fs.readdirSync(localeDir).filter((file) =>
    file.endsWith(".json")
  );
  const record: TranslationRecord = {};

  for (const file of files) {
    const namespace = path.basename(file, ".json");
    const filePath = path.join(localeDir, file);
    const contents = fs.readFileSync(filePath, "utf8");
    record[namespace] = JSON.parse(contents);
  }

  return record;
};

const collectKeys = (node: unknown, prefix: string, keys: Set<string>) => {
  if (node === null || typeof node !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(node as TranslationRecord)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
    collectKeys(value, fullKey, keys);
  }
};

const flattenKeys = (data: TranslationRecord): string[] => {
  const keys = new Set<string>();
  collectKeys(data, "", keys);
  return Array.from(keys);
};

const loadFile = (filePath: string): string =>
  fs.readFileSync(filePath, "utf8");

const shouldSkipDirectory = (dirName: string) =>
  [
    "node_modules",
    ".git",
    "dist",
    ".turbo",
    "tests/reports/coverage",
    "build",
    "ios",
    "android",
  ].includes(dirName);

const sourceFileExtensions = new Set(["", ".tsx", ".js", ".jsx"]);

const collectUsedTranslationKeys = (): Set<string> => {
  const usedKeys = new Set<string>();

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }
        walk(path.join(dir, entry.name));
        continue;
      }

      const ext = path.extname(entry.name);
      if (!sourceFileExtensions.has(ext)) {
        continue;
      }

      const filePath = path.join(dir, entry.name);
      const content = loadFile(filePath);
      const patterns = [
        /\bt\(\s*['"]([^'"]+)['"]/g,
        /i18n\.t\(\s*['"]([^'"]+)['"]/g,
      ];

      for (const pattern of patterns) {
        let match: RegExpExecArray | null = pattern.exec(content);
        while (match !== null) {
          usedKeys.add(match[1]);
          match = pattern.exec(content);
        }
      }
    }
  };

  walk(repoRoot);
  return usedKeys;
};

const english = loadLocaleData("en");
const spanish = loadLocaleData("es");
const french = loadLocaleData("fr");

const enKeys = flattenKeys(english);
const enKeySet = new Set(enKeys);

const locales = [
  { code: "es", data: spanish },
  { code: "fr", data: french },
];

const coverage = locales.map((locale) => {
  const localeKeys = flattenKeys(locale.data);
  const localeSet = new Set(localeKeys);
  const missing = enKeys.filter((key) => !localeSet.has(key));
  const extra = localeKeys.filter((key) => !enKeySet.has(key));
  const translated = enKeys.length - missing.length;
  const coveragePercent = enKeys.length === 0 ? 1 : translated / enKeys.length;

  return {
    locale: locale.code,
    totalKeys: enKeys.length,
    translatedKeys: translated,
    missingKeys: missing,
    extraKeys: extra,
    coverage: Number((coveragePercent * 100).toFixed(2)),
  };
});

const usedKeys = collectUsedTranslationKeys();
const unusedKeys = enKeys.filter((key) => !usedKeys.has(key)).sort();

const report = {
  generatedAt: new Date().toISOString(),
  locales: coverage,
  unusedKeys,
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  "✅ Translation coverage report written to",
  path.relative(repoRoot, reportPath),
);
for (const entry of coverage) {
  console.log(
    `  • ${entry.locale}: ${entry.translatedKeys}/${entry.totalKeys} (${entry.coverage}% coverage)`,
  );
  if (entry.missingKeys.length > 0) {
    console.log(`    Missing: ${entry.missingKeys.length} keys`);
  }
}
if (unusedKeys.length > 0) {
  console.log(`⚠️  Potential unused keys: ${unusedKeys.length}`);
}
