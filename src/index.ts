globalThis.addEventListener("DOMContentLoaded", (_) => {
  console.log("start");

  // TODO: クラスで識別以外の方法
  const viewer = document.querySelector(".manga-viewer");
  const content = document.querySelector(".viewer-page-contents");

  if (!content || !viewer) {
    return;
  }

  // 仮: ページ挿入処理
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
  const pages: Page[] = [];
  for (let index = 0; index < 30; index++) {
    pages.push({
      index,
      url: sampleImages[index % sampleImages.length],
    });
  }

  for (const page of pages) {
    content.appendChild(createViewerPage(page));
  }

  // const pages = content.querySelectorAll('.viewer-page');

  // 制御UI
  const pageSelect = document.createElement("select");

  for (let index = 0; index < pages.length; index++) {
    const option = document.createElement("option");
    const value = `${index + 1}`;
    option.setAttribute("value", value);
    option.innerText = value;

    pageSelect.appendChild(option);
  }

  pageSelect.addEventListener("change", () => {
    const index = parseInt(pageSelect.value) - 1;
    content.scrollTo({ left: index * -400, behavior: "smooth" });
  });

  document.body.appendChild(pageSelect);

  document.getElementById("simple-next")?.addEventListener("click", () => {
    content.scrollBy({ left: -1 });
    // console.log("next", content.scrollLeft);
  });

  document.getElementById("simple-prev")?.addEventListener("click", () => {
    // content.scrollBy({ left: 0  })
    content.scrollBy({ left: 1 });
    // console.log("prev", content.scrollLeft);
  });

  const observer = new ResizeObserver((entries) => {
    const entry = entries.find((e) => e.target === viewer);
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
    btn.addEventListener("click", () => {
      viewer.requestFullscreen();
    });
    document.body.append(btn);
  }
});
console.log("run");

interface Page {
  index: number;
  url: string;
}

function createViewerPage(page: Page): HTMLElement {
  const viewerPage = document.createElement("p");
  viewerPage.classList.add("viewer-page");

  const c = viewerPage.appendChild(document.createElement("canvas"));

  // アスペクト比が変わる値変更場合、cssのアスペクト比も変更が必要
  const w = 800;
  const h = 1200;
  c.setAttribute("width", `${w}`);
  c.setAttribute("height", `${h}`);

  const img = new Image();
  img.src = page.url;
  img.onload = () => {
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
        // { x: iw / 4 * 0, y: ih / 4 * 0, w: iw / 4, h: ih / 4 },
        // { x: iw / 4 * 1, y: ih / 4 * 0, w: iw / 4, h: ih / 4 },
        // { x: iw / 4 * 2, y: ih / 4 * 0, w: iw / 4, h: ih / 4 },
        // { x: iw / 4 * 3, y: ih / 4 * 0, w: iw / 4, h: ih / 4 },

        // { x: iw / 4 * 0, y: ih / 4 * 1, w: iw / 4, h: ih / 4 },
        // { x: iw / 4 * 1, y: ih / 4 * 1, w: iw / 4, h: ih / 4 },

        // { x: iw / 4 * 3, y: ih / 4 * 2, w: iw / 4, h: ih / 4 },
        // { x: iw / 4 * 3, y: ih / 4 * 3, w: iw / 4, h: ih / 4 },

        { x: 0, y: 0, w: iw, h: ih },
      ],
    };

    // アスペクト比調整
    const dw = w / h > data.width / data.height
      ? data.width * h / data.height
      : w;
    const dh = w / h > data.width / data.height
      ? h
      : data.height * w / data.width;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    for (const piece of data.pieces) {
      const rw = dw / data.width;
      const rh = dh / data.height;
      ctx.drawImage(
        img,
        piece.x,
        piece.y,
        piece.w,
        piece.h,
        dx + piece.x * rw,
        dy + piece.y * rh,
        piece.w * rw,
        piece.h * rh,
      );
    }
  };

  return viewerPage;
}
