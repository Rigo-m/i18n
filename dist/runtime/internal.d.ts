import type { NuxtApp } from '#imports';
import type { I18nOptions, Locale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n';
import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded, LocaleObject } from 'vue-i18n-routing';
import type { DeepRequired } from 'ts-essentials';
import type { NuxtI18nOptions, NuxtI18nInternalOptions, DetectBrowserLanguageOptions } from '#build/i18n.options.mjs';
export declare function formatMessage(message: string): string;
export declare function callVueI18nInterfaces(i18n: any, name: string, ...args: any[]): any;
export declare function getVueI18nPropertyValue<Return = any>(i18n: any, name: string): Return;
export declare function defineGetter<K extends string | number | symbol, V>(obj: Record<K, V>, key: K, val: V): void;
export declare function proxyNuxt<T extends (...args: any) => any>(nuxt: NuxtApp, target: T): () => (this: NuxtApp, ...args: Parameters<T>) => ReturnType<T>;
/**
 * Parses locales provided from browser through `accept-language` header.
 *
 * @param input - Accept-Language header value.
 * @return An array of locale codes. Priority determined by order in array.
 */
export declare function parseAcceptLanguage(input: string): string[];
export declare function loadLocale(context: NuxtApp, locale: Locale, setter: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void): Promise<void>;
export declare function loadAdditionalLocale(context: NuxtApp, locale: Locale, merger: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void): Promise<void>;
export declare function getBrowserLocale(options: Required<NuxtI18nInternalOptions>, context?: any): string | undefined;
export declare function getLocaleCookie(context: any, { useCookie, cookieKey, localeCodes }?: Pick<DetectBrowserLanguageOptions, 'useCookie' | 'cookieKey'> & {
    localeCodes?: readonly string[];
}): string | undefined;
export declare function setLocaleCookie(locale: string, context: any, { useCookie, cookieKey, cookieDomain, cookieSecure, cookieCrossOrigin }?: Pick<DetectBrowserLanguageOptions, 'useCookie' | 'cookieDomain' | 'cookieKey' | 'cookieSecure' | 'cookieCrossOrigin'>): void;
export type DetectBrowserLanguageNotDetectReason = 'unknown' | 'not_found_match' | 'not_redirect_on_root' | 'not_redirect_on_no_prefix' | 'detect_ignore_on_ssg';
export type DetectBrowserLanguageFrom = 'unknown' | 'cookie' | 'navigator_or_header' | 'fallback';
export type DetectBrowserLanguageFromResult = {
    locale: string;
    stat: boolean;
    reason?: DetectBrowserLanguageNotDetectReason;
    from?: DetectBrowserLanguageFrom;
};
export type DetectLocaleForSSGStatus = 'ssg_ignore' | 'ssg_setup' | 'normal';
export declare const DefaultDetectBrowserLanguageFromResult: DetectBrowserLanguageFromResult;
export declare function detectBrowserLanguage<Context extends NuxtApp = NuxtApp>(route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded, context: any, nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>>, nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions>, localeCodes: string[] | undefined, locale: string | undefined, mode: DetectLocaleForSSGStatus): DetectBrowserLanguageFromResult;
export declare function getHost(): string | undefined;
export declare function getLocaleDomain(locales: LocaleObject[]): string;
export declare function getDomainFromLocale(localeCode: Locale, locales: LocaleObject[], nuxt?: NuxtApp): string | undefined;
export declare function precompileLocale(locale: Locale, messages: LocaleMessages<DefineLocaleMessage>, hash?: string): Promise<any>;
export declare function precompileConfig(messages: I18nOptions['messages'], hash?: string): Promise<I18nOptions['messages']>;
