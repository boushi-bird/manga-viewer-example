import type { PageImage } from "./@types/index";

export class ViewerPage {
  #imageLoaded = false;
  #args: ViewerPageArgs;
  #selfElement: HTMLElement;
  #canvas: HTMLCanvasElement;

  constructor(args: ViewerPageArgs) {
    this.#args = args;
    this.#selfElement = this.createElement();
    this.#canvas = this.createCanvas(args.width, args.height);
    this.#selfElement.appendChild(this.#canvas);
  }

  get index() {
    return this.#args.index;
  }

  get element(): HTMLElement {
    return this.#selfElement;
  }

  private createElement(): HTMLElement {
    const viewerPage = document.createElement("p");
    viewerPage.classList.add("viewer-page");

    return viewerPage;
  }

  private createCanvas(width: number, height: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.classList.add("content");
    c.setAttribute("width", `${width}`);
    c.setAttribute("height", `${height}`);

    return c;
  }

  loadImage(): Promise<void> {
    if (this.#imageLoaded) {
      return Promise.resolve();
    }

    const ctx = this.#canvas.getContext("2d");
    if (!ctx) {
      console.error("The rendering context is not ready.");
      return Promise.reject();
    }
    // 画像読み込み失敗しても再読み込みはしない。
    // TODO: 再読み込みの仕組みは別途考える
    this.#imageLoaded = true;

    const img = new Image();
    img.src =
      typeof this.#args.image === "string"
        ? this.#args.image
        : this.#args.image.url;
    return new Promise((resolve, reject) => {
      img.onload = () => {
        this.drawPageImage(ctx, img);
        resolve();
      };
      img.onabort = img.onerror = reject;
    });
  }

  private drawPageImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const { width, height, image } = this.#args;
    const data =
      typeof image === "string"
        ? {
            w: img.width,
            h: img.height,
            pieces: undefined,
          }
        : image;

    const pageRatio = width / height;
    const imageRatio = data.w / data.h;

    // 全体が表示されるように画像のアスペクト比調整
    const dw = pageRatio > imageRatio ? imageRatio * height : width;
    const dh = pageRatio > imageRatio ? height : width / imageRatio;
    // 真ん中に来るように表示位置の調整
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;

    if (data.pieces) {
      // バラバラになっている画像を座標情報を元に組み換え
      const rw = dw / data.w;
      const rh = dh / data.h;
      for (const piece of data.pieces) {
        ctx.drawImage(
          img,
          piece.x,
          piece.y,
          piece.w,
          piece.h,
          dx + piece.dx * rw,
          dy + piece.dy * rh,
          piece.w * rw,
          piece.h * rh
        );
      }
    } else {
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  }
}

interface ViewerPageArgs {
  /** ページ表示幅 */
  width: number;
  /** ページ表示高さ */
  height: number;
  /** ページ インデックス(0から始まる) */
  index: number;
  /** ページ画像情報 */
  image: PageImage | string;
}
