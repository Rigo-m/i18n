import createDebug from 'debug';
import { isString, isRegExp, isFunction, isArray, isObject, isBoolean, hasOwn } from '@intlify/shared';
import { resolveFiles, resolvePath, extendPages, addWebpackPlugin, extendWebpackConfig, addVitePlugin, extendViteConfig, defineNuxtModule, useLogger, isNuxt2, getNuxtVersion, isNuxt3, addPlugin, addTemplate, addServerHandler, addPrerenderRoutes, addImports } from '@nuxt/kit';
import { parse, relative, resolve, dirname, normalize, isAbsolute } from 'pathe';
import { defu } from 'defu';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync as readFileSync$1, promises, constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse as parse$1 } from '@babel/parser';
import { encodePath, parseURL, parseQuery, withQuery } from 'ufo';
import { resolveLockfile } from 'pkg-types';
import { transform } from '@mizchi/sucrase';
import { localizeRoutes, DefaultLocalizeRoutesPrefixable } from 'vue-i18n-routing';
import { parse as parse$2, compileScript } from '@vue/compiler-sfc';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import VueI18nWebpackPlugin from '@intlify/unplugin-vue-i18n/webpack';
import VueI18nVitePlugin from '@intlify/unplugin-vue-i18n/vite';
import { createUnplugin } from 'unplugin';
import { dirname as dirname$1, resolve as resolve$1 } from 'node:path';
import { generateJSON } from '@intlify/bundle-utils';
import { genDynamicImport, genSafeVariableName, genImport } from 'knitwork';

const NUXT_I18N_MODULE_ID = "@nuxtjs/i18n";
const VUE_I18N_PKG = "vue-i18n";
const VUE_I18N_BRIDGE_PKG = "@intlify/vue-i18n-bridge";
const VUE_ROUTER_BRIDGE_PKG = "@intlify/vue-router-bridge";
const VUE_I18N_ROUTING_PKG = "vue-i18n-routing";
const STRATEGY_PREFIX_EXCEPT_DEFAULT = "prefix_except_default";
const DEFAULT_OPTIONS = {
  experimental: {
    jsTsFormatResource: false
  },
  precompile: {
    strictMessage: true,
    escapeHtml: false
  },
  vueI18n: "",
  locales: [],
  defaultLocale: "",
  defaultDirection: "ltr",
  routesNameSeparator: "___",
  trailingSlash: false,
  defaultLocaleRouteNameSuffix: "default",
  strategy: STRATEGY_PREFIX_EXCEPT_DEFAULT,
  lazy: false,
  langDir: null,
  rootRedirect: null,
  detectBrowserLanguage: {
    alwaysRedirect: false,
    cookieCrossOrigin: false,
    cookieDomain: null,
    cookieKey: "i18n_redirected",
    cookieSecure: false,
    fallbackLocale: "",
    redirectOn: "root",
    useCookie: true
  },
  differentDomains: false,
  baseUrl: "",
  dynamicRouteParams: false,
  customRoutes: "page",
  pages: {},
  skipSettingLocaleOnNavigate: false,
  types: "composition",
  debug: false
};
const NUXT_I18N_LOCALE_PROXY_ID = "@nuxtjs/i18n/__locale__";
const NUXT_I18N_CONFIG_PROXY_ID = "@nuxtjs/i18n/__config__";
const NUXT_I18N_PRECOMPILE_ENDPOINT = "/__i18n__/precompile";
const NUXT_I18N_PRECOMPILED_LOCALE_KEY = "i18n-locales";
const NUXT_I18N_PRERENDERED_PATH = "/__i18n__/prerender";
const NUXT_I18N_TEMPLATE_OPTIONS_KEY = "i18n.options.mjs";
const NUXT_I18N_TEMPLATE_INTERNAL_KEY = "i18n.internal.mjs";
const NUXT_I18N_COMPOSABLE_DEFINE_ROUTE = "defineI18nRoute";
const NUXT_I18N_COMPOSABLE_DEFINE_LOCALE = "defineI18nLocale";
const NUXT_I18N_COMPOSABLE_DEFINE_CONFIG = "defineI18nConfig";
const TS_EXTENSIONS = [".ts", ".cts", ".mts"];
const JS_EXTENSIONS = [".js", ".cjs", ".mjs"];
const EXECUTABLE_EXTENSIONS = [...JS_EXTENSIONS, ...TS_EXTENSIONS];
const NULL_HASH = "00000000";

