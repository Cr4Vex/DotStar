const Converter = (() => {
    const MIME = { jpg: "image/jpeg", png: "image/png" };
    const JPG_QUALITY = 0.92;

    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
            img.src = url;
        });
    }

    function encode(img, format) {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (format === "jpg") {
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))),
                MIME[format],
                format === "jpg" ? JPG_QUALITY : undefined
            );
        });
    }

    async function toBlob(file, format) {
        let img;
        try {
            img = await loadImage(file);
        } catch {
            throw new Error(file.type.startsWith("image/")
                ? "Could not decode this image."
                : "This file type can't be decoded in the browser.");
        }
        return encode(img, format);
    }

    function outputName(filename, format) {
        return filename.replace(/\.[^.]+$/, "") + "." + format;
    }

    function save(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return { toBlob, outputName, save };
})();
