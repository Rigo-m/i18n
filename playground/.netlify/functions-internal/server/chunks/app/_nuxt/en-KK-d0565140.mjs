const resource = {
  "bar": {
    "buz": (ctx) => {
      const { normalize: _normalize, interpolate: _interpolate, named: _named } = ctx;
      return _normalize(["Hello, ", _interpolate(_named("name")), "!"]);
    }
  }
};

export { resource as default };
//# sourceMappingURL=en-KK-d0565140.mjs.map