const PackageManagerLockFiles = {
  "npm-shrinkwrap.json": "npm-legacy",
  "package-lock.json": "npm",
  "yarn.lock": "yarn",
  "pnpm-lock.yaml": "pnpm"
};
async function getPackageManagerType() {
  try {
    const parsed = parse(await resolveLockfile());
    const lockfile = `${parsed.name}${parsed.ext}`;
    if (lockfile == null) {
      return "unknown";
    }
    const type = PackageManagerLockFiles[lockfile];
    return type == null ? "unknown" : type;
  } catch (e) {
    throw e;
  }
}
function formatMessage(message) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`;
}
function getNormalizedLocales(locales) {
  locales = locales || [];
  const normalized = [];
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale, iso: locale });
    } else {
      normalized.push(locale);
    }
  }
  return normalized;
}
async function resolveLocales(path, locales) {
  const files = await resolveFiles(path, "**/*{json,json5,yaml,yml,js,cjs,mjs,ts,cts,mts}");
  const find = (f) => files.find((file) => file === resolve(path, f));
  return locales.map((locale) => {
    if (locale.file) {
      locale.path = find(locale.file);
      if (locale.path) {
        locale.hash = getHash(locale.path);
        locale.type = getLocaleType(locale.path);
      }
    } else if (locale.files) {
      locale.paths = locale.files.map((file) => find(file)).filter(Boolean);
      if (locale.paths) {
        locale.hashes = locale.paths.map((path2) => getHash(path2));
        locale.types = locale.paths.map((path2) => getLocaleType(path2));
      }
    }
    return locale;
  });
}
function getLocaleType(path) {
  const ext = parse(path).ext;
  if (EXECUTABLE_EXTENSIONS.includes(ext)) {
    const code = readCode(path, ext);
    const parsed = parseCode(code, path);
    const anaylzed = scanProgram(parsed.program);
    if (anaylzed === "object") {
      return "static";
    } else if (anaylzed === "function" || anaylzed === "arrow-function") {
      return "dynamic";
    } else {
      return "unknown";
    }
  } else {
    return "static";
  }
}
const PARSE_CODE_CACHES = /* @__PURE__ */ new Map();
function parseCode(code, path) {
  if (PARSE_CODE_CACHES.has(path)) {
    return PARSE_CODE_CACHES.get(path);
  }
  const parsed = parse$1(code, {
    allowImportExportEverywhere: true,
    sourceType: "module"
  });
  PARSE_CODE_CACHES.set(path, parsed);
  return parsed;
}
function scanProgram(program) {
  let ret = false;
  for (const node of program.body) {
    if (node.type === "ExportDefaultDeclaration") {
      if (node.declaration.type === "ObjectExpression") {
        ret = "object";
        break;
      } else if (node.declaration.type === "CallExpression" && node.declaration.callee.type === "Identifier") {
        const [fnNode] = node.declaration.arguments;
        if (fnNode.type === "FunctionExpression") {
          ret = "function";
          break;
        } else if (fnNode.type === "ArrowFunctionExpression") {
          ret = "arrow-function";
          break;
        }
      }
    }
  }
  return ret;
}
function readCode(absolutePath, ext) {
  let code = readFileSync(absolutePath);
  if (TS_EXTENSIONS.includes(ext)) {
    const out = transform(code, {
      transforms: ["jsx"],
      keepUnusedImports: true
    });
    code = out.code;
  }
  return code;
}
function getLayerRootDirs(nuxt) {
  const layers = nuxt.options._layers;
  return layers.length > 1 ? layers.map((layer) => layer.config.rootDir) : [];
}
async function tryResolve(id, targets, pkgMgr, extention = "") {
  for (const target of targets) {
    if (await isExists(target + extention)) {
      return target;
    }
  }
  throw new Error(`Cannot resolve ${id} on ${pkgMgr}! please install it on 'node_modules'`);
}
function readFileSync(path) {
  return readFileSync$1(path, { encoding: "utf-8" });
}
async function rm(path) {
  return await promises.rm(path, { recursive: true, force: true });
}
async function isExists(path) {
  try {
    await promises.access(path, constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}
async function resolveVueI18nConfigInfo(options, buildDir, rootDir) {
  const configPathInfo = {
    relativeBase: relative(buildDir, rootDir),
    rootDir,
    hash: NULL_HASH
  };
  const vueI18nConfigRelativePath = configPathInfo.relative = options.vueI18n || "i18n.config";
  const vueI18nConfigAbsolutePath = await resolvePath(vueI18nConfigRelativePath, {
    cwd: rootDir,
    extensions: EXECUTABLE_EXTENSIONS
  });
  if (await isExists(vueI18nConfigAbsolutePath)) {
    configPathInfo.absolute = vueI18nConfigAbsolutePath;
    configPathInfo.hash = getHash(vueI18nConfigAbsolutePath);
    configPathInfo.type = getLocaleType(vueI18nConfigAbsolutePath);
  }
  return configPathInfo;
}
function analyzePrerenderTargets(locales, configs) {
  const targets = /* @__PURE__ */ new Map();
  for (const { path, hash, type, paths, hashes, types } of locales) {
    if (path && hash && type === "dynamic") {
      const { ext } = parse(path);
      EXECUTABLE_EXTENSIONS.includes(ext) && targets.set(hash, { type: "locale", path });
    }
    if (paths && hashes && types) {
      paths.forEach((path2, index) => {
        const { ext } = parse(path2);
        EXECUTABLE_EXTENSIONS.includes(ext) && types[index] === "dynamic" && targets.set(hashes[index], { type: "locale", path: path2 });
      });
    }
  }
  for (const { absolute, hash } of configs) {
    if (absolute && hash) {
      const { ext } = parse(absolute);
      EXECUTABLE_EXTENSIONS.includes(ext) && targets.set(hash, { type: "config", path: absolute });
    }
  }
  return targets;
}
function toCode(code) {
  if (code === null) {
    return `null`;
  }
  if (code === void 0) {
    return `undefined`;
  }
  if (isString(code)) {
    return JSON.stringify(code);
  }
  if (isRegExp(code) && code.toString) {
    return code.toString();
  }
  if (isFunction(code) && code.toString) {
    return `(${code.toString().replace(new RegExp(`^${code.name}`), "function ")})`;
  }
  if (isArray(code)) {
    return `[${code.map((c) => toCode(c)).join(`,`)}]`;
  }
  if (isObject(code)) {
    return stringifyObj(code);
  }
  return code + ``;
}
function stringifyObj(obj) {
  return `Object({${Object.entries(obj).map(([key, value]) => `${JSON.stringify(key)}:${toCode(value)}`).join(`,`)}})`;
}
const PARAM_CHAR_RE = /[\w\d_.]/;
function parseSegment(segment) {
  let state = 0 /* initial */;
  let i = 0;
  let buffer = "";
  const tokens = [];
  function consumeBuffer() {
    if (!buffer) {
      return;
    }
    if (state === 0 /* initial */) {
      throw new Error("wrong state");
    }
    tokens.push({
      type: state === 1 /* static */ ? 0 /* static */ : state === 2 /* dynamic */ ? 1 /* dynamic */ : state === 3 /* optional */ ? 2 /* optional */ : 3 /* catchall */,
      value: buffer
    });
    buffer = "";
  }
  while (i < segment.length) {
    const c = segment[i];
    switch (state) {
      case 0 /* initial */:
        buffer = "";
        if (c === "[") {
          state = 2 /* dynamic */;
        } else {
          i--;
          state = 1 /* static */;
        }
        break;
      case 1 /* static */:
        if (c === "[") {
          consumeBuffer();
          state = 2 /* dynamic */;
        } else {
          buffer += c;
        }
        break;
      case 4 /* catchall */:
      case 2 /* dynamic */:
      case 3 /* optional */:
        if (buffer === "...") {
          buffer = "";
          state = 4 /* catchall */;
        }
        if (c === "[" && state === 2 /* dynamic */) {
          state = 3 /* optional */;
        }
        if (c === "]" && (state !== 3 /* optional */ || buffer[buffer.length - 1] === "]")) {
          if (!buffer) {
            throw new Error("Empty param");
          } else {
            consumeBuffer();
          }
          state = 0 /* initial */;
        } else if (PARAM_CHAR_RE.test(c)) {
          buffer += c;
        } else ;
        break;
    }
    i++;
  }
  if (state === 2 /* dynamic */) {
    throw new Error(`Unfinished param "${buffer}"`);
  }
  consumeBuffer();
  return tokens;
}
const resolveRelativeLocales = (relativeFileResolver, locale, merged) => {
  if (typeof locale === "string")
    return merged;
  const { file, files, ...entry } = locale;
  const fileEntries = getLocaleFiles(locale);
  const relativeFiles = relativeFileResolver(fileEntries);
  return {
    ...entry,
    ...merged,
    files: [...relativeFiles, ...merged?.files ?? []]
  };
};
const getLocaleFiles = (locale) => {
  if (locale.file != null)
    return [locale.file];
  if (locale.files != null)
    return locale.files;
  return [];
};
const localeFilesToRelative = (projectLangDir, layerLangDir, files) => {
  const absoluteFiles = files.map((file) => resolve(layerLangDir, file));
  const relativeFiles = absoluteFiles.map((file) => relative(projectLangDir, file));
  return relativeFiles;
};
const getProjectPath = (nuxt, ...target) => {
  const projectLayer = nuxt.options._layers[0];
  return resolve(projectLayer.config.rootDir, ...target);
};
const mergeConfigLocales = (configs, baseLocales = []) => {
  const mergedLocales = /* @__PURE__ */ new Map();
  baseLocales.forEach((locale) => mergedLocales.set(locale.code, locale));
  for (const { locales, langDir, projectLangDir } of configs) {
    if (locales == null)
      continue;
    if (langDir == null)
      continue;
    if (projectLangDir == null)
      continue;
    for (const locale of locales) {
      if (typeof locale === "string")
        continue;
      const filesResolver = (files) => localeFilesToRelative(projectLangDir, langDir, files);
      const resolvedLocale = resolveRelativeLocales(filesResolver, locale, mergedLocales.get(locale.code));
      if (resolvedLocale != null)
        mergedLocales.set(locale.code, resolvedLocale);
    }
  }
  return Array.from(mergedLocales.values());
};
const mergeI18nModules = async (options, nuxt) => {
  const projectLayer = nuxt.options._layers[0];
  if (projectLayer.config.i18n)
    projectLayer.config.i18n.i18nModules = [];
  const registerI18nModule = (config) => {
    if (config.langDir == null)
      return;
    projectLayer.config.i18n?.i18nModules?.push(config);
  };
  await nuxt.callHook("i18n:registerModule", registerI18nModule);
  const modules = projectLayer.config.i18n?.i18nModules ?? [];
  const projectLangDir = getProjectPath(nuxt, projectLayer.config.i18n?.langDir ?? "");
  if (modules.length > 0) {
    const baseLocales = [];
    const layerLocales = projectLayer.config.i18n?.locales ?? [];
    for (const locale of layerLocales) {
      if (typeof locale !== "object")
        continue;
      baseLocales.push({ ...locale, file: void 0, files: getLocaleFiles(locale) });
    }
    const mergedLocales = mergeConfigLocales(
      modules.map((x) => ({ ...x, projectLangDir })),
      baseLocales
    );
    if (projectLayer.config.i18n) {
      options.locales = mergedLocales;
      projectLayer.config.i18n.locales = mergedLocales;
    }
  }
};
function getRoutePath(tokens) {
  return tokens.reduce((path, token) => {
    return path + (token.type === 2 /* optional */ ? `:${token.value}?` : token.type === 1 /* dynamic */ ? `:${token.value}` : token.type === 3 /* catchall */ ? `:${token.value}(.*)*` : encodePath(token.value));
  }, "/");
}
function getHash(text) {
  return createHash("sha256").update(text).digest("hex").substring(0, 8);
}

const debug$a = createDebug("@nuxtjs/i18n:dirs");
const distDir = dirname(fileURLToPath(import.meta.url));
const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));
const pkgDir = resolve(distDir, "..");
const pkgModulesDir = resolve(pkgDir, "./node_modules");
debug$a("distDir", distDir);
debug$a("runtimeDir", runtimeDir);
debug$a("pkgDir", pkgDir);
debug$a("pkgModulesDir", pkgModulesDir);

const debug$9 = createDebug("@nuxtjs/i18n:alias");
async function setupAlias(nuxt) {
  const pkgMgr = await getPackageManagerType();
  debug$9("setupAlias: pkgMgr", pkgMgr);
  nuxt.options.alias[VUE_I18N_PKG] = await resolveVueI18nAlias(pkgModulesDir, nuxt, pkgMgr);
  nuxt.options.build.transpile.push(VUE_I18N_PKG);
  debug$9("vue-i18n alias", nuxt.options.alias[VUE_I18N_PKG]);
  nuxt.options.alias["@intlify/shared"] = await resolvePath("@intlify/shared");
  nuxt.options.build.transpile.push("@intlify/shared");
  debug$9("@intlify/shared alias", nuxt.options.alias["@intlify/shared"]);
  nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG] = await resolveVueRouterBridgeAlias(pkgModulesDir, nuxt, pkgMgr);
  nuxt.options.build.transpile.push(VUE_ROUTER_BRIDGE_PKG);
  debug$9("@intlify/vue-router-bridge alias", nuxt.options.alias[VUE_ROUTER_BRIDGE_PKG]);
  nuxt.options.alias[VUE_I18N_BRIDGE_PKG] = await resolveVueI18nBridgeAlias(pkgModulesDir, nuxt, pkgMgr);
  nuxt.options.build.transpile.push(VUE_I18N_BRIDGE_PKG);
  debug$9("@intlify/vue-i18n-bridge alias", nuxt.options.alias[VUE_I18N_BRIDGE_PKG]);
  nuxt.options.alias[VUE_I18N_ROUTING_PKG] = await resolveVueI18nRoutingAlias(pkgModulesDir, nuxt, pkgMgr);
  nuxt.options.build.transpile.push(VUE_I18N_ROUTING_PKG);
  debug$9("vue-i18n-routing alias", nuxt.options.alias[VUE_I18N_ROUTING_PKG]);
}
async function resolveVueI18nAlias(pkgModulesDir2, nuxt, pkgMgr) {
  const { rootDir, workspaceDir } = nuxt.options;
  const modulePath = nuxt.options.dev ? `${VUE_I18N_PKG}/dist/vue-i18n.mjs` : `${VUE_I18N_PKG}/dist/vue-i18n.runtime.mjs`;
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map((root) => resolve(root, "node_modules", modulePath)),
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, "node_modules", modulePath),
    // 2nd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir2, modulePath),
    // workspace directories
    resolve(workspaceDir, "node_modules", modulePath)
  ];
  debug$9(`${VUE_I18N_PKG} resolving from ...`, targets);
  return tryResolve(VUE_I18N_PKG, targets, pkgMgr);
}
async function resolveVueI18nBridgeAlias(pkgModulesDir2, nuxt, pkgMgr) {
  const { rootDir, workspaceDir } = nuxt.options;
  const modulePath = `${VUE_I18N_BRIDGE_PKG}/lib/index.mjs`;
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map((root) => resolve(root, "node_modules", modulePath)),
    ...getLayerRootDirs(nuxt).map((root) => resolve(root, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)),
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, "node_modules", modulePath),
    // 2nd, try to resolve from `node_modules/vue-i18n-routing` (not hoisted case)
    resolve(rootDir, "node_modules", `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // 3rd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir2, modulePath),
    // 4th, try to resolve from `node_modules/@nuxtjs/i18n/node_modules/vue-i18n-routing` (not hoisted case)
    resolve(pkgModulesDir2, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // workspace directories
    resolve(workspaceDir, "node_modules", modulePath),
    resolve(workspaceDir, "node_modules", `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)
  ];
  debug$9(`${VUE_I18N_BRIDGE_PKG} resolving from ...`, targets);
  return tryResolve(VUE_I18N_BRIDGE_PKG, targets, pkgMgr);
}
async function resolveVueRouterBridgeAlias(pkgModulesDir2, nuxt, pkgMgr) {
  const { rootDir, workspaceDir } = nuxt.options;
  const modulePath = `${VUE_ROUTER_BRIDGE_PKG}/lib/index.mjs`;
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map((root) => resolve(root, "node_modules", modulePath)),
    ...getLayerRootDirs(nuxt).map((root) => resolve(root, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)),
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, "node_modules", modulePath),
    // 2nd, try to resolve from `node_modules/vue-i18n-routing` (not hoisted case)
    resolve(rootDir, "node_modules", `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // 3rd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir2, modulePath),
    // 4th, try to resolve from `node_modules/@nuxtjs/i18n/node_modules/vue-i18n-routing` (not hoisted case)
    resolve(pkgModulesDir2, `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath),
    // workspace directories
    resolve(workspaceDir, "node_modules", modulePath),
    resolve(workspaceDir, "node_modules", `${VUE_I18N_ROUTING_PKG}/node_modules`, modulePath)
  ];
  debug$9(`${VUE_ROUTER_BRIDGE_PKG} resolving from ...`, targets);
  return tryResolve(VUE_ROUTER_BRIDGE_PKG, targets, pkgMgr);
}
async function resolveVueI18nRoutingAlias(pkgModulesDir2, nuxt, pkgMgr) {
  const { rootDir, workspaceDir } = nuxt.options;
  const modulePath = `${VUE_I18N_ROUTING_PKG}/dist/vue-i18n-routing.mjs`;
  const targets = [
    // for Nuxt layer
    ...getLayerRootDirs(nuxt).map((root) => resolve(root, "node_modules", modulePath)),
    // 1st, try to resolve from `node_modules` (hoisted case)
    resolve(rootDir, "node_modules", modulePath),
    // 2nd, try to resolve from `node_modules/@nuxtjs/i18n` (not hoisted case)
    resolve(pkgModulesDir2, modulePath),
    // workspace directories
    resolve(workspaceDir, "node_modules", modulePath)
  ];
  debug$9(`${VUE_I18N_ROUTING_PKG} resolving from ...`, targets);
  return tryResolve(VUE_I18N_ROUTING_PKG, targets, pkgMgr);
}

const debug$8 = createDebug("@nuxtjs/i18n:layers");
const applyLayerOptions = (options, nuxt) => {
  const project = nuxt.options._layers[0];
  const layers = nuxt.options._layers;
  if (layers.length === 1)
    return;
  const resolvedLayerPaths = layers.map((l) => resolve(project.config.rootDir, l.config.rootDir));
  debug$8("using layers at paths", resolvedLayerPaths);
  const mergedLocales = mergeLayerLocales(nuxt);
  debug$8("merged locales", mergedLocales);
  options.locales = mergedLocales;
};
const mergeLayerPages = (analyzer, nuxt) => {
  const project = nuxt.options._layers[0];
  const layers = nuxt.options._layers;
  if (layers.length === 1)
    return;
  for (const l of layers) {
    const lPath = resolve(project.config.rootDir, l.config.rootDir, l.config.dir?.pages ?? "pages");
    debug$8("mergeLayerPages: path ->", lPath);
    analyzer(lPath);
  }
};
const mergeLayerLocales = (nuxt) => {
  const projectLayer = nuxt.options._layers[0];
  const projectI18n = projectLayer.config.i18n;
  if (projectI18n == null) {
    debug$8("project layer `i18n` configuration is required");
    return [];
  }
  debug$8("project layer `lazy` option", projectI18n.lazy);
  const mergeSimpleLocales = () => {
    if (projectI18n.locales == null)
      return [];
    const firstI18nLayer = nuxt.options._layers.find((x) => x.config.i18n?.locales && x.config.i18n?.locales?.length > 0);
    if (firstI18nLayer == null)
      return [];
    const localeType = typeof firstI18nLayer.config.i18n?.locales?.at(0);
    const isStringLocales = (val) => localeType === "string";
    const mergedLocales = [];
    for (const layer of nuxt.options._layers) {
      debug$8("layer.config.i18n.locales", layer.config.i18n?.locales);
      if (layer.config.i18n?.locales == null)
        continue;
      for (const locale of layer.config.i18n.locales) {
        if (isStringLocales()) {
          if (typeof locale !== "string")
            continue;
          if (mergedLocales.includes(locale))
            continue;
          mergedLocales.push(locale);
          continue;
        }
        if (typeof locale === "string")
          continue;
        const localeEntry = mergedLocales.find((x) => x.code === locale.code);
        if (localeEntry == null) {
          mergedLocales.push(locale);
        } else {
          Object.assign(localeEntry, locale, localeEntry);
        }
      }
    }
    return mergedLocales;
  };
  const mergeLazyLocales = () => {
    if (projectI18n.langDir == null) {
      debug$8("project layer `i18n.langDir` is required");
      return [];
    }
    const projectLangDir = getProjectPath(nuxt, projectI18n.langDir);
    debug$8("project path", getProjectPath(nuxt));
    const configs = nuxt.options._layers.filter((x) => x.config.i18n?.locales != null && x.config.i18n?.langDir != null).map((x) => ({
      ...x.config.i18n,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      langDir: resolve(x.config.rootDir, x.config.i18n.langDir),
      projectLangDir
    }));
    return mergeConfigLocales(configs);
  };
  return projectI18n.lazy ? mergeLazyLocales() : mergeSimpleLocales();
};
const getLayerLangPaths = (nuxt) => {
  return nuxt.options._layers.filter((layer) => layer.config.i18n?.langDir != null).map((layer) => resolve(layer.config.srcDir, layer.config.i18n.langDir));
};
async function resolveLayerVueI18nConfigInfo(nuxt, buildDir) {
  if (nuxt.options._layers.length === 1) {
    return [];
  }
  const layers = [...nuxt.options._layers];
  layers.shift();
  return await Promise.all(
    layers.map((layer) => resolveVueI18nConfigInfo(layer.config.i18n || {}, buildDir, layer.config.rootDir))
  );
}

const debug$7 = createDebug("@nuxtjs/i18n:pages");
function setupPages(options, nuxt, additionalOptions = {
  trailingSlash: false
}) {
  function localizeRoutesPrefixable(opts) {
    return !options.differentDomains && DefaultLocalizeRoutesPrefixable(opts);
  }
  let includeUprefixedFallback = nuxt.options.ssr === false;
  nuxt.hook("nitro:init", () => {
    debug$7("enable includeUprefixedFallback");
    includeUprefixedFallback = true;
  });
  const pagesDir = nuxt.options.dir && nuxt.options.dir.pages ? nuxt.options.dir.pages : "pages";
  const srcDir = nuxt.options.srcDir;
  const { trailingSlash } = additionalOptions;
  debug$7(`pagesDir: ${pagesDir}, srcDir: ${srcDir}, tailingSlash: ${trailingSlash}`);
  extendPages((pages) => {
    debug$7("pages making ...", pages);
    const ctx = {
      stack: [],
      srcDir,
      pagesDir,
      pages: /* @__PURE__ */ new Map()
    };
    analyzeNuxtPages(ctx, pages);
    const analyzer = (pageDirOverride) => analyzeNuxtPages(ctx, pages, pageDirOverride);
    mergeLayerPages(analyzer, nuxt);
    const localizedPages = localizeRoutes(pages, {
      ...options,
      includeUprefixedFallback,
      localizeRoutesPrefixable,
      optionsResolver: getRouteOptionsResolver(ctx, options)
    });
    pages.splice(0, pages.length);
    pages.unshift(...localizedPages);
    debug$7("... made pages", pages);
  });
}
function analyzeNuxtPages(ctx, pages, pageDirOverride) {
  const pagesPath = resolve(ctx.srcDir, pageDirOverride ?? ctx.pagesDir);
  for (const page of pages) {
    if (page.file == null) {
      continue;
    }
    const splited = page.file.split(pagesPath);
    if (splited.length === 2 && splited[1]) {
      const { dir, name } = parse(splited[1]);
      let path = "";
      if (ctx.stack.length > 0) {
        path += `${dir.slice(1, dir.length)}/${name}`;
      } else {
        if (dir !== "/") {
          path += `${dir.slice(1, dir.length)}/`;
        }
        path += name;
      }
      const p = {
        inRoot: ctx.stack.length === 0,
        path
      };
      ctx.pages.set(page, p);
      if (page.children && page.children.length > 0) {
        ctx.stack.push(page.path);
        analyzeNuxtPages(ctx, page.children);
        ctx.stack.pop();
      }
    }
  }
}
function getRouteOptionsResolver(ctx, options) {
  const { pages, defaultLocale, parsePages, customRoutes } = options;
  let useConfig = false;
  if (isBoolean(parsePages)) {
    console.warn(
      formatMessage(
        `'parsePages' option is deprecated. Please use 'customRoutes' option instead. We will remove it in v8 official release.`
      )
    );
    useConfig = !parsePages;
  } else {
    useConfig = customRoutes === "config";
  }
  debug$7("getRouteOptionsResolver useConfig", useConfig);
  return (route, localeCodes) => {
    const ret = useConfig ? getRouteOptionsFromPages(ctx, route, localeCodes, pages, defaultLocale) : getRouteOptionsFromComponent(route, localeCodes);
    debug$7("getRouteOptionsResolver resolved", route.path, route.name, ret);
    return ret;
  };
}
function resolveRoutePath(path) {
  const normalizePath = path.slice(1, path.length);
  const tokens = parseSegment(normalizePath);
  const routePath = getRoutePath(tokens);
  return routePath;
}
function getRouteOptionsFromPages(ctx, route, localeCodes, pages, defaultLocale) {
  const options = {
    locales: localeCodes,
    paths: {}
  };
  const pageMeta = ctx.pages.get(route);
  if (pageMeta == null) {
    console.warn(
      formatMessage(`Couldn't find AnalizedNuxtPageMeta by NuxtPage (${route.path}), so no custom route for it`)
    );
    return options;
  }
  const pageOptions = pageMeta.path ? pages[pageMeta.path] : void 0;
  if (pageOptions === false) {
    return null;
  }
  if (!pageOptions) {
    return options;
  }
  options.locales = options.locales.filter((locale) => pageOptions[locale] !== false);
  for (const locale of options.locales) {
    const customLocalePath = pageOptions[locale];
    if (isString(customLocalePath)) {
      options.paths[locale] = resolveRoutePath(customLocalePath);
      continue;
    }
    const customDefaultLocalePath = pageOptions[defaultLocale];
    if (isString(customDefaultLocalePath)) {
      options.paths[locale] = resolveRoutePath(customDefaultLocalePath);
    }
  }
  return options;
}
function getRouteOptionsFromComponent(route, localeCodes) {
  debug$7("getRouteOptionsFromComponent", route);
  const file = route.component || route.file;
  if (!isString(file)) {
    return null;
  }
  const options = {
    locales: localeCodes,
    paths: {}
  };
  const componentOptions = readComponent(file);
  if (componentOptions == null) {
    return options;
  }
  if (componentOptions === false) {
    return null;
  }
  options.locales = componentOptions.locales || localeCodes;
  const locales = Object.keys(componentOptions.paths || {});
  for (const locale of locales) {
    const customLocalePath = componentOptions.paths[locale];
    if (isString(customLocalePath)) {
      options.paths[locale] = resolveRoutePath(customLocalePath);
    }
  }
  return options;
}
function readComponent(target) {
  let options = void 0;
  try {
    const content = readFileSync(target);
    const { descriptor } = parse$2(content);
    if (!content.includes(NUXT_I18N_COMPOSABLE_DEFINE_ROUTE)) {
      return options;
    }
    const desc = compileScript(descriptor, { id: target });
    const { scriptSetupAst, scriptAst } = desc;
    let extract = "";
    const genericSetupAst = scriptSetupAst || scriptAst;
    if (genericSetupAst) {
      const s = new MagicString(desc.loc.source);
      genericSetupAst.forEach((ast) => {
        walk(ast, {
          enter(_node) {
            const node = _node;
            if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === NUXT_I18N_COMPOSABLE_DEFINE_ROUTE) {
              const arg = node.arguments[0];
              if (arg.type === "ObjectExpression") {
                if (verifyObjectValue(arg.properties) && arg.start != null && arg.end != null) {
                  extract = s.slice(arg.start, arg.end);
                }
              } else if (arg.type === "BooleanLiteral" && arg.start != null && arg.end != null) {
                extract = s.slice(arg.start, arg.end);
              }
            }
          }
        });
      });
    }
    if (extract) {
      options = evalValue(extract);
    }
  } catch (e) {
    console.warn(formatMessage(`Couldn't read component data at ${target}: (${e.message})`));
  }
  return options;
}
function verifyObjectValue(properties) {
  let ret = true;
  for (const prop of properties) {
    if (prop.type === "ObjectProperty") {
      if (prop.key.type === "Identifier" && prop.key.name === "locales" || prop.key.type === "StringLiteral" && prop.key.value === "locales") {
        if (prop.value.type === "ArrayExpression") {
          ret = verifyLocalesArrayExpression(prop.value.elements);
        } else {
          console.warn(formatMessage(`'locale' value is required array`));
          ret = false;
        }
      } else if (prop.key.type === "Identifier" && prop.key.name === "paths" || prop.key.type === "StringLiteral" && prop.key.value === "paths") {
        if (prop.value.type === "ObjectExpression") {
          ret = verifyPathsObjectExpress(prop.value.properties);
        } else {
          console.warn(formatMessage(`'paths' value is required object`));
          ret = false;
        }
      }
    } else {
      console.warn(formatMessage(`'defineI18nRoute' is required object`));
      ret = false;
    }
  }
  return ret;
}
function verifyPathsObjectExpress(properties) {
  let ret = true;
  for (const prop of properties) {
    if (prop.type === "ObjectProperty") {
      if (prop.key.type === "Identifier" && prop.value.type !== "StringLiteral") {
        console.warn(formatMessage(`'paths.${prop.key.name}' value is required string literal`));
        ret = false;
      } else if (prop.key.type === "StringLiteral" && prop.value.type !== "StringLiteral") {
        console.warn(formatMessage(`'paths.${prop.key.value}' value is required string literal`));
        ret = false;
      }
    } else {
      console.warn(formatMessage(`'paths' is required object`));
      ret = false;
    }
  }
  return ret;
}
function verifyLocalesArrayExpression(elements) {
  let ret = true;
  for (const element of elements) {
    if (element?.type !== "StringLiteral") {
      console.warn(formatMessage(`required 'locales' value string literal`));
      ret = false;
    }
  }
  return ret;
}
function evalValue(value) {
  try {
    return new Function(`return (${value})`)();
  } catch (e) {
    console.error(formatMessage(`Cannot evaluate value: ${value}`));
    return;
  }
}

