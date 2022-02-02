interface PageImage {
  /** ページ画像全体幅 */
  w: number;
  /** ページ画像全体高さ */
  h: number;
  /** ページ画像のURL */
  url: string;
  /** ページ画像の本来の座標 */
  pieces?: {
    /** 切り取り位置のx座標 */
    x: number;
    /** 切り取り位置のy座標 */
    y: number;
    /** 切り取り幅 */
    w: number;
    /** 切り取り高さ */
    h: number;
    /** 表示x座標 */
    dx: number;
    /** 表示y座標 */
    dy: number;
  }[];
}
