(() => {
    const { els } = UI;

    const state = {
        queue: [],
        format: "jpg",
        converting: false,
    };
    let nextId = 1;

    const outputName = (item) =>
        Converter.outputName(item.name, item.outFormat || state.format);

    const handlers = {
        onRemove: removeItem,
        onDownload: (id) => {
            const item = state.queue.find((q) => q.id === id);
            if (item && item.blob) Converter.save(item.blob, outputName(item));
        },
    };

    function render() {
        UI.render(state.queue, state.format, handlers);
    }

    function loadThumb(item, source) {
        const url = URL.createObjectURL(source);
        const probe = new Image();
        probe.onload = () => {
            if (!state.queue.includes(item)) return URL.revokeObjectURL(url);
            item.thumbUrl = url;
            render();
        };
        probe.onerror = () => URL.revokeObjectURL(url);
        probe.src = url;
    }

    function addFiles(fileList) {
        for (const file of fileList) {
            const item = {
                id: nextId++,
                file,
                name: file.name,
                ext: (file.name.split(".").pop() || "").toUpperCase(),
                size: file.size,
                thumbUrl: null,
                status: "queued",
                stage: null,
                pct: 0,
                blob: null,
                outFormat: null,
                error: null,
            };
            state.queue.push(item);
            loadThumb(item, file);
        }
        render();
    }

    function removeItem(id) {
        const idx = state.queue.findIndex((q) => q.id === id);
        if (idx === -1) return;
        const [item] = state.queue.splice(idx, 1);
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
        render();
    }

    function clearQueue() {
        state.queue.forEach((q) => q.thumbUrl && URL.revokeObjectURL(q.thumbUrl));
        state.queue = [];
        render();
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function convertAll() {
        if (state.converting) return;
        const todo = state.queue.filter((q) => q.status === "queued" || q.status === "error");
        if (todo.length === 0) {
            UI.flashDropzone();
            return;
        }

        state.converting = true;
        UI.setConverting(true);

        for (const item of todo) {
            if (!state.queue.includes(item)) continue;
            await convertItem(item);
        }

        state.converting = false;
        UI.setConverting(false);
    }

    async function convertItem(item) {
        const setPct = async (pct) => {
            item.pct = pct;
            render();
            await wait(140);
        };

        const setStage = (stage) => {
            item.stage = stage;
            render();
        };

        item.status = "processing";
        item.error = null;
        item.stage = null;
        await setPct(10);

        try {
            const format = state.format;
            await setPct(55);
            item.blob = await Converter.toBlob(item.file, format, setStage);
            item.outFormat = format;
            item.stage = null;
            await setPct(100);
            item.status = "ready";
            if (!item.thumbUrl) loadThumb(item, item.blob);
        } catch (err) {
            item.status = "error";
            item.error = err.message;
        }
        render();
    }

    async function downloadAll() {
        const ready = state.queue.filter((q) => q.status === "ready" && q.blob);
        for (const item of ready) {
            Converter.save(item.blob, outputName(item));
            await wait(300);
        }
    }

    els.browseLink.addEventListener("click", (e) => {
        e.preventDefault();
        els.fileInput.click();
    });

    els.dropzone.addEventListener("click", (e) => {
        if (e.target.closest("#browseLink")) return;
        els.fileInput.click();
    });

    els.dropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            els.fileInput.click();
        }
    });

    els.fileInput.addEventListener("change", () => {
        addFiles(els.fileInput.files);
        els.fileInput.value = "";
    });

    els.dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        els.dropzone.classList.add("dragover");
    });

    els.dropzone.addEventListener("dragleave", () => {
        els.dropzone.classList.remove("dragover");
    });

    els.dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        els.dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });

    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => e.preventDefault());

    els.formatGrid.addEventListener("click", (e) => {
        const btn = e.target.closest(".format-btn");
        if (!btn) return;
        state.format = btn.dataset.format;
        els.formatGrid.querySelectorAll(".format-btn")
            .forEach((b) => b.classList.toggle("selected", b === btn));
        render();
    });

    els.stripMeta.addEventListener("change", () => {
        UI.setMetaSub(els.stripMeta.checked
            ? "Strips EXIF data from output."
            : "Note: re-encoding strips EXIF either way.");
    });

    els.clearAll.addEventListener("click", clearQueue);
    els.downloadAll.addEventListener("click", downloadAll);
    els.convertBtn.addEventListener("click", convertAll);
})();