const debug$6 = createDebug("@nuxtjs/i18n:messages");
async function extendMessages(nuxt, localeCodes, nuxtOptions) {
  const additionalMessages = [];
  await nuxt.callHook("i18n:extend-messages", additionalMessages, localeCodes);
  debug$6("i18n:extend-messages additional messages", additionalMessages);
  return normalizeMessages(additionalMessages, localeCodes, nuxtOptions);
}
const isNotObjectOrIsArray = (val) => !isObject(val) || isArray(val);
function deepCopy(src, des) {
  for (const key in src) {
    if (hasOwn(src, key)) {
      if (isNotObjectOrIsArray(src[key]) || isNotObjectOrIsArray(des[key])) {
        des[key] = src[key];
      } else {
        deepCopy(src[key], des[key]);
      }
    }
  }
}
function getLocaleCodes(fallback, locales) {
  let fallbackLocales = [];
  if (isArray(fallback)) {
    fallbackLocales = fallback;
  } else if (isObject(fallback)) {
    const targets = [...locales, "default"];
    for (const locale of targets) {
      if (fallback[locale]) {
        fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)];
      }
    }
  } else if (isString(fallback) && locales.every((locale) => locale !== fallback)) {
    fallbackLocales.push(fallback);
  }
  return fallbackLocales;
}
async function normalizeMessages(additional, localeCodes, nuxtOptions) {
  let targetLocaleCodes = [...localeCodes];
  if (isObject(nuxtOptions.vueI18n)) {
    nuxtOptions.vueI18n.messages = nuxtOptions.vueI18n.messages || {};
    const locale = nuxtOptions.defaultLocale || nuxtOptions.vueI18n.locale || "en-US";
    const locales = nuxtOptions.vueI18n.fallbackLocale ? getLocaleCodes(nuxtOptions.vueI18n.fallbackLocale, [locale]) : [locale];
    for (const locale2 of locales) {
      nuxtOptions.vueI18n.messages[locale2] = nuxtOptions.vueI18n.messages[locale2] || {};
    }
    for (const [, messages] of Object.entries(additional)) {
      for (const locale2 of locales) {
        deepCopy(messages[locale2], nuxtOptions.vueI18n.messages[locale2]);
      }
    }
    targetLocaleCodes = localeCodes.filter((code) => !locales.includes(code));
    debug$6("vueI18n messages", nuxtOptions.vueI18n.messages);
  }
  const additionalMessages = {};
  for (const localeCode of targetLocaleCodes) {
    additionalMessages[localeCode] = [];
  }
  for (const [, messages] of Object.entries(additional)) {
    for (const [locale, message] of Object.entries(messages)) {
      if (targetLocaleCodes.includes(locale)) {
        additionalMessages[locale].push(message);
      }
    }
  }
  return additionalMessages;
}

