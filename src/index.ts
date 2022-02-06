import { fetchData } from "./api";
import { MangaViewer } from "./manga-viewer/index";

window.addEventListener("DOMContentLoaded", async () => {
  const embed = document.getElementById("embed");
  if (!embed) {
    console.error("element not found");
    return;
  }

  const pageImages = await fetchData();

  const mangaViewer = new MangaViewer({
    pageImages,
    // mode: "horizontal-ltr",
    mode: "horizontal-rtl",
  });
  embed.appendChild(mangaViewer.element);

  // 制御UI
  const pageSelect = document.createElement("select");

  for (let index = 0; index < mangaViewer.pages.length; index++) {
    const option = document.createElement("option");
    const value = `${index + 1}`;
    option.setAttribute("value", value);
    option.innerText = value;

    pageSelect.appendChild(option);
  }

  pageSelect.addEventListener("change", () => {
    const index = parseInt(pageSelect.value) - 1;
    mangaViewer.currentIndex = index;
  });
  mangaViewer.onCurrentIndexChanged((index) => {
    pageSelect.value = `${index + 1}`;
  });

  document.body.appendChild(pageSelect);

  document.getElementById("simple-next")?.addEventListener("click", () => {
    mangaViewer.next();
  });

  document.getElementById("simple-prev")?.addEventListener("click", () => {
    mangaViewer.prev();
  });

  const observer = new ResizeObserver((entries) => {
    const entry = entries.find((e) => e.target === mangaViewer.element);
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
    btn.addEventListener("click", () => {
      mangaViewer.fullscreen();
    });
    document.body.append(btn);
  }
});
console.debug("run");
