// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

globalThis.addEventListener("DOMContentLoaded", (_)=>{
    console.log("start");
    const viewer = document.querySelector(".manga-viewer");
    const content = document.querySelector(".viewer-page-contents");
    if (!content || !viewer) {
        return;
    }
    const sampleImages = [
        "samples/800x1200-1.png",
        "samples/800x1200-2.png",
        "samples/1200x1800.png",
        "samples/400x600.png",
        "samples/600x800.png",
        "samples/300x400.png",
        "samples/400x300.png",
        "samples/400x1000.png", 
    ];
    const pages = [];
    for(let index2 = 0; index2 < 30; index2++){
        pages.push({
            index: index2,
            url: sampleImages[index2 % sampleImages.length]
        });
    }
    for (const page of pages){
        content.appendChild(createViewerPage(page));
    }
    const pageSelect = document.createElement("select");
    for(let index1 = 0; index1 < pages.length; index1++){
        const option = document.createElement("option");
        const value = `${index1 + 1}`;
        option.setAttribute("value", value);
        option.innerText = value;
        pageSelect.appendChild(option);
    }
    pageSelect.addEventListener("change", ()=>{
        const index = parseInt(pageSelect.value) - 1;
        content.scrollTo({
            left: index * -400,
            behavior: "smooth"
        });
    });
    document.body.appendChild(pageSelect);
    document.getElementById("simple-next")?.addEventListener("click", ()=>{
        content.scrollBy({
            left: -1
        });
    });
    document.getElementById("simple-prev")?.addEventListener("click", ()=>{
        content.scrollBy({
            left: 1
        });
    });
    const observer = new ResizeObserver((entries)=>{
        const entry = entries.find((e)=>e.target === viewer
        );
        if (!entry) {
            return;
        }
        console.log(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(viewer);
    if (viewer.requestFullscreen) {
        const btn = document.createElement("button");
        btn.setAttribute("type", "button");
        btn.innerText = "full";
        btn.addEventListener("click", ()=>{
            viewer.requestFullscreen();
        });
        document.body.append(btn);
    }
});
console.log("run");
function createViewerPage(page) {
    const viewerPage = document.createElement("p");
    viewerPage.classList.add("viewer-page");
    const c = viewerPage.appendChild(document.createElement("canvas"));
    const w = 800;
    const h = 1200;
    c.setAttribute("width", `${800}`);
    c.setAttribute("height", `${1200}`);
    const img = new Image();
    img.src = page.url;
    img.onload = ()=>{
        const ctx = c.getContext("2d");
        if (!ctx) {
            return;
        }
        const iw = img.width;
        const ih = img.height;
        const data = {
            width: iw,
            height: ih,
            pieces: [
                {
                    x: 0,
                    y: 0,
                    w: iw,
                    h: ih
                }, 
            ]
        };
        const dw = w / h > data.width / data.height ? data.width * h / data.height : w;
        const dh = w / h > data.width / data.height ? h : data.height * w / data.width;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        for (const piece of data.pieces){
            const rw = dw / data.width;
            const rh = dh / data.height;
            ctx.drawImage(img, piece.x, piece.y, piece.w, piece.h, dx + piece.x * rw, dy + piece.y * rh, piece.w * rw, piece.h * rh);
        }
    };
    return viewerPage;
}