const VIRTUAL_PREFIX = "\0";
const VIRTUAL_PREFIX_HEX = "\0";
function getVirtualId(id, framework = "vite") {
  return framework === "vite" ? id.startsWith(VIRTUAL_PREFIX) ? id.slice(VIRTUAL_PREFIX.length) : "" : id;
}
function asVirtualId(id, framework = "vite") {
  return framework === "vite" ? VIRTUAL_PREFIX + id : id;
}

const debug$5 = createDebug("@nuxtjs/i18n:transform:macros");
const TransformMacroPlugin = createUnplugin((options) => {
  return {
    name: "nuxtjs:i18n-macros-transform",
    enforce: "post",
    transformInclude(id) {
      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false;
      }
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      return pathname.endsWith(".vue") || !!parseQuery(search).macro;
    },
    transform(code, id) {
      debug$5("transform", id);
      const s = new MagicString(code);
      const { search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      function result() {
        if (s.hasChanged()) {
          debug$5("transformed: id -> ", id);
          debug$5("transformed: code -> ", s.toString());
          return {
            code: s.toString(),
            map: options.sourcemap ? s.generateMap({ source: id, includeContent: true }) : void 0
          };
        }
      }
      const match = code.match(new RegExp(`\\b${NUXT_I18N_COMPOSABLE_DEFINE_ROUTE}\\s*\\(\\s*`));
      if (match?.[0]) {
        s.overwrite(match.index, match.index + match[0].length, `/*#__PURE__*/ false && ${match[0]}`);
      }
      if (!parseQuery(search).macro) {
        return result();
      }
      return result();
    }
  };
});

