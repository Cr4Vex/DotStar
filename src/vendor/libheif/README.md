# libheif (vendored)

`libheif-bundle.js` is an unmodified copy of the WebAssembly build shipped by
[`libheif-js`](https://github.com/catdad-experiments/libheif-js) — an Emscripten
build of [libheif](https://github.com/strukturag/libheif), the reference HEIF/HEIC
decoder, with the HEVC decoder (libde265) compiled in.

- **Package:** `libheif-js@1.19.8`
- **File:** `libheif-wasm/libheif-bundle.js`
- **License:** LGPL-3.0 (see `LICENSE`)

DotStar uses it to read Apple's HEIC photos in browsers that have no HEIC decoder
of their own — which is every browser except Safari.

## Why it is checked in

The project has no build step and makes no network requests to third parties, so
the decoder is committed rather than installed or loaded from a CDN. The `.wasm`
binary is embedded in the file as base64, which means it is a single file that
also works from `file://`. It is only fetched when a HEIC file is actually
converted (see `src/js/heic.js`).

## Updating

```bash
npm pack libheif-js@<version>
tar xzf libheif-js-<version>.tgz
cp package/libheif-wasm/libheif-bundle.js src/vendor/libheif/libheif-bundle.js
cp package/libheif-wasm/LICENSE           src/vendor/libheif/LICENSE
```

Then update the version above. The file must stay unmodified: it is LGPL-licensed
and is kept as a separate, replaceable component.
