import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

type RouteConfig = {
  path: string;
  titleKey: string;
};

type TranslationRecord = Record<string, unknown>;

type LocaleDefinition = {
  code: string;
  data: TranslationRecord;
};

type DuplicateReport = {
  locale: string;
  keys: string[];
};

type ValidationIssue =
  | "missing-key"
  | "object-instead-of-string"
  | 'empty-value';

type ValidationError = {
  key: string;
  titleKey: string;
  issue: ValidationIssue;
  location: string;
  languages: string[];
  actualValue?: unknown;
};

type RouteNode = RouteConfig | { [key: string]: RouteNode };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadRoutesConfig = (): RouteNode => {
  const routesPath = path.resolve(__dirname, "../../constants/routes.ts");
  const source = fs.readFileSync(routesPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: routesPath,
  });

  const module = { exports: {} as Record<string, unknown> };
  const localRequire = createRequire(routesPath);
  const iconStub = new Proxy(
    {},
    {
      get: () => () => null,
    },
  );
  const safeRequire = (specifier: string) => {
    if (specifier === "lucide-react-native") {
      return iconStub;
    }
    return localRequire(specifier);
  };
  const evaluateModule = new Function(
    "require",
    "module",
    "exports",
    transpiled.outputText,
  );
  try {
    evaluateModule(safeRequire, module, module.exports);
  } catch (error) {
    console.error(
      "Failed to evaluate routes.ts while validating translations.",
    );
    throw error;
  }

  const routesExport = module.exports as { ROUTES?: RouteNode };
  if (!routesExport.ROUTES) {
    throw new Error(
      "Failed to load ROUTES from routes.ts for translation validation",
    );
  }

  return routesExport.ROUTES;
};

const loadLocaleData = (code: string): TranslationRecord => {
  const localeDir = path.resolve(__dirname, "..", code);
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

const traverseKeys = (
  node: unknown,
  prefix: string,
  seen: Set<string>,
  duplicates: Set<string>,
) => {
  if (node === null || typeof node !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(node as TranslationRecord)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (seen.has(fullKey)) {
      duplicates.add(fullKey);
    } else {
      seen.add(fullKey);
    }
    traverseKeys(value, fullKey, seen, duplicates);
  }
};

const findDuplicateKeys = (data: TranslationRecord): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  traverseKeys(data, "", seen, duplicates);
  return Array.from(duplicates).sort();
};

const locales: LocaleDefinition[] = [
  { code: "en", data: loadLocaleData("en") },
  { code: "es", data: loadLocaleData("es") },
  { code: "fr", data: loadLocaleData("fr") },
];

const duplicateReports: DuplicateReport[] = [];

for (const locale of locales) {
  const duplicateKeys = findDuplicateKeys(locale.data);
  if (duplicateKeys.length > 0) {
    duplicateReports.push({
      locale: locale.code,
      keys: duplicateKeys,
    });
  }
}

const isRouteConfig = (node: RouteNode): node is RouteConfig =>
  typeof node === "object" && node !== null && "path" in node &&
  "titleKey" in node;

type RouteEntry = {
  key: string;
  titleKey: string;
  location: string;
};

const flattenRoutes = (node: RouteNode, parents: string[]): RouteEntry[] => {
  if (isRouteConfig(node)) {
    const pathSegments = ["ROUTES", ...parents];
    const location = `packages/core/constants/routes.ts -> ${
      pathSegments.join(".")
    }`;
    const normalizedKey = node.titleKey.replace(/\.title$/, "");
    return [
      {
        key: normalizedKey,
        titleKey: node.titleKey,
        location,
      },
    ];
  }

  return Object.entries(node).flatMap(([childKey, childValue]) =>
    flattenRoutes(childValue, [...parents, childKey])
  );
};

const ROUTES = loadRoutesConfig();

const routeEntries = flattenRoutes(ROUTES as RouteNode, []);

const getTranslationValue = (record: TranslationRecord, titleKey: string) => {
  const segments = titleKey.split(".");
  let value: unknown = record;

  for (const segment of segments) {
    if (
      value && typeof value === "object" &&
      segment in (value as TranslationRecord)
    ) {
      value = (value as TranslationRecord)[segment];
    } else {
      return undefined;
    }
  }

  return value;
};

const routeValidationErrors: ValidationError[] = [];

for (const routeEntry of routeEntries) {
  const missingLocales: string[] = [];
  const objectLocales: { locale: string; value: unknown }[] = [];
  const emptyLocales: string[] = [];

  for (const locale of locales) {
    const value = getTranslationValue(locale.data, routeEntry.titleKey);

    if (typeof value === "undefined") {
      missingLocales.push(locale.code);
      continue;
    }

    if (typeof value === "string") {
      if (value.trim().length === 0) {
        emptyLocales.push(locale.code);
      }
      continue;
    }

    objectLocales.push({ locale: locale.code, value });
  }

  if (missingLocales.length > 0) {
    routeValidationErrors.push({
      key: routeEntry.key,
      titleKey: routeEntry.titleKey,
      issue: "missing-key",
      location: routeEntry.location,
      languages: missingLocales,
    });
  }

  if (objectLocales.length > 0) {
    routeValidationErrors.push({
      key: routeEntry.key,
      titleKey: routeEntry.titleKey,
      issue: "object-instead-of-string",
      location: routeEntry.location,
      languages: objectLocales.map((entry) => entry.locale),
      actualValue: objectLocales[0]?.value,
    });
  }

  if (emptyLocales.length > 0) {
    routeValidationErrors.push({
      key: routeEntry.key,
      titleKey: routeEntry.titleKey,
      issue: "empty-value",
      location: routeEntry.location,
      languages: emptyLocales,
    });
  }
}

if (duplicateReports.length > 0 || routeValidationErrors.length > 0) {
  if (duplicateReports.length > 0) {
    console.error("❌ Duplicate translation keys detected:");
    for (const report of duplicateReports) {
      console.error(`\nLocale: ${report.locale}`);
      for (const key of report.keys) {
        console.error(`  - ${key}`);
      }
    }
  }

  if (routeValidationErrors.length > 0) {
    console.error("\n❌ Route titleKey validation failed:");
    for (const error of routeValidationErrors) {
      console.error(
        [
          `- Route: ${error.key}`,
          `  Title Key: ${error.titleKey}`,
          `  Issue: ${error.issue}`,
          `  Location: ${error.location}`,
          `  Languages: ${error.languages.join(", ")}`,
          error.actualValue
            ? `  Actual Value: ${JSON.stringify(error.actualValue, null, 2)}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }

  process.exit(1);
}

console.log(
  "✅ Translation validation passed (no duplicates, no route titleKey issues).",
);