const debug$4 = createDebug("@nuxtjs/i18n:transform:proxy");
const ResourceProxyPlugin = createUnplugin((options = {}, meta) => {
  debug$4("options", options, meta);
  return {
    name: "nuxtjs:i18n-resource-proxy",
    resolveId(id, importer) {
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)));
      const query = parseQuery(search);
      if (pathname === NUXT_I18N_LOCALE_PROXY_ID) {
        debug$4("resolveId (locale)", id, importer);
        if (importer?.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id: withQuery(id, { from: importer }),
            moduleSideEffects: true
          };
        } else if (isString(query.from) && query.from.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id,
            moduleSideEffects: true
          };
        }
      } else if (pathname === NUXT_I18N_CONFIG_PROXY_ID) {
        debug$4("resolveId (config)", id, importer);
        if (importer?.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id: withQuery(id, { from: importer }),
            moduleSideEffects: true
          };
        } else if (isString(query.from) && query.from.endsWith(NUXT_I18N_TEMPLATE_OPTIONS_KEY)) {
          return {
            id,
            moduleSideEffects: true
          };
        }
      }
      return null;
    },
    async load(id) {
      const { pathname, search } = parseURL(decodeURIComponent(getVirtualId(id)));
      const query = parseQuery(search);
      if (pathname === NUXT_I18N_LOCALE_PROXY_ID) {
        if (isString(query.target) && isString(query.from)) {
          const baseDir = dirname$1(query.from);
          debug$4("load (locale) ->", id, baseDir);
          const code = `import { precompileLocale, formatMessage } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
import { NUXT_I18N_PRERENDERED_PATH } from '#build/${NUXT_I18N_TEMPLATE_OPTIONS_KEY}'
export default async function(locale) {
  if (process.dev || (process.server && process.env.prerender)) {
    __DEBUG__ && console.log('loadResource', locale)
    const loader = await import(${toCode(withQuery(resolve$1(baseDir, query.target), { hash: query.hash, locale: query.locale }))}).then(m => m.default || m)
    const message = await loader(locale)
    return await precompileLocale(locale, message, ${toCode(query.hash)})
  } else {
    __DEBUG__ && console.log('load precompiled resource', locale)
    let mod = null
    try {
      let url = \`\${NUXT_I18N_PRERENDERED_PATH}/${query.hash}.js\`
      if (process.server) {
        url = \`../../../../public\${url}\`
      }
      mod = await import(/* @vite-ignore */ url /* webpackChunkName: ${query.hash} */).then(
        m => m.default || m
      )
    } catch (e) {
      console.error(formatMessage(e.message))
    }
    return mod || {}
  }
}`;
          const s = new MagicString(code);
          return {
            code: s.toString(),
            map: options.sourcemap ? s.generateMap({ source: id, includeContent: true }) : void 0
          };
        }
      } else if (pathname === NUXT_I18N_CONFIG_PROXY_ID) {
        if (isString(query.target) && isString(query.from)) {
          const baseDir = dirname$1(query.from);
          debug$4("load (config) ->", id, baseDir);
          const code = `import { precompileConfig, formatMessage } from '#build/${NUXT_I18N_TEMPLATE_INTERNAL_KEY}'
import { NUXT_I18N_PRERENDERED_PATH } from '#build/${NUXT_I18N_TEMPLATE_OPTIONS_KEY}'
import { isObject, isFunction } from '@intlify/shared'
export default async function() {
  const loader = await import(${toCode(withQuery(resolve$1(baseDir, query.target), { hash: query.hash, config: "true" }))}).then(m => m.default || m)
  const config = isFunction(loader)
    ? await loader()
    : isObject(loader)
      ? loader
      : {}
  __DEBUG__ && console.log('loadConfig', config)
  if (process.dev || (process.server && process.env.prerender)) {
    config.messages = await precompileConfig(config.messages, ${toCode(query.hash)})
    return config
  } else {
    __DEBUG__ && console.log('already pre-compiled vue-i18n messages')
    let messages = null
    try {
      let url = \`\${NUXT_I18N_PRERENDERED_PATH}/${query.hash}.js\`
      if (process.server) {
        url = \`../../../../public\${url}\`
      }
      messages = await import(/* @vite-ignore */ url /* webpackChunkName: ${query.hash} */).then(
        m => m.default || m
      )
    } catch (e) {
      console.error(formatMessage(e.message))
    }
    config.messages = messages || {}
    return config
  }
}`;
          const s = new MagicString(code);
          return {
            code: s.toString(),
            map: options.sourcemap ? s.generateMap({ source: id, includeContent: true }) : void 0
          };
        }
      }
    },
    transformInclude(id) {
      if (id.startsWith(VIRTUAL_PREFIX_HEX) || !/\.([c|m]?ts)$/.test(id)) {
        return false;
      } else {
        debug$4("transformInclude", id);
        return true;
      }
    },
    transform(code, id) {
      debug$4("transform", id);
      const out = transform(code, {
        transforms: ["jsx"],
        keepUnusedImports: true
      });
      const s = new MagicString(out.code);
      return {
        code: s.toString(),
        map: options.sourcemap ? s.generateMap({ source: id, includeContent: true }) : void 0
      };
    }
  };
});

