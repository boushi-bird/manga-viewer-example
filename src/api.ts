import type { PageImage } from "./manga-viewer/@types/index.d.ts";

export async function fetchData(): Promise<PageImage[]> {
  const res = await fetch("./data.json");
  if (!res.ok) {
    console.error("api error!");
    return Promise.reject();
  }
  const { page_images: pageImages }: ApiData = await res.json();

  return pageImages;
}

interface ApiData {
  page_images: PageImage[];
}
