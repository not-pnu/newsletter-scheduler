import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeImages(url: string): Promise<string[]> {
  try {
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);

    const images = [""];
    $("img").each((index, element) => {
      const src = $(element).attr("src");
      if (src) {
        images.push(src);
      }
    });
    return images;
  } catch (error) {
    console.error(error);
    return [""];
  }
}

export async function scrapeNthImage(url: string, idx: number) {
  try {
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);

    const nthImage = $(`img:nth-child(${idx})`).attr("src");

    if (nthImage && nthImage.includes(".ac.kr")) {
      return [nthImage];
    } else {
      return [];
    }
  } catch (error) {
    console.error("[Scrapping] Failed to fetch image.", error);
    return [];
  }
}

export function isSpamContent(title: string): boolean {
    const spamWordList = ["출장", "마사지", "안마", "ㅋr톡"];

    // 스팸 단어 리스트를 순회하면서 title에 해당 단어가 포함되어 있는지 체크
    for (const spamWord of spamWordList) {
        if (title.includes(spamWord)) {
            return true; // 스팸 단어가 발견되면 true 반환
        }
    }
    return false; // 스팸 단어가 없으면 false 반환
}