const debug$3 = createDebug("@nuxtjs/i18n:transform:dynamic");
const ResourceDynamicPlugin = createUnplugin((options) => {
  debug$3("options", options);
  const resoucesMap = /* @__PURE__ */ new Map();
  return {
    name: "nuxtjs:i18n-resource-dynamic",
    enforce: "post",
    transformInclude(id) {
      debug$3("transformInclude", id);
      if (!id || id.startsWith(VIRTUAL_PREFIX_HEX)) {
        return false;
      }
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      const query = parseQuery(search);
      return /\.([c|m]?[j|t]s)$/.test(pathname) && !!query.hash && (!!query.locale || !!query.config);
    },
    transform(code, id) {
      debug$3("transform", id);
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      const query = parseQuery(search);
      const hash = query.hash;
      const s = new MagicString(code);
      function result() {
        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: options.sourcemap && !/\.([c|m]?ts)$/.test(pathname) ? s.generateMap({ source: id, includeContent: true }) : void 0
          };
        }
      }
      const pattern = query.locale ? NUXT_I18N_COMPOSABLE_DEFINE_LOCALE : NUXT_I18N_COMPOSABLE_DEFINE_CONFIG;
      const match = code.match(new RegExp(`\\b${pattern}\\s*`));
      if (match?.[0]) {
        s.remove(match.index, match.index + match[0].length);
      }
      if (!options.dev) {
        const ref = this.emitFile({
          // @ts-expect-error
          type: "chunk",
          id,
          preserveSignature: "strict"
        });
        resoucesMap.set(id, {
          hash,
          type: query.locale ? "locale" : "config",
          locale: query.locale,
          ref
        });
      }
      return result();
    },
    vite: {
      generateBundle(outputOptions) {
        if (!options.ssr && outputOptions.dir?.endsWith("server")) {
          return;
        }
        const resources = [...resoucesMap].reduce((obj, [_, { hash, type, locale, ref }]) => {
          obj[hash] = { hash, type, locale, path: this.getFileName(ref) };
          return obj;
        }, {});
        debug$3("generateBundle: resources", resources);
        this.emitFile({
          type: "asset",
          fileName: "i18n-meta.json",
          name: "i18n-meta.json",
          source: JSON.stringify(resources, null, 2)
        });
      }
    }
  };
});

const debug$2 = createDebug("@nuxtjs/i18n:bundler");
async function extendBundler(nuxt, options) {
  const { nuxtOptions, hasLocaleFiles } = options;
  const langPaths = getLayerLangPaths(nuxt);
  debug$2("langPaths -", langPaths);
  const i18nModulePaths = nuxt.options._layers[0].config.i18n?.i18nModules?.map(
    (module) => resolve(nuxt.options._layers[0].config.rootDir, module.langDir ?? "")
  ) ?? [];
  debug$2("i18nModulePaths -", i18nModulePaths);
  const localePaths = [...langPaths, ...i18nModulePaths];
  if (nuxt.options.nitro.replace) {
    nuxt.options.nitro.replace["__DEBUG__"] = nuxtOptions.debug;
  } else {
    nuxt.options.nitro.replace = {
      __DEBUG__: nuxtOptions.debug
    };
  }
  debug$2("nitro.replace", nuxt.options.nitro.replace);
  const proxyOptions = {
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  };
  const macroOptions = {
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  };
  const dynamicOptions = {
    prerenderTargs: options.prerenderTargets,
    ssr: nuxt.options.ssr,
    dev: nuxt.options.dev,
    sourcemap: nuxt.options.sourcemap.server || nuxt.options.sourcemap.client
  };
  try {
    const webpack = await import('webpack').then((m) => m.default || m);
    const webpackPluginOptions = {
      runtimeOnly: true,
      allowDynamic: true,
      strictMessage: nuxtOptions.precompile.strictMessage,
      escapeHtml: nuxtOptions.precompile.escapeHtml
    };
    if (hasLocaleFiles && localePaths.length > 0) {
      webpackPluginOptions.include = localePaths.map((x) => resolve(x, "./**"));
    }
    addWebpackPlugin(ResourceProxyPlugin.webpack(proxyOptions));
    addWebpackPlugin(VueI18nWebpackPlugin(webpackPluginOptions));
    addWebpackPlugin(TransformMacroPlugin.webpack(macroOptions));
    addWebpackPlugin(ResourceDynamicPlugin.webpack(dynamicOptions));
    extendWebpackConfig((config) => {
      config.plugins.push(
        new webpack.DefinePlugin({
          __VUE_I18N_FULL_INSTALL__: "true",
          __VUE_I18N_LEGACY_API__: "true",
          __INTLIFY_PROD_DEVTOOLS__: "false",
          __DEBUG__: JSON.stringify(nuxtOptions.debug)
        })
      );
    });
  } catch (e) {
    debug$2(e.message);
  }
  const vitePluginOptions = {
    runtimeOnly: true,
    allowDynamic: true,
    strictMessage: nuxtOptions.precompile.strictMessage,
    escapeHtml: nuxtOptions.precompile.escapeHtml
  };
  if (hasLocaleFiles && localePaths.length > 0) {
    vitePluginOptions.include = localePaths.map((x) => resolve(x, "./**"));
  }
  addVitePlugin(ResourceProxyPlugin.vite(proxyOptions));
  addVitePlugin(VueI18nVitePlugin(vitePluginOptions));
  addVitePlugin(TransformMacroPlugin.vite(macroOptions));
  addVitePlugin(ResourceDynamicPlugin.vite(dynamicOptions));
  extendViteConfig((config) => {
    if (config.define) {
      config.define["__DEBUG__"] = JSON.stringify(nuxtOptions.debug);
    } else {
      config.define = {
        __DEBUG__: JSON.stringify(nuxtOptions.debug)
      };
    }
    debug$2("vite.config.define", config.define);
  });
}

const debug$1 = createDebug("@nuxtjs/i18n:gen");
function generateLoaderOptions(lazy, langDir, localesRelativeBase, vueI18nConfigPathInfo, vueI18nConfigPaths, options = {}, misc = { dev: true, ssg: false }) {
  debug$1("generateLoaderOptions: lazy", lazy);
  debug$1("generateLoaderOptions: localesRelativeBase", localesRelativeBase);
  debug$1("generateLoaderOptions: vueI18nConfigPathInfo", vueI18nConfigPathInfo);
  const generatedImports = /* @__PURE__ */ new Map();
  const importMapper = /* @__PURE__ */ new Map();
  const convertToPairs = ({ file, files, path, paths, hash, hashes, type, types }) => {
    const _files = file ? [file] : files || [];
    const _paths = path ? [path] : paths || [];
    const _hashes = hash ? [hash] : hashes || [];
    const _types = type ? [type] : types || [];
    return _files.map((f, i) => ({ file: f, path: _paths[i], hash: _hashes[i], type: _types[i] }));
  };
  const makeImportKey = (root, dir, base) => normalize(`${root ? `${root}/` : ""}${dir ? `${dir}/` : ""}${base}`);
  function generateSyncImports(gen, absolutePath, type, localeCode, hash, relativePath) {
    if (!relativePath) {
      return gen;
    }
    const { root, dir, base, ext } = parse(relativePath);
    const key = makeImportKey(root, dir, base);
    if (!generatedImports.has(key)) {
      let loadPath = relativePath;
      if (langDir) {
        loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, relativePath);
      }
      const assertFormat = ext.slice(1);
      const variableName = genSafeVariableName(`locale_${convertToImportId(key)}`);
      gen += `${genImport(
        genImportSpecifier(loadPath, ext, absolutePath, type, {
          hash,
          virtualId: NUXT_I18N_LOCALE_PROXY_ID,
          query: { locale: localeCode }
        }),
        variableName,
        assertFormat ? { assert: { type: assertFormat } } : {}
      )}
`;
      importMapper.set(key, variableName);
      generatedImports.set(key, loadPath);
    }
    return gen;
  }
  let genCode = "";
  const localeInfo = options.localeInfo || [];
  const syncLocaleFiles = /* @__PURE__ */ new Set();
  const asyncLocaleFiles = /* @__PURE__ */ new Set();
  if (langDir) {
    for (const locale of localeInfo) {
      if (!syncLocaleFiles.has(locale) && !asyncLocaleFiles.has(locale)) {
        (lazy ? asyncLocaleFiles : syncLocaleFiles).add(locale);
      }
    }
  }
  for (const localeInfo2 of syncLocaleFiles) {
    convertToPairs(localeInfo2).forEach(({ path, type, file, hash }) => {
      genCode = generateSyncImports(genCode, path, type, localeInfo2.code, hash, file);
    });
  }
  const stripPathFromLocales = (locales) => {
    if (isArray(locales)) {
      return locales.map((locale) => {
        if (isObject(locale)) {
          const obj = { ...locale };
          delete obj.path;
          delete obj.paths;
          return obj;
        } else {
          return locale;
        }
      });
    } else {
      return locales;
    }
  };
  const generateVueI18nConfigration = (configPath, fn) => {
    const { absolute: absolutePath, relative: relativePath, hash } = configPath;
    if (absolutePath != null && relativePath != null && hash != null) {
      const { ext } = parse(absolutePath);
      const { dir, base: _base, ext: relativeExt } = parse(relativePath);
      const base = relativeExt === ".config" ? `${_base}${ext}` : _base;
      return fn(configPath, { dir, base, ext });
    } else {
      return null;
    }
  };
  genCode += `${Object.entries(options).map(([rootKey, rootValue]) => {
    if (rootKey === "nuxtI18nOptions") {
      let genCodes = `export const resolveNuxtI18nOptions = async (context) => {
`;
      genCodes += `  const ${rootKey} = Object({})
`;
      for (const [key, value] of Object.entries(rootValue)) {
        if (key === "vueI18n") {
          genCodes += ` const vueI18nConfigLoader = async (loader) => {
            const config = await loader().then(r => r.default || r)
            return typeof config === 'object'
              ? config
              : typeof config === 'function'
                ? await config()
                : {}
          }
`;
          const basicVueI18nConfigCode = generateVueI18nConfigration(vueI18nConfigPathInfo, ({ absolute: absolutePath, relative: relativePath, hash, relativeBase, type }, { dir, base, ext }) => {
            const configImportKey = makeImportKey(relativeBase, dir, base);
            return `const vueI18n = await vueI18nConfigLoader((${genDynamicImport(genImportSpecifier(configImportKey, ext, absolutePath, type, { hash, virtualId: NUXT_I18N_CONFIG_PROXY_ID }), { comment: `webpackChunkName: "${normalizeWithUnderScore(relativePath)}_${hash}"` })}))
`;
          });
          if (basicVueI18nConfigCode != null) {
            genCodes += `  ${basicVueI18nConfigCode}`;
            genCodes += `  ${rootKey}.${key} = vueI18n
`;
          } else {
            genCodes += `  ${rootKey}.${key} = ${toCode({})}
`;
          }
          if (vueI18nConfigPaths.length > 0) {
            genCodes += `  const deepCopy = (src, des, predicate) => {
            for (const key in src) {
              if (typeof src[key] === 'object') {
                if (!typeof des[key] === 'object') des[key] = {}
                deepCopy(src[key], des[key], predicate)
              } else {
                if (predicate) {
                  if (predicate(src[key], des[key])) {
                    des[key] = src[key]
                  }
                } else {
                  des[key] = src[key]
                }
              }
            }
          }
          const mergeMessages = async (messages, loader) => {
            const layerConfig = await vueI18nConfigLoader(loader)
            const vueI18n = layerConfig.vueI18n || {}
            const layerMessages = vueI18n.messages || {}
            for (const [locale, message] of Object.entries(layerMessages)) {
              deepCopy(message, messages[locale])
            }
          }
`;
          }
          for (const configPath of vueI18nConfigPaths) {
            const additionalVueI18nConfigCode = generateVueI18nConfigration(configPath, ({ absolute: absolutePath, relative: relativePath, hash, relativeBase, type }, { dir, base, ext }) => {
              const configImportKey = makeImportKey(relativeBase, dir, base);
              return `await mergeMessages(${rootKey}.${key}.messages, (${genDynamicImport(genImportSpecifier(configImportKey, ext, absolutePath, type, { hash, virtualId: NUXT_I18N_CONFIG_PROXY_ID }), { comment: `webpackChunkName: "${normalizeWithUnderScore(relativePath)}_${hash}"` })}))
`;
            });
            if (additionalVueI18nConfigCode != null) {
              genCodes += `  ${additionalVueI18nConfigCode}`;
            }
          }
        } else {
          genCodes += `  ${rootKey}.${key} = ${toCode(key === "locales" ? stripPathFromLocales(value) : value)}
`;
        }
      }
      genCodes += `  return nuxtI18nOptions
`;
      genCodes += `}
