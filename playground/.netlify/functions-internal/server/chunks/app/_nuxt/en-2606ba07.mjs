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
        return _normalize(["About this site"]);
      }
    }
  },
  "welcome": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["Welcome"]);
  },
  "hello": (ctx) => {
    const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
    return _normalize(["Hello ", _interpolate(_named("name")), " !"]);
  },
  "tag": (ctx) => {
    const { normalize: _normalize } = ctx;
    return _normalize(["&lt;p&gt;Tag&lt;/p&gt;"]);
  }
};

export { resource as default };
//# sourceMappingURL=en-2606ba07.mjs.map
