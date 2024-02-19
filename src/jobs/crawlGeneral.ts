import type { IDepartment } from "@/models/department";
import type { MessageContentType, MessagesType } from "@/types/message";
import axios from "axios";
import xml2js from "xml2js";
import type mongoose from "mongoose";
import { scrapeNthImage } from "@/utils/util";

type Department = mongoose.Document<unknown, {}, IDepartment> &
  IDepartment & {
    _id: mongoose.Types.ObjectId;
  };

export async function crawlGeneral(department: Department) {
  let messages: MessagesType = {};
  for (const [idx, board] of department.boards.entries()) {
    let rssUrl = department.url + board;
    rssUrl += "/rssList.do?row=5";

    try {
      const res = await axios.get(rssUrl, {
        headers: {
          accept: "text/xml",
          "Content-Type": "application/rss+xml",
        },
      });
      if (res.status === 200) {
        const xmlData = res.data;

        // parse xml data.
        const result = await xml2js.parseStringPromise(xmlData);

        // get <item> data.
        const items = result.rss.channel[0].item.splice(0, 5);
        const message: MessageContentType = {};
        let latestPostIndex = -1;

        // print item data.
        for (const item of items) {
          let postIdx = item.link[0].split("/")[6];
          let imageIdx = 1;

          if (Number(postIdx) > latestPostIndex) {
            latestPostIndex = Number(postIdx);
          }

          const images = await scrapeNthImage(item.link[0], imageIdx);

          message[postIdx] = {
            title: item.title[0],
            images: images,
            link: item.link[0],
            pubDate: item.pubDate[0],
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