`;
      return genCodes;
    } else if (rootKey === "nuxtI18nOptionsDefault") {
      return `export const ${rootKey} = Object({${Object.entries(rootValue).map(([key, value]) => {
        return `${key}: ${toCode(value)}`;
      }).join(`,`)}})
`;
    } else if (rootKey === "nuxtI18nInternalOptions") {
      return `export const ${rootKey} = Object({${Object.entries(rootValue).map(([key, value]) => {
        return `${key}: ${toCode(key === "__normalizedLocales" ? stripPathFromLocales(value) : value)}`;
      }).join(`,`)}})
`;
    } else if (rootKey === "localeInfo") {
      let codes = `export const localeMessages = {
`;
      if (langDir) {
        for (const { code, file, files } of syncLocaleFiles) {
          const syncPaths = file ? [file] : files || [];
          codes += `  ${toCode(code)}: [${syncPaths.map((filepath) => {
            const { root, dir, base } = parse(filepath);
            const key = makeImportKey(root, dir, base);
            return `{ key: ${toCode(generatedImports.get(key))}, load: () => Promise.resolve(${importMapper.get(key)}) }`;
          })}],
`;
        }
        for (const localeInfo2 of asyncLocaleFiles) {
          codes += `  ${toCode(localeInfo2.code)}: [${convertToPairs(localeInfo2).map(({ file, path, hash, type }) => {
            const { root, dir, base, ext } = parse(file);
            const key = makeImportKey(root, dir, base);
            const loadPath = resolveLocaleRelativePath(localesRelativeBase, langDir, file);
            return `{ key: ${toCode(loadPath)}, load: ${genDynamicImport(genImportSpecifier(loadPath, ext, path, type, { hash, query: { locale: localeInfo2.code } }), { comment: `webpackChunkName: "lang_${normalizeWithUnderScore(key)}"` })} }`;
          })}],
`;
        }
      }
      codes += `}
`;
      return codes;
    } else if (rootKey === "additionalMessages") {
      return `export const ${rootKey} = ${generateAdditionalMessages(rootValue, misc.dev)}
`;
    } else {
      return `export const ${rootKey} = ${toCode(rootValue)}
