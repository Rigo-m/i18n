import { _ as __nuxt_component_0 } from './nuxt-link-e5124028.mjs';
import { useSSRContext, defineComponent, computed, unref, withCtx, createTextVNode, toDisplayString } from 'vue';
import { _ as _export_sfc, u as useRoute, a as useI18n, e as useLocalePath, f as useSwitchLocalePath, g as useRouteBaseName, h as useBrowserLocale } from '../server.mjs';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList } from 'vue/server-renderer';
import 'ufo';
import 'ofetch';
import 'hookable';
import 'unctx';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import 'h3';
import '@intlify/core-base';
import 'cookie-es';
import 'is-https';
import 'defu';
import '../../nitro/netlify.mjs';
import 'node-fetch-native/polyfill';
import 'radix3';
import 'destr';
import 'scule';
import 'unenv/runtime/fetch/index';
import 'ohash';
import 'unstorage';
import 'unstorage/drivers/fs';
import '@intlify/bundle-utils';
import 'pathe';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    const { t, strategy, locale, locales, localeProperties, setLocale, finalizePendingLocaleChange } = useI18n();
    const localePath = useLocalePath();
    const switchLocalePath = useSwitchLocalePath();
    const getRouteBaseName = useRouteBaseName();
    console.log("route base name", getRouteBaseName());
    console.log("useBrowserLocale", useBrowserLocale());
    console.log("localeProperties", localeProperties);
    console.log("foo", t("foo"));
    console.log("message if local layer merged:", t("layerText"));
    console.log("message if github layer merged:", t("layer-test-key"));
    function getLocaleName(code) {
      const locale2 = locales.value.find((i) => i.code === code);
      return locale2 ? locale2.name : code;
    }
    const availableLocales = computed(() => {
      return locales.value.filter((i) => i.code !== locale.value);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-c0a75b92><h1 data-v-c0a75b92>Demo: Nuxt 3</h1><h2 data-v-c0a75b92>${ssrInterpolate(_ctx.$t("hello", { name: "nuxt3" }))}</h2><p data-v-c0a75b92>${ssrInterpolate(_ctx.$t("bar.buz", { name: "buz" }))}</p><h2 data-v-c0a75b92>Pages</h2><nav data-v-c0a75b92>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)("/")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Home`);
          } else {
            return [
              createTextVNode("Home")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` | `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)({ name: "about" })
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`About`);
          } else {
            return [
              createTextVNode("About")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` | `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)({ name: "blog" })
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Blog`);
          } else {
            return [
              createTextVNode("Blog")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` | `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)({ name: "category-id", params: { id: "foo" } })
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Category`);
          } else {
            return [
              createTextVNode("Category")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` | `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref(localePath)({ name: "history" })
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`History`);
          } else {
            return [
              createTextVNode("History")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</nav><h2 data-v-c0a75b92>Current Language: ${ssrInterpolate(getLocaleName(unref(locale)))}</h2><h2 data-v-c0a75b92>Current Strategy: ${ssrInterpolate(unref(strategy))}</h2><h2 data-v-c0a75b92>Select Languages with switchLocalePath</h2><nav data-v-c0a75b92><!--[-->`);
      ssrRenderList(unref(availableLocales), (locale2) => {
        _push(`<span data-v-c0a75b92>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: unref(switchLocalePath)(locale2.code) || ""
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(locale2.name)}`);
            } else {
              return [
                createTextVNode(toDisplayString(locale2.name), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(` | </span>`);
      });
      _push(`<!--]--></nav><h2 data-v-c0a75b92>Select Languages with setLocale</h2><nav data-v-c0a75b92><!--[-->`);
      ssrRenderList(unref(availableLocales), (locale2) => {
        _push(`<span data-v-c0a75b92><a href="javascript:void(0)" data-v-c0a75b92>${ssrInterpolate(locale2.name)}</a> | </span>`);
      });
      _push(`<!--]--></nav><p data-v-c0a75b92>${ssrInterpolate(_ctx.$t("settings.profile"))}</p><p data-v-c0a75b92>${ssrInterpolate(_ctx.$t("tag"))}</p></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c0a75b92"]]);

export { index as default };
//# sourceMappingURL=index-3b0b39b3.mjs.map
