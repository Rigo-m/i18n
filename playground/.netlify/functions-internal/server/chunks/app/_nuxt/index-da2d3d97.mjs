import { _ as __nuxt_component_0 } from './nuxt-link-e5124028.mjs';
import { useSSRContext, defineComponent, withCtx, createTextVNode, toDisplayString } from 'vue';
import { _ as _export_sfc, b as useHead } from '../server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
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
  mounted() {
    console.log("mounted", this.$i18n);
    console.log("$i18n.getBrowserLocale", this.$i18n.getBrowserLocale());
    console.log("$i18n.getLocaleCookie", this.$i18n.getLocaleCookie());
    console.log("$i18n.localeProperties", this.$i18n.localeProperties);
  },
  computed: {
    availableLocales() {
      return this.$i18n.locales.filter((i) => i.code !== this.$i18n.locale);
    },
    switchableLocale() {
      const i18n = this.$i18n;
      const _locales = i18n.locales.filter((i) => i.code !== this.$i18n.locale);
      return _locales.length !== 0 ? _locales[0] : { code: "ja", name: "\u65E5\u672C\u8A9E" };
    }
  },
  setup() {
    useHead({
      meta: [{ property: "og:title", content: "this is og title" }]
    });
    return {};
  }
});
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_NuxtLink = __nuxt_component_0;
  _push(`<div${ssrRenderAttrs(_attrs)}><nav>`);
  _push(ssrRenderComponent(_component_NuxtLink, {
    to: _ctx.localePath("/")
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Back to Home`);
      } else {
        return [
          createTextVNode("Back to Home")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</nav><nav><!--[-->`);
  ssrRenderList(_ctx.availableLocales, (locale) => {
    _push(`<span>`);
    _push(ssrRenderComponent(_component_NuxtLink, {
      to: _ctx.switchLocalePath(locale.code) || ""
    }, {
      default: withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          _push2(`${ssrInterpolate(locale.name)}`);
        } else {
          return [
            createTextVNode(toDisplayString(locale.name), 1)
          ];
        }
      }),
      _: 2
    }, _parent));
    _push(` | </span>`);
  });
  _push(`<!--]--></nav><p>hello</p><nav><!--[-->`);
  ssrRenderList(_ctx.availableLocales, (locale) => {
    _push(`<span><a href="javascript:void(0)">${ssrInterpolate(locale.name)}</a> | </span>`);
  });
  _push(`<!--]--></nav><p>${ssrInterpolate(_ctx.switchableLocale)}</p><p>${ssrInterpolate(_ctx.localeHead({ addSeoAttributes: true }))}</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/about/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { index as default };
//# sourceMappingURL=index-da2d3d97.mjs.map