`;
    }
  }).join("\n")}`;
  genCode += `export const NUXT_I18N_MODULE_ID = ${toCode(NUXT_I18N_MODULE_ID)}
`;
  genCode += `export const NUXT_I18N_PRECOMPILE_ENDPOINT = ${toCode(NUXT_I18N_PRECOMPILE_ENDPOINT)}
`;
  genCode += `export const NUXT_I18N_PRECOMPILED_LOCALE_KEY = ${toCode(NUXT_I18N_PRECOMPILED_LOCALE_KEY)}
`;
  genCode += `export const NUXT_I18N_PRERENDERED_PATH = ${toCode(NUXT_I18N_PRERENDERED_PATH)}
`;
  genCode += `export const NULL_HASH = ${toCode(NULL_HASH)}
`;
  genCode += `export const isSSG = ${toCode(misc.ssg)}
`;
  debug$1("generate code", genCode);
  return genCode;
}
function raiseSyntaxError(path) {
  throw new Error(`'unknown' type in '${path}'.`);
}
function genImportSpecifier(id, ext, absolutePath, type, {
  hash = NULL_HASH,
  virtualId = NUXT_I18N_LOCALE_PROXY_ID,
  query = {}
} = {}) {
  if (EXECUTABLE_EXTENSIONS.includes(ext)) {
    if (virtualId === NUXT_I18N_LOCALE_PROXY_ID) {
      type === "unknown" && raiseSyntaxError(absolutePath);
      return type === "dynamic" ? asVirtualId(withQuery(virtualId, { target: id, hash, ...query })) : id;
    } else if (virtualId === NUXT_I18N_CONFIG_PROXY_ID) {
      type === "unknown" && raiseSyntaxError(absolutePath);
      return asVirtualId(withQuery(virtualId, { target: id, hash, ...query }));
    } else {
      return id;
    }
  } else {
    return id;
  }
}
const IMPORT_ID_CACHES = /* @__PURE__ */ new Map();
const normalizeWithUnderScore = (name) => name.replace(/-/g, "_").replace(/\./g, "_").replace(/\//g, "_");
function convertToImportId(file) {
  if (IMPORT_ID_CACHES.has(file)) {
    return IMPORT_ID_CACHES.get(file);
  }
  const { name } = parse(file);
  const id = normalizeWithUnderScore(name);
  IMPORT_ID_CACHES.set(file, id);
  return id;
}
function resolveLocaleRelativePath(relativeBase, langDir, file) {
  return normalize(`${relativeBase}/${langDir}/${file}`);
}
function generateAdditionalMessages(value, dev) {
  let genCode = "Object({";
  for (const [locale, messages] of Object.entries(value)) {
    genCode += `${JSON.stringify(locale)}:[`;
    for (const [, p] of Object.entries(messages)) {
      genCode += `() => Promise.resolve(${generateJSON(JSON.stringify(p), { type: "bare", env: dev ? "development" : "production" }).code}),`;
    }
    genCode += `],`;
  }
  genCode += "})";
  return genCode;
}

const debug = createDebug("@nuxtjs/i18n:module");
const module = defineNuxtModule({
  meta: {
    name: NUXT_I18N_MODULE_ID,
    configKey: "i18n",
    compatibility: {
      nuxt: "^3.0.0-rc.11",
      bridge: false
    }
  },
  defaults: DEFAULT_OPTIONS,
  async setup(i18nOptions, nuxt) {
    const logger = useLogger(NUXT_I18N_MODULE_ID);
    const options = i18nOptions;
    debug("options", options);
    if (options.experimental.jsTsFormatResource) {
      logger.warn("JS / TS extension format is experimental");
    }
    checkOptions(options);
    if (isNuxt2(nuxt)) {
      throw new Error(
        formatMessage(
          `We will release >=7.3 <8, See about GitHub Discussions https://github.com/nuxt-community/i18n-module/discussions/1287#discussioncomment-3042457: ${getNuxtVersion(
            nuxt
          )}`
        )
      );
    }
    if (!isNuxt3(nuxt)) {
      throw new Error(formatMessage(`Cannot support nuxt version: ${getNuxtVersion(nuxt)}`));
    }
    await mergeI18nModules(options, nuxt);
    applyLayerOptions(options, nuxt);
    if (options.strategy === "no_prefix" && options.differentDomains) {
      console.warn(
        formatMessage(
          "The `differentDomains` option and `no_prefix` strategy are not compatible. Change strategy or disable `differentDomains` option."
        )
      );
    }
    nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
      experimental: options.experimental,
      baseUrl: options.baseUrl
      // TODO: we should support more i18n module options. welcome PRs :-)
    });
    nuxt.options.runtimeConfig.i18n = defu(nuxt.options.runtimeConfig.i18n, {
      precompile: options.precompile,
      ssr: nuxt.options.ssr
    });
    if (isString(options.langDir) && isAbsolute(options.langDir)) {
      logger.warn(
        `\`langdir\` is set to an absolute path (${options.langDir}) but should be set a path relative to \`srcDir\` (${nuxt.options.srcDir}). Absolute paths will not work in production, see https://v8.i18n.nuxtjs.org/options/lazy#langdir for more details.`
      );
    }
    const langPath = isString(options.langDir) ? resolve(nuxt.options.srcDir, options.langDir) : null;
    debug("langDir path", langPath);
    const normalizedLocales = getNormalizedLocales(options.locales);
    const hasLocaleFiles = normalizedLocales.length > 0;
    const localeCodes = normalizedLocales.map((locale) => locale.code);
    const localeInfo = langPath != null ? await resolveLocales(langPath, normalizedLocales) : [];
    debug("localeInfo", localeInfo);
    if (isObject(options.vueI18n)) {
      throw new Error(
        formatMessage(
          `The \`vueI18n\` option is no longer be specified with object. 
It must be specified in the configuration file via the 'i18n.config' path.
About deprecated reason, see https://v8.i18n.nuxtjs.org/guide/migrating#change-the-route-key-rules-in-pages-option
About new configuration style, see https://v8.i18n.nuxtjs.org/getting-started/basic-usage#translate-with-vue-i18n`
        )
      );
    }
    const vueI18nConfigPathInfo = await resolveVueI18nConfigInfo(options, nuxt.options.buildDir, nuxt.options.rootDir);
    if (vueI18nConfigPathInfo.absolute == null) {
      logger.warn(`Vue I18n configuration file does not exist at ${vueI18nConfigPathInfo.relative}. Skipping...`);
    }
    debug("vueI18nConfigPathInfo", vueI18nConfigPathInfo);
    const layerVueI18nConfigPaths = await resolveLayerVueI18nConfigInfo(nuxt, nuxt.options.buildDir);
    for (const vueI18nConfigPath of layerVueI18nConfigPaths) {
      if (vueI18nConfigPath.absolute == null) {
        logger.warn(
          `Ignore Vue I18n configuration file does not exist at ${vueI18nConfigPath.relative} on layer ${vueI18nConfigPath.rootDir}. Skipping...`
        );
      }
    }
    debug("layerVueI18nConfigPaths", layerVueI18nConfigPaths);
    if ("i18n:extend-messages" in nuxt.hooks._hooks) {
      logger.warn(
        "`i18n:extend-messages` is deprecated. That hook will be removed feature at the time of the v8 official release.\nIf you're using it, please use `i18n:registerModule` instead."
      );
    }
    const additionalMessages = await extendMessages(nuxt, localeCodes, options);
    if (options.strategy !== "no_prefix" && localeCodes.length) {
      await setupPages(options, nuxt, { trailingSlash: options.trailingSlash });
    }
    await setupAlias(nuxt);
    addPlugin(resolve(runtimeDir, "plugins/i18n"));
    nuxt.options.alias["#i18n"] = resolve(distDir, "runtime/composables.mjs");
    nuxt.options.build.transpile.push("#i18n");
    addTemplate({
      filename: "i18n.internal.mjs",
      src: resolve(distDir, "runtime/internal.mjs")
    });
    addTemplate({
      filename: "i18n.utils.mjs",
      src: resolve(distDir, "runtime/utils.mjs")
    });
    const localesRelativeBasePath = relative(nuxt.options.buildDir, nuxt.options.srcDir);
    debug("localesRelativeBasePath", localesRelativeBasePath);
    addTemplate({
      filename: NUXT_I18N_TEMPLATE_OPTIONS_KEY,
      write: true,
      getContents: () => {
        return generateLoaderOptions(
          options.lazy,
          options.langDir,
          localesRelativeBasePath,
          vueI18nConfigPathInfo,
          layerVueI18nConfigPaths,
          {
            localeCodes,
            localeInfo,
            additionalMessages,
            nuxtI18nOptions: options,
            nuxtI18nOptionsDefault: DEFAULT_OPTIONS,
            nuxtI18nInternalOptions: {
              __normalizedLocales: normalizedLocales
            }
          },
          {
            ssg: nuxt.options._generate,
            dev: nuxt.options.dev
          }
        );
      }
    });
    if (!!options.dynamicRouteParams) {
      addPlugin(resolve(runtimeDir, "plugins/meta"));
    }
    const isLegacyMode = () => options.types === "legacy";
    addPlugin(resolve(runtimeDir, isLegacyMode() ? "plugins/legacy" : "plugins/composition"));
    nuxt.hook("prepare:types", ({ references }) => {
      const vueI18nTypeFilename = resolve(runtimeDir, "types");
      references.push({ path: resolve(nuxt.options.buildDir, vueI18nTypeFilename) });
    });
    const prerenderTargets = analyzePrerenderTargets(localeInfo, [vueI18nConfigPathInfo, ...layerVueI18nConfigPaths]);
    debug("prerenderTargets", prerenderTargets);
    await extendBundler(nuxt, {
      nuxtOptions: options,
      hasLocaleFiles,
      langPath,
      prerenderTargets
    });
    addServerHandler({
      method: "post",
      route: NUXT_I18N_PRECOMPILE_ENDPOINT,
      handler: resolve(runtimeDir, "./server/precompile")
    });
    addServerHandler({
      method: "get",
      route: "/__i18n__/prerender/:hash",
      handler: resolve(runtimeDir, "./server/dynamic")
    });
    for (const hash of prerenderTargets.keys()) {
      addPrerenderRoutes(`/__i18n__/prerender/${hash}.js`);
    }
    const storageKey = "i18n";
    nuxt.hook("nitro:config", (nitro) => {
      nitro.storage = nitro.storage || {};
      nitro.storage[storageKey] = {
        driver: "fs",
        base: resolve(nuxt.options.buildDir, storageKey)
      };
    });
    nuxt.hook("nitro:init", async () => {
      if (nuxt.options.dev) {
        await rm(resolve(nuxt.options.buildDir, storageKey));
      }
    });
    const pkgMgr = await getPackageManagerType();
    const vueI18nPath = await resolveVueI18nAlias(pkgModulesDir, nuxt, pkgMgr);
    debug("vueI18nPath for auto-import", vueI18nPath);
    await addImports([
      { name: "useI18n", from: vueI18nPath },
      ...[
        "useRouteBaseName",
        "useLocalePath",
        "useLocaleRoute",
        "useSwitchLocalePath",
        "useLocaleHead",
        "useBrowserLocale",
        "useCookieLocale",
        NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
        NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
        NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
      ].map((key) => ({
        name: key,
        as: key,
        from: resolve(runtimeDir, "composables")
      }))
    ]);
    nuxt.options.build.transpile.push("@nuxtjs/i18n");
    nuxt.options.build.transpile.push("@nuxtjs/i18n-edge");
    nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {};
    nuxt.options.vite.optimizeDeps.exclude = nuxt.options.vite.optimizeDeps.exclude || [];
    nuxt.options.vite.optimizeDeps.exclude.push("vue-i18n");
  }
});
function checkOptions(options) {
  if (options.lazy && !options.langDir) {
    throw new Error(formatMessage('When using the "lazy" option you must also set the "langDir" option.'));
  }
  if (options.langDir) {
    const locales = options.locales || [];
    if (!locales.length || isString(locales[0])) {
      throw new Error(formatMessage('When using the "langDir" option the "locales" must be a list of objects.'));
    }
    for (const locale of locales) {
      if (isString(locale) || !(locale.file || locale.files)) {
        throw new Error(
          formatMessage(
            `All locales must be objects and have the "file" or "files" property set when using "langDir".
Found none in:
${JSON.stringify(locale, null, 2)}.`
          )
        );
      }
    }
  }
}

export { module as default };
