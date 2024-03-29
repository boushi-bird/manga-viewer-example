import { ViewerPage } from "./viewer-page";
import type { PageImage } from "./@types/index";

// アスペクト比が変わる値変更場合、cssのアスペクト比も変更が必要
/** ページ表示幅 */
const PAGE_WIDTH = 800;
/** ページ表示高さ */
const PAGE_HEIGHT = 1200;

type CurrentIndexChangeHandler = (index: number) => void;

export class MangaViewer {
  #selfElement: HTMLElement;
  #pageContents: HTMLElement;
  #pageSelector: HTMLInputElement;
  #viewerPages: ViewerPage[] = [];
  #mode: MangaViewerMode;
  #currentIndexes: number[] = [];
  #pendingCurrentIndexes: number[] | undefined = undefined;
  #currentIndexChangedHandlers: CurrentIndexChangeHandler[] = [];
  #pageScrolling = false;

  constructor({ pageImages, mode }: MangaViewerArgs) {
    this.#mode = mode;
    const { viewer, pageContents, pageSelector } = this.createElements(mode);
    this.#selfElement = viewer;
    this.#pageContents = pageContents;
    this.#pageSelector = pageSelector;
    this.#viewerPages = this.createPages(pageContents, pageImages);

    pageSelector.setAttribute("max", `${this.#viewerPages.length - 1}`);

    this.setupCurrentIndexChange();

    // とりあえずここで全画像読み込む TODO: LazyLoad的な処理をしておきたい
    for (const page of this.#viewerPages) {
      page.loadImage();
    }
  }

  get element(): HTMLElement {
    return this.#selfElement;
  }

  get pages(): readonly ViewerPage[] {
    return this.#viewerPages;
  }

  set currentIndex(index: number) {
    const page = this.#viewerPages.find((vp) => vp.index === index);
    if (!page) {
      return;
    }
    page.element.scrollIntoView();
  }

  get currentIndex(): number {
    if (this.#currentIndexes.length === 0) {
      return 0;
    }
    return Math.min(...this.#currentIndexes);
  }

  next() {
    this.currentIndex += this.#currentIndexes.length;
  }

  prev() {
    this.currentIndex -= this.#currentIndexes.length;
  }

  right() {
    this.#mode === "horizontal-rtl" ? this.prev() : this.next();
  }

  left() {
    this.#mode === "horizontal-rtl" ? this.next() : this.prev();
  }

  canFullscreen() {
    return !!this.#selfElement.requestFullscreen;
  }

  async fullscreen() {
    if (this.canFullscreen()) {
      await this.#selfElement.requestFullscreen();
    }
  }

  onCurrentIndexChanged(handler: CurrentIndexChangeHandler) {
    this.#currentIndexChangedHandlers.push(handler);
  }

  private emitCurrentIndexChanged(indexes: number[]) {
    this.#currentIndexes = indexes;
    this.#pageSelector.value = `${this.currentIndex}`;
    this.#pageSelector.setAttribute("step", `${indexes.length}`);
    for (const handler of this.#currentIndexChangedHandlers) {
      handler(this.currentIndex);
    }
  }

  private pendEmitCurrentIndexChanged(indexes: number[]) {
    if (!this.#pageScrolling) {
      this.emitCurrentIndexChanged(indexes);
    }
    this.#pendingCurrentIndexes = indexes;
  }

  private setupCurrentIndexChange() {
    const currentIndexes = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = this.#viewerPages.find(
            (p) => p.element === entry.target
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

        this.pendEmitCurrentIndexChanged([...currentIndexes]);
      },
      {
        root: this.#pageContents,
        threshold: 0.6,
      }
    );
    for (const page of this.#viewerPages) {
      observer.observe(page.element);
    }
  }

  private createElements(mode: MangaViewerMode): {
    viewer: HTMLElement;
    pageContents: HTMLElement;
    pageSelector: HTMLInputElement;
  } {
    const viewer = document.createElement("section");
    viewer.classList.add("manga-viewer");

    const viewerMain = viewer.appendChild(document.createElement("div"));
    viewerMain.classList.add("viewer-main");

    const pageContents = viewerMain.appendChild(document.createElement("div"));
    pageContents.classList.add("viewer-page-contents");

    if (mode.startsWith("horizontal-")) {
      viewer.classList.add("horizontal-viewer");
      viewer.classList.add(
        mode === "horizontal-rtl" ? "rtl-contents" : "ltr-contents"
      );
    } else {
      viewer.classList.add(`${mode}-viewer`);
    }

    const pageSelector = document.createElement("input");
    viewerMain.appendChild(pageSelector);
    pageSelector.classList.add("page-selector");
    pageSelector.setAttribute("type", "range");
    pageSelector.setAttribute("min", "0");
    pageSelector.setAttribute("max", "0");
    pageSelector.setAttribute("value", "0");
    pageSelector.setAttribute("step", "1");
    pageSelector.addEventListener("change", () => {
      const index = Math.round(parseFloat(pageSelector.value));
      this.currentIndex = index;
    });

    let scrolling: number | undefined = undefined;
    pageContents.addEventListener("scroll", () => {
      window.clearTimeout(scrolling);
      this.#pageScrolling = true;
      scrolling = window.setTimeout(() => {
        const pendingCurrentIndexes = this.#pendingCurrentIndexes;
        this.#pageScrolling = false;
        this.#pendingCurrentIndexes = undefined;
        if (pendingCurrentIndexes != null) {
          this.emitCurrentIndexChanged(pendingCurrentIndexes);
        }
      }, 100);
    });

    return { viewer, pageContents, pageSelector };
  }

  private createPages(
    pageContents: HTMLElement,
    pageImages: (PageImage | string)[]
  ): ViewerPage[] {
    const viewPages = pageImages.map((image, index) => {
      const p = new ViewerPage({
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        index,
        image,
      });
      pageContents.appendChild(p.element);
      return p;
    });
    const emptyPage = document.createElement("p");
    emptyPage.classList.add("empty-page");
    pageContents.appendChild(emptyPage);

    return viewPages;
  }
}

type MangaViewerMode = "horizontal-ltr" | "horizontal-rtl";

interface MangaViewerArgs {
  /** ページ画像情報 */
  pageImages: (PageImage | string)[];
  /** ビューワーモード */
  mode: MangaViewerMode;
}
