import type { IDepartment } from "@/models/department";
import type { MessageContentType, MessagesType } from "@/types/message";
import axios from "axios";
import * as iconv from "iconv-lite";
import * as cheerio from "cheerio";
import type mongoose from "mongoose";
import { scrapeNthImage } from "@/utils/util";

type Department = mongoose.Document<unknown, {}, IDepartment> &
  IDepartment & {
    _id: mongoose.Types.ObjectId;
  };

export async function crawlMachine(department: Department) {
  let messages: MessagesType = {};
  for (const [idx, board] of department.boards.entries()) {
    let htmlUrl = department.url + board;
    htmlUrl += ".asp";

    try {
      const res = await axios.get(htmlUrl, { responseType: "arraybuffer" });
      if (res.status === 200) {
        const decodedContent = iconv.decode(res.data, "euc-kr");
        const htmlData = decodedContent;

        // parse html data.
        const $ = cheerio.load(htmlData);

        // get <item> data.
        const items = $("tbody > tr").toArray().splice(0, 20);

        const message: MessageContentType = {};
        let latestPostIndex = -1;

        // print item data.
        for (const item of items) {
          const $items = $(item);
          const href = $items.find(".title.left a").attr("href");
          const idxs = href?.match(/\d+/);
          if (!idxs) {
            throw new Error("[Cron] Failed to get post index.");
          }

          let postIdx = idxs[0];
          let imageIdx = 1;

          if (Number(postIdx) > latestPostIndex) {
            latestPostIndex = Number(postIdx);
          }
          const boardNameParam = department.board_names[idx].split("|")[1];
          const postUrl =
            htmlUrl +
            "?seq=" +
            postIdx +
            "&db=" +
            boardNameParam +
            "&page=1&perPage=20&SearchPart=BD_SUBJECT&SearchStr=&page_mode=view";
          const images = await scrapeNthImage(postUrl, imageIdx);

          const tempContent = $items.find(".title.left a").contents();
          let textOnly = "";
          tempContent.each(function (i, el) {
            if (el.nodeType === 3) {
              textOnly += $(el).text();
            }
          });

          message[postIdx] = {
            title: textOnly.trim(),
            images: images,
            link: postUrl,
            pubDate:
              $items.find(".title.left .mobile-info span").first().text() +
              " 00:00:00",
          };
        }
        //console.log(message);
        messages[department.board_names[idx]] = {
          message,
          latestPostIndex,
        };
      } else {
        console.log(`[Cron][${res.status}] Failed to fetch RSS data.`, res);
        // trash value
        messages[department.board_names[idx]] = {
          message: {},
          latestPostIndex: -1,
        };
      }
    } catch (error) {
      console.log("[Cron] Failed to fetch RSS data on axios.get", error);
      // trash value
      messages[department.board_names[idx]] = {
        message: {},
        latestPostIndex: -1,
      };
    }
  }
  return messages;
}
