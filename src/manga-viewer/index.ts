import { ViewerPage } from "./viewer-page.ts";

// アスペクト比が変わる値変更場合、cssのアスペクト比も変更が必要
/** ページ表示幅 */
const PAGE_WIDTH = 800;
/** ページ表示高さ */
const PAGE_HEIGHT = 1200;

export class MangaViewer {
  #selfElement: HTMLElement;
  #pageContents: HTMLElement;
  #viewerPages: ViewerPage[] = [];
  #currentIndex = 0;
  #currentIndexChangedHandlers: ((index: number) => void)[] = [];

  constructor({ pageImages, mode }: MangaViewerArgs) {
    [this.#selfElement, this.#pageContents] = this.createElements(mode);
    this.#viewerPages = this.createPages(this.#pageContents, pageImages);

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
    return this.#currentIndex;
  }

  next() {
    this.#pageContents.scrollBy({ left: -1 });
  }

  prev() {
    this.#pageContents.scrollBy({ left: 1 });
  }

  canFullscreen() {
    return !!this.#selfElement.requestFullscreen;
  }

  async fullscreen() {
    if (this.canFullscreen()) {
      await this.#selfElement.requestFullscreen();
    }
  }

  onCurrentIndexChanged(handler: (index: number) => void) {
    this.#currentIndexChangedHandlers.push(handler);
  }

  private emitCurrentIndexChanged(index: number) {
    this.#currentIndex = index;
    for (const handler of this.#currentIndexChangedHandlers) {
      handler(index);
    }
  }

  private setupCurrentIndexChange() {
    const currentIndexes = new Set<number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const page = this.#viewerPages.find(p => p.element === entry.target);
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
      threshold: 0,
    })
    for (const page of this.#viewerPages) {
      observer.observe(page.element);
    }
    this.emitCurrentIndexChanged(0);
  }

  private createElements(mode: MangaViewerMode): [HTMLElement, HTMLElement] {
    const viewer = document.createElement("section");
    viewer.classList.add("manga-viewer");
    viewer.classList.add(`${mode}-viewer`);

    const viewerMain = viewer.appendChild(document.createElement("div"));
    viewerMain.classList.add("viewer-main");

    const pageContents = viewerMain.appendChild(document.createElement("div"));
    pageContents.classList.add("viewer-page-contents");
    pageContents.classList.add("scroll-hidden");

    return [viewer, pageContents];
  }

  private createPages(pageContents: HTMLElement, pageImages: PageImage[]): ViewerPage[] {
    return pageImages.map((image, index) => {
      const p = new ViewerPage({ width: PAGE_WIDTH, height: PAGE_HEIGHT, index, image });
      pageContents.appendChild(p.element);
      return p;
    });
  }
}

type MangaViewerMode = "horizontal";

interface MangaViewerArgs {
  /** ページ画像情報 */
  pageImages: PageImage[];
  /** ビューワーモード */
  mode: MangaViewerMode;
}
