import { defineEventHandler, setResponseHeader, createError } from "h3";
import { useStorage, useRuntimeConfig } from "#imports";
import { relative, join } from "pathe";
import { isObject, isFunction } from "@intlify/shared";
export default defineEventHandler(async (event) => {
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
    const config2 = isFunction(loader) ? await loader() : isObject(loader) ? loader : {};
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
  const rootRelative = relative(new URL(import.meta.url).pathname, root);
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
export function getNeedPrecompileMessages(messages) {
  const needPrecompileMessages = {};
  const predicate = (src) => !isFunction(src);
  for (const [locale, message] of Object.entries(messages)) {
    const dest = needPrecompileMessages[locale] = {};
    deepCopy(message, dest, predicate);
  }
  return needPrecompileMessages;
}
