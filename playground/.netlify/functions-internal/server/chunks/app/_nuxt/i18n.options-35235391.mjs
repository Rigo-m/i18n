import { s as sharedExports, N as NUXT_I18N_PRERENDERED_PATH, i as formatMessage } from '../server.mjs';
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

async function i18n_options() {
  const loader = await import('./vue-i18n.options-76bcf8df.mjs').then((m) => m.default || m);
  const config = sharedExports.isFunction(loader) ? await loader() : sharedExports.isObject(loader) ? loader : {};
  {
    let messages = null;
    try {
      let url = `${NUXT_I18N_PRERENDERED_PATH}/7081ce1d.js`;
      if (true) {
        url = `../../../../public${url}`;
      }
      messages = await import(
        /* @vite-ignore */
        url
        /* webpackChunkName: 7081ce1d */
      ).then(
        (m) => m.default || m
      );
    } catch (e) {
      console.error(formatMessage(e.message));
    }
    config.messages = messages || {};
    return config;
  }
}

export { i18n_options as default };
//# sourceMappingURL=i18n.options-35235391.mjs.map
