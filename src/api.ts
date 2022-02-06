import type { PageImage } from "./manga-viewer/@types/index";

export async function fetchData(): Promise<(PageImage | string)[]> {
  const res = await fetch("./data.json");
  if (!res.ok) {
    console.error("api error!");
    return Promise.reject();
  }
  const { page_images: pageImages }: ApiData = await res.json();

  return pageImages;
}

interface ApiData {
  page_images: (PageImage | string)[];
}
