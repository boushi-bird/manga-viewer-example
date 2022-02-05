// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

async function fetchData() {
    const res = await fetch("./data.json");
    if (!res.ok) {
        console.error("api error!");
        return Promise.reject();
    }
    const { page_images: pageImages  } = await res.json();
    return pageImages;
}
class ViewerPage {
    #imageLoaded = false;
    #args;
    #selfElement;
    #canvas;
    constructor(args){
        this.#args = args;
        this.#selfElement = this.createElement();
        this.#canvas = this.createCanvas(args.width, args.height);
        this.#selfElement.appendChild(this.#canvas);
    }
    get index() {
        return this.#args.index;
    }
    get element() {
        return this.#selfElement;
    }
    createElement() {
        const viewerPage = document.createElement("p");
        viewerPage.classList.add("viewer-page");
        return viewerPage;
    }
    createCanvas(width, height) {
        const c = document.createElement("canvas");
        c.classList.add("content");
        c.setAttribute("width", `${width}`);
        c.setAttribute("height", `${height}`);
        return c;
    }
    loadImage() {
        if (this.#imageLoaded) {
            return Promise.resolve();
        }
        const ctx = this.#canvas.getContext("2d");
        if (!ctx) {
            console.error("The rendering context is not ready.");
            return Promise.reject();
        }
        this.#imageLoaded = true;
        const img = new Image();
        img.src = typeof this.#args.image === "string" ? this.#args.image : this.#args.image.url;
        return new Promise((resolve, reject)=>{
            img.onload = ()=>{
                this.drawPageImage(ctx, img);
                resolve();
            };
            img.onabort = img.onerror = reject;
        });
    }
    drawPageImage(ctx, img) {
        const { width , height , image  } = this.#args;
        const data = typeof image === "string" ? {
            w: img.width,
            h: img.height,
            pieces: undefined
        } : image;
        const pageRatio = width / height;
        const imageRatio = data.w / data.h;
        const dw = pageRatio > imageRatio ? imageRatio * height : width;
        const dh = pageRatio > imageRatio ? height : width / imageRatio;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;
        if (data.pieces) {
            const rw = dw / data.w;
            const rh = dh / data.h;
            for (const piece of data.pieces){
                ctx.drawImage(img, piece.x, piece.y, piece.w, piece.h, dx + piece.dx * rw, dy + piece.dy * rh, piece.w * rw, piece.h * rh);
            }
        } else {
            ctx.drawImage(img, dx, dy, dw, dh);
        }
    }
}
class MangaViewer {
    #selfElement;
    #pageContents;
    #viewerPages = [];
    #currentIndex = 0;
    #currentIndexChangedHandlers = [];
    constructor({ pageImages , mode  }){
        const [selfElement, pageContents] = this.createElements(mode);
        this.#selfElement = selfElement;
        this.#pageContents = pageContents;
        this.#viewerPages = this.createPages(pageContents, pageImages);
        this.setupCurrentIndexChange();
        for (const page of this.#viewerPages){
            page.loadImage();
        }
    }
    get element() {
        return this.#selfElement;
    }
    get pages() {
        return this.#viewerPages;
    }
    set currentIndex(index) {
        const page = this.#viewerPages.find((vp)=>vp.index === index
        );
        if (!page) {
            return;
        }
        page.element.scrollIntoView();
    }
    get currentIndex() {
        return this.#currentIndex;
    }
    next() {
        this.#pageContents.scrollBy({
            left: -1
        });
    }
    prev() {
        this.#pageContents.scrollBy({
            left: 1
        });
    }
    canFullscreen() {
        return !!this.#selfElement.requestFullscreen;
    }
    async fullscreen() {
        if (this.canFullscreen()) {
            await this.#selfElement.requestFullscreen();
        }
    }
    onCurrentIndexChanged(handler) {
        this.#currentIndexChangedHandlers.push(handler);
    }
    emitCurrentIndexChanged(index) {
        this.#currentIndex = index;
        for (const handler of this.#currentIndexChangedHandlers){
            handler(index);
        }
    }
    setupCurrentIndexChange() {
        const currentIndexes = new Set();
        const observer = new IntersectionObserver((entries)=>{
            for (const entry of entries){
                const page = this.#viewerPages.find((p)=>p.element === entry.target
                );
                if (!page) {
                    continue;
                }
                if (entry.isIntersecting) {
                    currentIndexes.add(page.index);
                } else {
                    currentIndexes.delete(page.index);
                }
            }
            if (currentIndexes.size === 0) {
                return;
            }
            const currentIndex = Math.min(...currentIndexes);
            if (currentIndex === this.#currentIndex) {
                return;
            }
            this.emitCurrentIndexChanged(currentIndex);
        }, {
            root: this.#pageContents,
            threshold: 0
        });
        for (const page1 of this.#viewerPages){
            observer.observe(page1.element);
        }
        this.emitCurrentIndexChanged(0);
    }
    createElements(mode) {
        const viewer = document.createElement("section");
        viewer.classList.add("manga-viewer");
        viewer.classList.add(`${mode}-viewer`);
        const viewerMain = viewer.appendChild(document.createElement("div"));
        viewerMain.classList.add("viewer-main");
        const pageContents = viewerMain.appendChild(document.createElement("div"));
        pageContents.classList.add("viewer-page-contents");
        return [
            viewer,
            pageContents
        ];
    }
    createPages(pageContents, pageImages) {
        return pageImages.map((image, index)=>{
            const p = new ViewerPage({
                width: 800,
                height: 1200,
                index,
                image
            });
            pageContents.appendChild(p.element);
            return p;
        });
    }
}
globalThis.addEventListener("DOMContentLoaded", async (_)=>{
    console.debug("DOMContentLoaded");
    const embed = document.getElementById("embed");
    if (!embed) {
        console.error("element not found");
        return;
    }
    const pageImages = await fetchData();
    const mangaViewer = new MangaViewer({
        pageImages,
        mode: "horizontal"
    });
    embed.appendChild(mangaViewer.element);
    const pageSelect = document.createElement("select");
    for(let index1 = 0; index1 < mangaViewer.pages.length; index1++){
        const option = document.createElement("option");
        const value = `${index1 + 1}`;
        option.setAttribute("value", value);
        option.innerText = value;
        pageSelect.appendChild(option);
    }
    pageSelect.addEventListener("change", ()=>{
        const index = parseInt(pageSelect.value) - 1;
        mangaViewer.currentIndex = index;
    });
    mangaViewer.onCurrentIndexChanged((index)=>{
        pageSelect.value = `${index + 1}`;
    });
    document.body.appendChild(pageSelect);
    document.getElementById("simple-next")?.addEventListener("click", ()=>{
        mangaViewer.next();
    });
    document.getElementById("simple-prev")?.addEventListener("click", ()=>{
        mangaViewer.prev();
    });
    const observer = new ResizeObserver((entries)=>{
        const entry = entries.find((e)=>e.target === mangaViewer.element
        );
        if (!entry) {
            return;
        }
        console.log(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(mangaViewer.element);
    if (mangaViewer.canFullscreen()) {
        const btn = document.createElement("button");
        btn.setAttribute("type", "button");
        btn.innerText = "full";
        btn.addEventListener("click", ()=>{
            mangaViewer.fullscreen();
        });
        document.body.append(btn);
    }
});
console.debug("run");
