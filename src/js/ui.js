const UI = (() => {
    const els = {
        dropzone: document.getElementById("dropzone"),
        fileInput: document.getElementById("fileInput"),
        browseLink: document.getElementById("browseLink"),
        queueCard: document.getElementById("queueCard"),
        queueList: document.getElementById("queueList"),
        clearAll: document.getElementById("clearAll"),
        downloadAll: document.getElementById("downloadAll"),
        formatGrid: document.getElementById("formatGrid"),
        stripMeta: document.getElementById("stripMeta"),
        metaSub: document.getElementById("metaSub"),
        convertBtn: document.getElementById("convertBtn"),
        convertLabel: document.getElementById("convertLabel"),
    };

    const icons = {
        spinner: '<svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.56"/></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        download: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        remove: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    };

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    function metaText(item, targetFormat) {
        if (item.status === "error") return item.error || "Conversion failed.";
        if (item.status === "processing" && item.stage) return item.stage;
        if (item.status === "ready" && item.blob) {
            return formatBytes(item.size) + " → " + formatBytes(item.blob.size)
                + " · " + item.outFormat.toUpperCase();
        }
        return formatBytes(item.size) + " · " + (item.ext || "?")
            + " → " + targetFormat.toUpperCase();
    }

    function statusHtml(item) {
        switch (item.status) {
            case "processing":
                return '<span class="qi-status processing">' + icons.spinner + " PROCESSING</span>";
            case "ready":
                return '<span class="qi-status ready">' + icons.check + " READY</span>";
            case "error":
                return '<span class="qi-status error">ERROR</span>';
            default:
                return '<span class="qi-status queued">QUEUED</span>';
        }
    }

    function action(svg, label, onClick) {
        const span = document.createElement("span");
        span.className = "qi-action";
        span.innerHTML = svg;
        span.title = label;
        span.setAttribute("role", "button");
        span.addEventListener("click", onClick);
        return span;
    }

    function renderItem(item, targetFormat, handlers) {
        const row = document.createElement("div");
        row.className = "queue-item";

        const thumb = document.createElement("div");
        thumb.className = "thumb";
        if (item.thumbUrl) thumb.style.backgroundImage = 'url("' + item.thumbUrl + '")';
        row.appendChild(thumb);

        const info = document.createElement("div");
        info.className = "qi-info";

        const nameRow = document.createElement("div");
        nameRow.className = "qi-name";
        const name = document.createElement("span");
        name.textContent = item.name;
        nameRow.appendChild(name);
        if (item.status === "processing") {
            const pct = document.createElement("span");
            pct.className = "qi-pct";
            pct.textContent = item.pct + "%";
            nameRow.appendChild(pct);
        }
        info.appendChild(nameRow);

        const meta = document.createElement("div");
        meta.className = item.stage && item.status === "processing" ? "qi-meta stage" : "qi-meta";
        meta.textContent = metaText(item, targetFormat);
        info.appendChild(meta);

        if (item.status === "processing") {
            const bar = document.createElement("div");
            bar.className = "progress";
            const fill = document.createElement("span");
            fill.style.width = item.pct + "%";
            bar.appendChild(fill);
            info.appendChild(bar);
        }

        row.appendChild(info);
        row.insertAdjacentHTML("beforeend", statusHtml(item));

        if (item.status === "ready") {
            row.appendChild(action(icons.download, "Download", () => handlers.onDownload(item.id)));
        }
        row.appendChild(action(icons.remove, "Remove", () => handlers.onRemove(item.id)));

        return row;
    }

    function render(queue, targetFormat, handlers) {
        els.queueCard.hidden = queue.length === 0;
        els.queueList.replaceChildren(
            ...queue.map((item) => renderItem(item, targetFormat, handlers))
        );
    }

    function setConverting(on) {
        els.convertBtn.disabled = on;
        els.convertLabel.textContent = on ? "Converting…" : "Convert Files";
    }

    function setMetaSub(text) {
        els.metaSub.textContent = text;
    }

    let flashTimer = null;
    function flashDropzone() {
        els.dropzone.classList.add("dragover");
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => els.dropzone.classList.remove("dragover"), 600);
    }

    return { els, render, setConverting, setMetaSub, flashDropzone, formatBytes };
})();
