import { _ as __nuxt_component_0 } from './nuxt-link-e5124028.mjs';
import { defineComponent, computed, resolveComponent, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { u as useRoute, a as useI18n } from '../server.mjs';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
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
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { locale, locales } = useI18n();
    const availableLocales = computed(() => {
      return locales.value.filter((i) => i.code !== locale.value);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_i18n_t = resolveComponent("i18n-t");
      _push(`<div${ssrRenderAttrs(_attrs)}><p>This is cateory page on &#39;${ssrInterpolate(unref(route).params.id)}&#39;</p><nav><!--[-->`);
      ssrRenderList(unref(availableLocales), (locale2) => {
        _push(`<span>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: _ctx.switchLocalePath(locale2.code) || ""
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
      _push(`<!--]-->`);
      _push(ssrRenderComponent(_component_i18n_t, { keypath: "hello" }, {
        name: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`nuxtjs/i18n`);
          } else {
            return [
              createTextVNode("nuxtjs/i18n")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</nav></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/category/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-d15eca89.mjs.map
