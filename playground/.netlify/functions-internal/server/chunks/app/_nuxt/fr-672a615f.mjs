const resource = {
  "layouts": {
    "title": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Page - ", _interpolate(_named("title"))]);
    }
  },
  "pages": {
    "title": {
      "top": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["Top"]);
      },
      "about": (ctx) => {
        const { normalize: _normalize } = ctx;
        return _normalize(["\xE0 propos de ce site"]);
      }
    }
  },
  "welcome": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Bienvenue"]);
  },
  "hello": (ctx) => {
    const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
    return _normalize(["Bonjour ", _interpolate(_named("name")), " !"]);
  }
};

export { resource as default };
//# sourceMappingURL=fr-672a615f.mjs.map
