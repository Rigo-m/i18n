globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import 'node-fetch-native/polyfill';
import { withoutBase, joinURL, parseURL, withQuery } from 'ufo';
import { eventHandler, setHeaders, sendRedirect, proxyRequest, defineEventHandler, handleCacheHeaders, createEvent, getRequestHeader, setResponseStatus, setResponseHeader, getRequestHeaders, readBody, createError, createApp, createRouter as createRouter$1, toNodeListener, fetchWithEvent, lazyEventHandler } from 'h3';
import defu, { defuFn } from 'defu';
import { toRouteMatcher, createRouter } from 'radix3';
import destr from 'destr';
import { snakeCase } from 'scule';
import { createFetch as createFetch$1, Headers } from 'ofetch';
import { createCall, createFetch } from 'unenv/runtime/fetch/index';
import { createHooks } from 'hookable';
import { hash } from 'ohash';
import { createStorage, prefixStorage } from 'unstorage';
import unstorage_47drivers_47fs from 'unstorage/drivers/fs';
import { generateJSON } from '@intlify/bundle-utils';
import { relative, join } from 'pathe';

const inlineAppConfig = {};



const appConfig = defuFn(inlineAppConfig);

const _runtimeConfig = {"app":{"baseURL":"/","buildAssetsDir":"/_nuxt/","cdnURL":""},"nitro":{"envPrefix":"NUXT_","routeRules":{"/__nuxt_error":{"cache":false},"/_nuxt/**":{"headers":{"cache-control":"public, max-age=31536000, immutable"}}}},"public":{"i18n":{"experimental":{"jsTsFormatResource":true},"baseUrl":"http://localhost:3000"}},"i18n":{"precompile":{"strictMessage":false,"escapeHtml":true},"ssr":true}};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _runtimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
overrideConfig(_runtimeConfig);
const runtimeConfig = deepFreeze(_runtimeConfig);
const useRuntimeConfig = () => runtimeConfig;
deepFreeze(appConfig);
function getEnv(key) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]
  );
}
function isObject$1(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function overrideConfig(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey);
    if (isObject$1(obj[key])) {
      if (isObject$1(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      overrideConfig(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
}
function deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler() {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      return sendRedirect(
        event,
        routeRules.redirect.to,
        routeRules.redirect.statusCode
      );
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      }
      return proxyRequest(event, target, {
        fetch: $fetch.raw,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    const path = new URL(event.node.req.url, "http://localhost").pathname;
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(path, useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

const _assets = {

};

function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0].replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}

const assets = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

const storage = createStorage({});

storage.mount('/assets', assets);

storage.mount('i18n', unstorage_47drivers_47fs({"driver":"fs","base":"/Users/rigo/Projects/i18n/playground/.nuxt/i18n","ignore":["**/node_modules/**","**/.git/**"]}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = hash([opts.integrity, fn, opts]);
  const validate = opts.validate || (() => true);
  async function get(key, resolver, shouldInvalidateCache) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || !validate(entry);
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry)) {
          useStorage().setItem(cacheKey, entry).catch((error) => console.error("[nitro] [cache]", error));
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (opts.swr && entry.value) {
      _resolvePromise.catch(console.error);
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = opts.shouldInvalidateCache?.(...args);
    const entry = await get(key, () => fn(...args), shouldInvalidateCache);
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length > 0 ? hash(args, {}) : "";
}
function escapeKey(key) {
  return key.replace(/[^\dA-Za-z]/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const key = await opts.getKey?.(event);
      if (key) {
        return escapeKey(key);
      }
      const url = event.node.req.originalUrl || event.node.req.url;
      const friendlyName = escapeKey(decodeURI(parseURL(url).pathname)).slice(
        0,
        16
      );
      const urlHash = hash(url);
      return `${friendlyName}.${urlHash}`;
    },
    validate: (entry) => {
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: [opts.integrity, handler]
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const reqProxy = cloneWithProxy(incomingEvent.node.req, { headers: {} });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            for (const header in headers2) {
              this.setHeader(header, headers2[header]);
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.context = incomingEvent.context;
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = headers.Etag || headers.etag || `W/"${hash(body)}"`;
      headers["last-modified"] = headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString();
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(event);
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      event.node.res.setHeader(name, response.headers[name]);
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const plugins = [
  
];

function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function normalizeError(error) {
  const cwd = typeof process.cwd === "function" ? process.cwd() : "/";
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Not Found" : "");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}

const errorHandler = (async function errorhandler(error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(error);
  const errorObject = {
    url: event.node.req.url,
    statusCode,
    statusMessage,
    message,
    stack: "",
    data: error.data
  };
  setResponseStatus(event, errorObject.statusCode !== 200 && errorObject.statusCode || 500, errorObject.statusMessage);
  if (error.unhandled || error.fatal) {
    const tags = [
      "[nuxt]",
      "[request error]",
      error.unhandled && "[unhandled]",
      error.fatal && "[fatal]",
      Number(errorObject.statusCode) !== 200 && `[${errorObject.statusCode}]`
    ].filter(Boolean).join(" ");
    console.error(tags, errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (isJsonRequest(event)) {
    setResponseHeader(event, "Content-Type", "application/json");
    event.node.res.end(JSON.stringify(errorObject));
    return;
  }
  const isErrorPage = event.node.req.url?.startsWith("/__nuxt_error");
  const res = !isErrorPage ? await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig().app.baseURL, "/__nuxt_error"), errorObject), {
    headers: getRequestHeaders(event),
    redirect: "manual"
  }).catch(() => null) : null;
  if (!res) {
    const { template } = await import('../error-500.mjs');
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    event.node.res.end(template(errorObject));
    return;
  }
  for (const [header, value] of res.headers.entries()) {
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : void 0, res.statusText);
  event.node.res.end(await res.text());
});

const BASE_KEY = "i18n";
const CONFIG_KEY = "config";
const configStorage = prefixStorage(useStorage(), BASE_KEY);
const PRECOMPILED_LOCALE_KEY = "i18n:locales";
const localeStorage = prefixStorage(useStorage(), PRECOMPILED_LOCALE_KEY);
const resolveKey = (key) => `${key}.js`;
const localeKey = (locale, hash) => `${locale}-${hash}`;
const configKey = (hash) => `${CONFIG_KEY}-${hash}`;
const _q7502u = defineEventHandler(async (event) => {
  const body = await readBody(event);
  validate(body);
  const cacheCode = await getCacheCode(body);
  if (cacheCode) {
    await setResponseHeader(event, "content-type", "text/javascript");
    return cacheCode.toString();
  }
  const [code, errors] = generateCode(body);
  if (errors.length > 0) {
    throw createError({ statusMessage: errors.join("|"), statusCode: 400 });
  }
  await setCacheCode(code, body);
  await setResponseHeader(event, "content-type", "text/javascript");
  return code;
});
function validate(body) {
  if (!body.type) {
    throw createError({ statusMessage: `require the 'type'`, statusCode: 400 });
  }
  if (body.type === "locale") {
    if (!body.locale) {
      throw createError({ statusMessage: `require the 'locale'`, statusCode: 400 });
    }
  }
  if (!body.hash) {
    throw createError({ statusMessage: `require the 'hash'`, statusCode: 400 });
  }
  if (!body.resource) {
    throw createError({ statusMessage: `require the 'resource'`, statusCode: 400 });
  }
}
async function getCacheCode({ type, locale, hash }) {
  if (type === "locale") {
    return await localeStorage.getItem(resolveKey(localeKey(locale, hash)));
  } else if (type === "config") {
    return await configStorage.getItem(resolveKey(configKey(hash)));
  } else {
    return null;
  }
}
function generateCode(body) {
  const errors = [];
  const {
    i18n: {
      precompile: { strictMessage, escapeHtml }
    }
  } = useRuntimeConfig();
  const env = "production";
  let gen = "";
  if (body.type === "locale") {
    const { code } = generateJSON(JSON.stringify(body.resource), {
      env,
      strictMessage,
      escapeHtml,
      onError: (error) => {
        errors.push(error);
      }
    });
    gen = code;
  } else if (body.type === "config") {
    gen += `export default {
`;
    const codes = [];
    Object.keys(body.resource).reduce((codes2, key) => {
      const { code } = generateJSON(JSON.stringify(body.resource[key]), {
        type: "bare",
        env,
        strictMessage,
        escapeHtml,
        onError: (error) => {
          errors.push(error);
        }
      });
      codes2.push(`  ${JSON.stringify(key)}: ${code},
`);
      return codes2;
    }, codes);
    gen += codes.join("");
    gen += `}
`;
  }
  return [gen, errors];
}
async function setCacheCode(code, { type, locale, hash }) {
  if (type === "locale") {
    await localeStorage.setItem(resolveKey(localeKey(locale, hash)), code);
  } else if (type === "config") {
    await configStorage.setItem(resolveKey(configKey(hash)), code);
  }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : "undefined" !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var shared = {exports: {}};

var shared_prod = {};

/*!
  * shared v9.3.0-beta.17
  * (c) 2023 kazuya kawaguchi
  * Released under the MIT License.
  */

/**
 * Original Utilities
 * written by kazuya kawaguchi
 */
const inBrowser = "undefined" !== 'undefined';
let mark;
let measure;
const RE_ARGS = /\{([0-9a-zA-Z]+)\}/g;
/* eslint-disable */
function format(message, ...args) {
    if (args.length === 1 && isObject(args[0])) {
        args = args[0];
    }
    if (!args || !args.hasOwnProperty) {
        args = {};
    }
    return message.replace(RE_ARGS, (match, identifier) => {
        return args.hasOwnProperty(identifier) ? args[identifier] : '';
    });
}
const makeSymbol = (name, shareable = false) => !shareable ? Symbol(name) : Symbol.for(name);
const generateFormatCacheKey = (locale, key, source) => friendlyJSONstringify({ l: locale, k: key, s: source });
const friendlyJSONstringify = (json) => JSON.stringify(json)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/\u0027/g, '\\u0027');
const isNumber = (val) => typeof val === 'number' && isFinite(val);
const isDate = (val) => toTypeString(val) === '[object Date]';
const isRegExp = (val) => toTypeString(val) === '[object RegExp]';
const isEmptyObject = (val) => isPlainObject(val) && Object.keys(val).length === 0;
function warn(msg, err) {
    if (typeof console !== 'undefined') {
        console.warn(`[intlify] ` + msg);
        /* istanbul ignore if */
        if (err) {
            console.warn(err.stack);
        }
    }
}
const assign = Object.assign;
let _globalThis;
const getGlobalThis = () => {
    // prettier-ignore
    return (_globalThis ||
        (_globalThis =
            typeof globalThis !== 'undefined'
                ? globalThis
                : typeof self !== 'undefined'
                    ? self
                    : typeof commonjsGlobal !== 'undefined'
                            ? commonjsGlobal
                            : {}));
};
function escapeHtml(rawText) {
    return rawText
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
}
/* eslint-enable */
/**
 * Useful Utilities By Evan you
 * Modified by kazuya kawaguchi
 * MIT License
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/index.ts
 * https://github.com/vuejs/vue-next/blob/master/packages/shared/src/codeframe.ts
 */
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isBoolean = (val) => typeof val === 'boolean';
const isSymbol = (val) => typeof val === 'symbol';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObject = (val) => val !== null && typeof val === 'object';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isPromise = (val) => {
    return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const isPlainObject = (val) => toTypeString(val) === '[object Object]';
// for converting list and named values to displayed strings.
const toDisplayString = (val) => {
    return val == null
        ? ''
        : isArray(val) || (isPlainObject(val) && val.toString === objectToString)
            ? JSON.stringify(val, null, 2)
            : String(val);
};
const RANGE = 2;
function generateCodeFrame(source, start = 0, end = source.length) {
    const lines = source.split(/\r?\n/);
    let count = 0;
    const res = [];
    for (let i = 0; i < lines.length; i++) {
        count += lines[i].length + 1;
        if (count >= start) {
            for (let j = i - RANGE; j <= i + RANGE || end > count; j++) {
                if (j < 0 || j >= lines.length)
                    continue;
                const line = j + 1;
                res.push(`${line}${' '.repeat(3 - String(line).length)}|  ${lines[j]}`);
                const lineLength = lines[j].length;
                if (j === i) {
                    // push underline
                    const pad = start - (count - lineLength) + 1;
                    const length = Math.max(1, end > count ? lineLength - pad : end - start);
                    res.push(`   |  ` + ' '.repeat(pad) + '^'.repeat(length));
                }
                else if (j > i) {
                    if (end > count) {
                        const length = Math.max(Math.min(end - count, lineLength), 1);
                        res.push(`   |  ` + '^'.repeat(length));
                    }
                    count += lineLength + 1;
                }
            }
            break;
        }
    }
    return res.join('\n');
}

/**
 * Event emitter, forked from the below:
 * - original repository url: https://github.com/developit/mitt
 * - code url: https://github.com/developit/mitt/blob/master/src/index.ts
 * - author: Jason Miller (https://github.com/developit)
 * - license: MIT
 */
/**
 * Create a event emitter
 *
 * @returns An event emitter
 */
function createEmitter() {
    const events = new Map();
    const emitter = {
        events,
        on(event, handler) {
            const handlers = events.get(event);
            const added = handlers && handlers.push(handler);
            if (!added) {
                events.set(event, [handler]);
            }
        },
        off(event, handler) {
            const handlers = events.get(event);
            if (handlers) {
                handlers.splice(handlers.indexOf(handler) >>> 0, 1);
            }
        },
        emit(event, payload) {
            (events.get(event) || [])
                .slice()
                .map(handler => handler(payload));
            (events.get('*') || [])
                .slice()
                .map(handler => handler(event, payload));
        }
    };
    return emitter;
}

shared_prod.assign = assign;
shared_prod.createEmitter = createEmitter;
shared_prod.escapeHtml = escapeHtml;
shared_prod.format = format;
shared_prod.friendlyJSONstringify = friendlyJSONstringify;
shared_prod.generateCodeFrame = generateCodeFrame;
shared_prod.generateFormatCacheKey = generateFormatCacheKey;
shared_prod.getGlobalThis = getGlobalThis;
shared_prod.hasOwn = hasOwn;
shared_prod.inBrowser = inBrowser;
shared_prod.isArray = isArray;
shared_prod.isBoolean = isBoolean;
shared_prod.isDate = isDate;
shared_prod.isEmptyObject = isEmptyObject;
shared_prod.isFunction = isFunction;
shared_prod.isNumber = isNumber;
shared_prod.isObject = isObject;
shared_prod.isPlainObject = isPlainObject;
shared_prod.isPromise = isPromise;
shared_prod.isRegExp = isRegExp;
shared_prod.isString = isString;
shared_prod.isSymbol = isSymbol;
shared_prod.makeSymbol = makeSymbol;
shared_prod.mark = mark;
shared_prod.measure = measure;
shared_prod.objectToString = objectToString;
shared_prod.toDisplayString = toDisplayString;
shared_prod.toTypeString = toTypeString;
shared_prod.warn = warn;

{
  shared.exports = shared_prod;
}

var sharedExports = shared.exports;

const _mSkGpC = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const hash = event.context.params?.hash;
  if (hash == null) {
    throw createError({ statusMessage: `require the 'hash'`, statusCode: 400 });
  }
  const i18nMeta = await getI18nMeta(config.i18n.ssr);
  const filename = getFilename(hash);
  const target = i18nMeta[filename];
  const loadPath = await resolveModule(target.path, config.i18n.ssr);
  const loader = await import(loadPath).then((m) => m.default || m);
  if (target.type === "locale") {
    if (target.locale == null) {
      throw createError({ statusMessage: `not found locale`, statusCode: 500 });
    }
    const resource = await loader(target.locale);
    const code = await precompileLocale(target.locale, filename, resource);
    await setResponseHeader(event, "content-type", "text/javascript");
    return code;
  } else if (target.type === "config") {
    const config2 = sharedExports.isFunction(loader) ? await loader() : sharedExports.isObject(loader) ? loader : {};
    const messages = config2.messages || {};
    const code = await precompileConfig(filename, messages);
    await setResponseHeader(event, "content-type", "text/javascript");
    return code;
  } else {
    throw new Error("Invalid type");
  }
});
function getFilename(hash) {
  const [filename] = hash.split(".");
  return filename;
}
const resourcePlace = (ssr = true) => ssr ? "server" : "client";
async function getI18nMeta(ssr = true) {
  return await useStorage().getItem(`build:dist:${resourcePlace(ssr)}:i18n-meta.json`);
}
async function resolveModule(path, ssr = true) {
  const storage = await useStorage();
  const rootMount = await storage.getMount("root");
  const root = rootMount.driver.options.base;
  const rootRelative = relative(new URL(globalThis._importMeta_.url).pathname, root);
  return join(rootRelative, `dist/${resourcePlace(ssr)}`, path);
}
async function precompileLocale(locale, filename, messages) {
  return await $fetch("/__i18n__/precompile", {
    method: "POST",
    body: {
      locale,
      type: "locale",
      hash: filename,
      resource: messages
    }
  });
}
async function precompileConfig(filename, messages) {
  return await $fetch("/__i18n__/precompile", {
    method: "POST",
    body: {
      type: "config",
      hash: filename,
      resource: getNeedPrecompileMessages(messages)
    }
  });
}
function deepCopy(src, des, predicate) {
  for (const key in src) {
    if (sharedExports.isObject(src[key])) {
      if (!sharedExports.isObject(des[key]))
        des[key] = {};
      deepCopy(src[key], des[key], predicate);
    } else {
      if (predicate) {
        if (predicate(src[key], des[key])) {
          des[key] = src[key];
        }
      } else {
        des[key] = src[key];
      }
    }
  }
}
function getNeedPrecompileMessages(messages) {
  const needPrecompileMessages = {};
  const predicate = (src) => !sharedExports.isFunction(src);
  for (const [locale, message] of Object.entries(messages)) {
    const dest = needPrecompileMessages[locale] = {};
    deepCopy(message, dest, predicate);
  }
  return needPrecompileMessages;
}

const _lazy_Qs8bGM = () => import('../_locale_.mjs');
const _lazy_dSmw7U = () => import('../handlers/renderer.mjs');

const handlers = [
  { route: '/api/:locale', handler: _lazy_Qs8bGM, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_dSmw7U, lazy: true, middleware: false, method: undefined },
  { route: '/__i18n__/precompile', handler: _q7502u, lazy: false, middleware: false, method: "post" },
  { route: '/__i18n__/prerender/:hash', handler: _mSkGpC, lazy: false, middleware: false, method: "get" },
  { route: '/**', handler: _lazy_dSmw7U, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const h3App = createApp({
    debug: destr(false),
    onError: errorHandler
  });
  const router = createRouter$1();
  h3App.use(createRouteRulesHandler());
  const localCall = createCall(toNodeListener(h3App));
  const localFetch = createFetch(localCall, globalThis.fetch);
  const $fetch = createFetch$1({
    fetch: localFetch,
    Headers,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(
    eventHandler((event) => {
      const envContext = event.node.req.__unenv__;
      if (envContext) {
        Object.assign(event.context, envContext);
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: $fetch });
    })
  );
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch
  };
  for (const plugin of plugins) {
    plugin(app);
  }
  return app;
}
const nitroApp = createNitroApp();
const useNitroApp = () => nitroApp;

async function lambda(event, context) {
  const query = {
    ...event.queryStringParameters,
    ...event.multiValueQueryStringParameters
  };
  const url = withQuery(event.path, query);
  const method = event.httpMethod || "get";
  const r = await nitroApp.localCall({
    event,
    url,
    context,
    headers: normalizeIncomingHeaders(event.headers),
    method,
    query,
    body: event.body
    // TODO: handle event.isBase64Encoded
  });
  return {
    statusCode: r.status,
    headers: normalizeOutgoingHeaders(r.headers),
    body: r.body.toString()
  };
}
function normalizeIncomingHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [
      key.toLowerCase(),
      value
    ])
  );
}
function normalizeOutgoingHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      Array.isArray(v) ? v.join(",") : v
    ])
  );
}

const handler = async function handler2(event, context) {
  const query = {
    ...event.queryStringParameters,
    ...event.multiValueQueryStringParameters
  };
  const url = withQuery(event.path, query);
  const routeRules = getRouteRulesForPath(url);
  if (routeRules.cache && (routeRules.cache.swr || routeRules.cache.static)) {
    const builder = await import('@netlify/functions').then(
      (r) => r.builder || r.default.builder
    );
    const ttl = typeof routeRules.cache.swr === "number" ? routeRules.cache.swr : 60;
    const swrHandler = routeRules.cache.swr ? (event2, context2) => lambda(event2, context2).then((r) => ({ ...r, ttl })) : lambda;
    return builder(swrHandler)(event, context);
  }
  return lambda(event, context);
};

export { useRuntimeConfig as a, getRouteRules as g, handler as h, useNitroApp as u };
//# sourceMappingURL=netlify.mjs.map
