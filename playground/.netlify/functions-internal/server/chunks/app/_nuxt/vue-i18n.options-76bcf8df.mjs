import resource from './fr-672a615f.mjs';

const vueI18n_options = () => ({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    ja: {
      bar: {
        buz: "\u3053\u3093\u306B\u3061\u306F\uFF01{name}!",
        fn: ({ named }) => `\u3053\u3093\u306B\u3061\u306F\uFF01${named("name")}!`
      }
    },
    fr: resource
  },
  modifiers: {
    // @ts-ignore
    snakeCase: (str) => str.split(" ").join("-")
  }
});

export { vueI18n_options as default };
//# sourceMappingURL=vue-i18n.options-76bcf8df.mjs.map
