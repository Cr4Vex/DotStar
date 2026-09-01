const Heic = (() => {
    const here = document.currentScript && document.currentScript.src;
    const DECODER_URL = here
        ? new URL("../vendor/libheif/libheif-bundle.js", here).href
        : "src/vendor/libheif/libheif-bundle.js";

    const HEIF_BRANDS = new Set([
        "heic", "heix", "heim", "heis",
        "hevc", "hevx", "hevm", "hevs",
        "mif1", "msf1", "miaf", "mia1",
    ]);

    const AVIF_BRANDS = new Set(["avif", "avis"]);

    const HEADER_BYTES = 64;

    function readBuffer(blob) {
        if (blob.arrayBuffer) return blob.arrayBuffer();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Could not read the file."));
            reader.readAsArrayBuffer(blob);
        });
    }

    function brands(buffer) {
        const bytes = new Uint8Array(buffer);
        if (bytes.length < 12) return [];

        const fourcc = (at) =>
            String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
        if (fourcc(4) !== "ftyp") return [];

        const size = Math.min(new DataView(buffer).getUint32(0), bytes.length);
        const found = [fourcc(8)];
        for (let at = 16; at + 4 <= size; at += 4) found.push(fourcc(at));
        return found;
    }

    async function isHeic(file) {
        let found;
        try {
            found = brands(await readBuffer(file.slice(0, HEADER_BYTES)));
        } catch {
            return false;
        }
        if (found.some((brand) => AVIF_BRANDS.has(brand))) return false;
        return found.some((brand) => HEIF_BRANDS.has(brand));
    }

    let decoder = null;

    function loadDecoder() {
        if (decoder) return decoder;

        const pending = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = DECODER_URL;
            script.onload = resolve;
            script.onerror = () => reject(new Error("Could not load the HEIC decoder."));
            document.head.appendChild(script);
        }).then(() => {
            if (typeof window.libheif !== "function") {
                throw new Error("The HEIC decoder did not load correctly.");
            }
            return window.libheif();
        });

        pending.catch(() => { if (decoder === pending) decoder = null; });
        decoder = pending;
        return pending;
    }

    const yieldToPaint = () =>
        new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

    function pickPrimary(images) {
        try {
            return images.find((image) => image.is_primary()) || images[0];
        } catch {
            return images[0];
        }
    }

    async function decode(file, onStage) {
        onStage("Loading HEIC decoder…");
        const libheif = await loadDecoder();

        onStage("Decoding HEIC…");
        await yieldToPaint();

        let images;
        try {
            images = new libheif.HeifDecoder().decode(new Uint8Array(await readBuffer(file)));
        } catch {
            throw new Error("Could not decode this HEIC file.");
        }
        if (!images || images.length === 0) {
            throw new Error("This HEIC file contains no image.");
        }

        try {
            const image = pickPrimary(images);
            const canvas = document.createElement("canvas");
            canvas.width = image.get_width();
            canvas.height = image.get_height();

            const ctx = canvas.getContext("2d");
            const pixels = ctx.createImageData(canvas.width, canvas.height);
            await new Promise((resolve, reject) => {
                image.display(pixels, (result) =>
                    result ? resolve() : reject(new Error("Could not decode this HEIC file.")));
            });

            ctx.putImageData(pixels, 0, 0);
            return canvas;
        } finally {
            images.forEach((image) => image.free());
        }
    }

    return { isHeic, decode };
})();
