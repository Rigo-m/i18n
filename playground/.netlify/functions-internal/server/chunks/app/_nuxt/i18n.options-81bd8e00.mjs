import { N as NUXT_I18N_PRERENDERED_PATH, i as formatMessage } from '../server.mjs';
import 'vue';
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
import 'vue/server-renderer';
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

async function i18n_options(locale) {
  {
    let mod = null;
    try {
      let url = `${NUXT_I18N_PRERENDERED_PATH}/e57ca44b.js`;
      if (true) {
        url = `../../../../public${url}`;
      }
      mod = await import(
        /* @vite-ignore */
        url
        /* webpackChunkName: e57ca44b */
      ).then(
        (m) => m.default || m
      );
    } catch (e) {
      console.error(formatMessage(e.message));
    }
    return mod || {};
  }
}

export { i18n_options as default };
//# sourceMappingURL=i18n.options-81bd8e00.mjs.map
