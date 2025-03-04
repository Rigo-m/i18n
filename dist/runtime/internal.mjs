import { isArray, isString, isFunction, isObject } from "@intlify/shared";
import {
  findBrowserLocale,
  getLocalesRegex,
  isI18nInstance,
  isComposer,
  isExportedGlobalComposer,
  isVueI18n
} from "vue-i18n-routing";
import JsCookie from "js-cookie";
import { parse, serialize } from "cookie-es";
import { hasProtocol } from "ufo";
import isHTTPS from "is-https";
import { useRequestHeaders, useRequestEvent } from "#imports";
import {
  nuxtI18nOptionsDefault,
  localeMessages,
  additionalMessages,
  NUXT_I18N_MODULE_ID,
  NUXT_I18N_PRECOMPILE_ENDPOINT,
  NULL_HASH,
  isSSG
} from "#build/i18n.options.mjs";
export function formatMessage(message) {
  return NUXT_I18N_MODULE_ID + " " + message;
}
function isLegacyVueI18n(target) {
  return target != null && ("__VUE_I18N_BRIDGE__" in target || "_sync" in target);
}
export function callVueI18nInterfaces(i18n, name, ...args) {
  const target = isI18nInstance(i18n) ? i18n.global : i18n;
  const [obj, method] = [target, target[name]];
  return Reflect.apply(method, obj, [...args]);
}
export function getVueI18nPropertyValue(i18n, name) {
  const target = isI18nInstance(i18n) ? i18n.global : i18n;
  const ret = isComposer(target) ? target[name].value : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target) ? target[name] : target[name];
  return ret;
}
export function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
export function proxyNuxt(nuxt, target) {
  return function() {
    return Reflect.apply(
      target,
      {
        i18n: nuxt.$i18n,
        getRouteBaseName: nuxt.$getRouteBaseName,
        localePath: nuxt.$localePath,
        localeRoute: nuxt.$localeRoute,
        switchLocalePath: nuxt.$switchLocalePath,
        localeHead: nuxt.$localeHead,
        route: nuxt.$router.currentRoute.value,
        router: nuxt.$router
      },
      // eslint-disable-next-line prefer-rest-params
      arguments
    );
  };
}
export function parseAcceptLanguage(input) {
  return input.split(",").map((tag) => tag.split(";")[0]);
}
function deepCopy(src, des, predicate) {
  for (const key in src) {
    if (isObject(src[key])) {
      if (!isObject(des[key]))
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
async function loadMessage(context, loader, locale) {
  const i18nConfig = context.$config.public?.i18n;
  let message = null;
  try {
    __DEBUG__ && console.log("loadMessage: (locale) -", locale);
    const getter = await loader().then((r) => r.default || r);
    if (isFunction(getter)) {
      if (i18nConfig.experimental?.jsTsFormatResource) {
        message = await getter(locale).then((r) => r.default || r);
        __DEBUG__ && console.log("loadMessage: dynamic load", message);
      } else {
        console.warn(
          formatMessage(
            "Not support js / ts extension format as default. you can do enable with `i18n.experimental.jsTsFormatResource: true` (experimental)"
          )
        );
      }
    } else {
      message = getter;
      __DEBUG__ && console.log("loadMessage: load", message);
    }
  } catch (e) {
    console.error(formatMessage("Failed locale loading: " + e.message));
  }
  return message;
}
const loadedLocales = [];
const loadedMessages = /* @__PURE__ */ new Map();
export async function loadLocale(context, locale, setter) {
  if (process.server || process.dev || !loadedLocales.includes(locale)) {
    const loaders = localeMessages[locale];
    if (loaders != null) {
      if (loaders.length === 1) {
        const { key, load } = loaders[0];
        let message = null;
        if (loadedMessages.has(key)) {
          message = loadedMessages.get(key);
        } else {
          message = await loadMessage(context, load, locale);
          if (message != null) {
            loadedMessages.set(key, message);
          }
        }
        if (message != null) {
          setter(locale, message);
          loadedLocales.push(locale);
        }
      } else if (loaders.length > 1) {
        const targetMessage = {};
        for (const { key, load } of loaders) {
          let message = null;
          if (loadedMessages.has(key)) {
            message = loadedMessages.get(key);
          } else {
            message = await loadMessage(context, load, locale);
            if (message != null) {
              loadedMessages.set(key, message);
            }
          }
          if (message != null) {
            deepCopy(message, targetMessage);
          }
        }
        setter(locale, targetMessage);
        loadedLocales.push(locale);
      }
    }
  } else {
    if (!loadedLocales.includes(locale)) {
      console.warn(formatMessage("Could not find " + locale + " locale code in localeMessages"));
    }
  }
}
const loadedAdditionalLocales = [];
export async function loadAdditionalLocale(context, locale, merger) {
  if (process.server || process.dev || !loadedAdditionalLocales.includes(locale)) {
    const additionalLoaders = additionalMessages[locale] || [];
    for (const additionalLoader of additionalLoaders) {
      const message = await loadMessage(context, additionalLoader, locale);
      if (message != null) {
        merger(locale, message);
        loadedAdditionalLocales.push(locale);
      }
    }
  }
}
export function getBrowserLocale(options, context) {
  let ret;
  if (process.client) {
    if (navigator.languages) {
      ret = findBrowserLocale(options.__normalizedLocales, navigator.languages);
      __DEBUG__ && console.log("getBrowserLocale navigator.languages", navigator.languages);
    }
  } else if (process.server) {
    const header = useRequestHeaders(["accept-language"]);
    __DEBUG__ && console.log("getBrowserLocale accept-language", header);
    const accept = header["accept-language"];
    if (accept) {
      ret = findBrowserLocale(options.__normalizedLocales, parseAcceptLanguage(accept));
    }
  }
  return ret;
}
export function getLocaleCookie(context, {
  useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
  cookieKey = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieKey,
  localeCodes = []
} = {}) {
  __DEBUG__ && console.log("getLocaleCookie", { useCookie, cookieKey, localeCodes });
  if (useCookie) {
    let localeCode;
    if (process.client) {
      localeCode = JsCookie.get(cookieKey);
    } else if (process.server) {
      const cookie = useRequestHeaders(["cookie"]);
      if ("cookie" in cookie) {
        const parsedCookie = parse(cookie["cookie"]);
        localeCode = parsedCookie[cookieKey];
        __DEBUG__ && console.log("getLocaleCookie cookie", parsedCookie[cookieKey]);
      }
    }
    if (localeCode && localeCodes.includes(localeCode)) {
      return localeCode;
    }
  }
}
export function setLocaleCookie(locale, context, {
  useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
  cookieKey = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieKey,
  cookieDomain = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieDomain,
  cookieSecure = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieSecure,
  cookieCrossOrigin = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieCrossOrigin
} = {}) {
  if (!useCookie) {
    return;
  }
  const date = /* @__PURE__ */ new Date();
  const cookieOptions = {
    expires: new Date(date.setDate(date.getDate() + 365)),
    path: "/",
    sameSite: cookieCrossOrigin ? "none" : "lax",
    secure: cookieCrossOrigin || cookieSecure
  };
  if (cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }
  if (process.client) {
    JsCookie.set(cookieKey, locale, cookieOptions);
  } else if (process.server) {
    if (context.res) {
      const { res } = context;
      let headers = res.getHeader("Set-Cookie") || [];
      if (!isArray(headers)) {
        headers = [String(headers)];
      }
      const redirectCookie = serialize(cookieKey, locale, cookieOptions);
      headers.push(redirectCookie);
      res.setHeader("Set-Cookie", headers);
    }
  }
}
export const DefaultDetectBrowserLanguageFromResult = {
  locale: "",
  stat: false,
  reason: "unknown",
  from: "unknown"
};
export function detectBrowserLanguage(route, context, nuxtI18nOptions, nuxtI18nInternalOptions, localeCodes = [], locale = "", mode) {
  const { strategy } = nuxtI18nOptions;
  if (isSSG && strategy === "no_prefix" && (process.server || mode === "ssg_ignore")) {
    return { locale: "", stat: true, reason: "detect_ignore_on_ssg" };
  }
  const { redirectOn, alwaysRedirect, useCookie, fallbackLocale } = nuxtI18nOptions.detectBrowserLanguage;
  const path = isString(route) ? route : route.path;
  __DEBUG__ && console.log(
    "detectBrowserLanguage: (path, strategy, alwaysRedirect, redirectOn, locale) -",
    path,
    strategy,
    alwaysRedirect,
    redirectOn,
    locale
  );
  if (strategy !== "no_prefix") {
    if (redirectOn === "root") {
      if (path !== "/") {
        __DEBUG__ && console.log("detectBrowserLanguage: not root");
        return { locale: "", stat: false, reason: "not_redirect_on_root" };
      }
    } else if (redirectOn === "no prefix") {
      if (!alwaysRedirect && path.match(getLocalesRegex(localeCodes))) {
        __DEBUG__ && console.log("detectBrowserLanguage: no prefix");
        return { locale: "", stat: false, reason: "not_redirect_on_no_prefix" };
      }
    }
  }
  let localeFrom = "unknown";
  let cookieLocale;
  let matchedLocale;
  if (useCookie) {
    matchedLocale = cookieLocale = getLocaleCookie(context, { ...nuxtI18nOptions.detectBrowserLanguage, localeCodes });
    localeFrom = "cookie";
    __DEBUG__ && console.log("detectBrowserLanguage: cookieLocale", cookieLocale);
  }
  if (!matchedLocale) {
    matchedLocale = getBrowserLocale(nuxtI18nInternalOptions, context);
    localeFrom = "navigator_or_header";
    __DEBUG__ && console.log("detectBrowserLanguage: browserLocale", matchedLocale);
  }
  __DEBUG__ && console.log(
    "detectBrowserLanguage: (matchedLocale, cookieLocale, localeFrom) -",
    matchedLocale,
    cookieLocale,
    localeFrom
  );
  const finalLocale = matchedLocale || fallbackLocale;
  if (!matchedLocale && fallbackLocale) {
    localeFrom = "fallback";
  }
  __DEBUG__ && console.log(
    "detectBrowserLanguage: first finaleLocale (finaleLocale, lcoaleForm) -",
    finalLocale,
    cookieLocale,
    localeFrom
  );
  const vueI18nLocale = locale || nuxtI18nOptions.vueI18n.locale;
  __DEBUG__ && console.log("detectBrowserLanguage: vueI18nLocale", vueI18nLocale);
  if (finalLocale && (!useCookie || alwaysRedirect || !cookieLocale)) {
    if (strategy === "no_prefix") {
      return { locale: finalLocale, stat: true, from: localeFrom };
    } else {
      if (finalLocale !== vueI18nLocale) {
        __DEBUG__ && console.log("detectBrowserLanguage: finalLocale !== vueI18nLocale", finalLocale);
        return { locale: finalLocale, stat: true, from: localeFrom };
      } else if (alwaysRedirect) {
        const redirectOnRoot = path === "/";
        const redirectOnAll = redirectOn === "all";
        const redirectOnNoPrefix = redirectOn === "no prefix" && !path.match(getLocalesRegex(localeCodes));
        if (redirectOnRoot || redirectOnAll || redirectOnNoPrefix) {
          return { locale: finalLocale, stat: true, from: localeFrom };
        }
      }
    }
  }
  if (mode === "ssg_setup" && finalLocale) {
    return { locale: finalLocale, stat: true, from: localeFrom };
  }
  return { locale: "", stat: false, reason: "not_found_match" };
}
export function getHost() {
  let host;
  if (process.client) {
    host = window.location.host;
  } else if (process.server) {
    const header = useRequestHeaders(["x-forwarded-host", "host"]);
    let detectedHost;
    if ("x-forwarded-host" in header) {
      detectedHost = header["x-forwarded-host"];
    } else if ("host" in header) {
      detectedHost = header["host"];
    }
    host = isArray(detectedHost) ? detectedHost[0] : detectedHost;
  }
  return host;
}
export function getLocaleDomain(locales) {
  let host = getHost() || "";
  if (host) {
    const matchingLocale = locales.find((locale) => locale.domain === host);
    if (matchingLocale) {
      return matchingLocale.code;
    } else {
      host = "";
    }
  }
  return host;
}
export function getDomainFromLocale(localeCode, locales, nuxt) {
  const lang = locales.find((locale) => locale.code === localeCode);
  if (lang && lang.domain) {
    if (hasProtocol(lang.domain)) {
      return lang.domain;
    }
    let protocol;
    if (process.server) {
      const {
        node: { req }
      } = useRequestEvent(nuxt);
      protocol = req && isHTTPS(req) ? "https" : "http";
    } else {
      protocol = window.location.protocol.split(":")[0];
    }
    return protocol + "://" + lang.domain;
  }
  console.warn(formatMessage("Could not find domain name for locale " + localeCode));
}
async function evaluateCode(raw) {
  const url = URL.createObjectURL(raw);
  const code = await import(
    /* @vite-ignore */
    url
  ).then((m) => m.default || m);
  URL.revokeObjectURL(url);
  return code;
}
export async function precompileLocale(locale, messages, hash = NULL_HASH) {
  const raw = await $fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
    method: "POST",
    responseType: "blob",
    body: {
      locale,
      type: "locale",
      hash,
      resource: messages
    }
  });
  if (process.dev && process.client) {
    return evaluateCode(raw);
  } else {
    return await loadPrecompiledMessages(locale + "-" + hash + ".js", "locale");
  }
}
export async function precompileConfig(messages, hash = NULL_HASH) {
  if (messages != null) {
    const raw = await $fetch(NUXT_I18N_PRECOMPILE_ENDPOINT, {
      method: "POST",
      responseType: "blob",
      body: {
        type: "config",
        hash,
        resource: getNeedPrecompileMessages(messages)
      }
    });
    let precompiledMessages;
    if (process.dev && process.client) {
      precompiledMessages = await evaluateCode(raw);
    } else {
      precompiledMessages = await loadPrecompiledMessages("config-" + hash + ".js", "config");
    }
    if (precompiledMessages != null) {
      for (const [locale, message] of Object.entries(precompiledMessages)) {
        deepCopy(message, messages[locale]);
      }
    }
  }
  return messages;
}
async function loadPrecompiledMessages(id, type) {
  __DEBUG__ && console.log("loadPrecompiledMessages loc ->", id, type, process.server, process.env && process.env.prerender);
  let url = "";
  if (process.server) {
    if (process.env.prerender) {
      url = type === "config" ? "../../../i18n/" + id : "../../../i18n/locales/" + id;
    } else if (process.dev) {
      url = type === "config" ? ".nuxt/i18n/" + id : ".nuxt/i18n/locales/" + id;
    } else {
      throw new Error(`'loadPrecompiledMessages' is used in invalid environment.`);
    }
  } else {
    throw new Error(`'loadPrecompiledMessages' is used in invalid environment.`);
  }
  return await import(
    /* @vite-ignore */
    url
  ).then((m) => m.default || m);
}
function getNeedPrecompileMessages(messages) {
  const needPrecompileMessages = {};
  const predicate = (src) => !isFunction(src);
  for (const [locale, message] of Object.entries(messages)) {
    const dest = needPrecompileMessages[locale] = {};
    deepCopy(message, dest, predicate);
  }
  return needPrecompileMessages;
}
