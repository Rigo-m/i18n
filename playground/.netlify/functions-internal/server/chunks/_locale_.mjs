import { defineEventHandler } from 'h3';

const locales = {
  "en-GB": {
    settings: {
      profile: "Profile"
    }
  },
  ja: {
    layouts: {
      title: "\u30DA\u30FC\u30B8 \u30FC {title}"
    },
    pages: {
      title: {
        top: "\u30C8\u30C3\u30D7",
        about: "\u3053\u306E\u30B5\u30A4\u30C8\u306B\u3064\u3044\u3066"
      }
    },
    welcome: "\u3088\u3046\u3053\u305D",
    hello: "\u3053\u3093\u306B\u3061\u306F {name} \uFF01"
  }
};
const _locale_ = defineEventHandler((event) => {
  var _a;
  const locale = (_a = event.context.params) == null ? void 0 : _a.locale;
  if (locale == null) {
    return {};
  }
  return locales[locale] || {};
});

export { _locale_ as default };
//# sourceMappingURL=_locale_.mjs.map
