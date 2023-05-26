import { defineComponent, unref, useSSRContext } from 'vue';
import { a as useI18n } from '../server.mjs';
import { ssrRenderAttrs, ssrInterpolate } from 'vue/server-renderer';
import 'ofetch';
import 'hookable';
import 'unctx';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import 'h3';
import 'ufo';
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
  __name: "blog",
  __ssrInlineRender: true,
  setup(__props) {
    const { t, locales, baseUrl } = useI18n({
      useScope: "local"
    });
    console.log("locales", locales, baseUrl);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}><h1>${ssrInterpolate(unref(t)("desc"))}</h1></div>`);
    };
  }
});
function block0(Component) {
  const _Component = Component;
  _Component.__i18n = _Component.__i18n || [];
  _Component.__i18n.push({
    "locale": "",
    "resource": {
      "en": {
        "desc": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["This is blog page"]);
        }
      },
      "fr": {
        "desc": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["Ceci est la page blog"]);
        }
      },
      "ja": {
        "desc": (ctx) => {
          const { normalize: _normalize } = ctx;
          return _normalize(["\u3053\u308C\u306F\u30D6\u30ED\u30B0\u30DA\u30FC\u30B8\u3067\u3059"]);
        }
      }
    }
  });
}
if (typeof block0 === "function")
  block0(_sfc_main);
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/blog.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=blog-ee29f13e.mjs.map
