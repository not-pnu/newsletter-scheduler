import type {MessagesType} from "@/types/message.ts";
import {createPost, createPostInMarkdown} from "@/jobs/post.ts";
import axios from "axios";
import fs from "fs";
import type {IJsonData} from "@/types/data.ts";

export async function sendMessageOnDiscord(messages: MessagesType) {
    const {indexs} = getIndexs();
    const {count, dateString, contentList, updatedIndexs} = withTemplate(messages, indexs);
    if (count === 0) {
        return;
    }

    try {
        const WEBHOOK_URL = process.env.AID_DISCORD_WEBHOOK_URL;
        if (!WEBHOOK_URL) {
            throw new Error("webhook url is nothing!!");
        }
        for (const content of contentList) {
            const res = await axios.post(WEBHOOK_URL, {
                content: content,
            });
        }

        updateIndexs(updatedIndexs);
    } catch (error) {
        console.error(error);
    }
}

function withTemplate(
    messages: MessagesType,
    indexs: number[],
): { count: number, dateString: string, contentList: string[], updatedIndexs: number[] } {
    let count = 0;
    let boardIdx = 0;
    let contentList: string[] = [];
    const boardNames = Object.keys(messages);
    const updatedIndexs: number[] = [];

    let startDate = null;
    let endDate = null;

    for (const boardName of boardNames) {
        const messageInfo = messages[boardName];
        const postIdxs = Object.keys(messageInfo.message);
        updatedIndexs.push(
            messageInfo.latestPostIndex === -1
                ? indexs[boardIdx]
                : messageInfo.latestPostIndex
        );
        let pastPostIndexs = indexs;

        const result = createPostInMarkdown(
            postIdxs,
            pastPostIndexs,
            messageInfo,
            boardIdx,
            endDate,
            startDate,
            count
        );
        const tempContent = result.tempContent;
        count = result.count;
        startDate = result.startDate;
        endDate = result.endDate;

        boardIdx++;
        if (tempContent === "") {
            continue;
        }

        contentList.push(
            `## [정보컴퓨터공학부] ${boardName}\n` +
            tempContent +
            `\n\n`
        )
    }


    // if there is no new post, return.
    if (count === 0 || startDate === undefined || endDate === undefined) {
        return {
            count: 0,
            dateString: "",
            contentList: [],
            updatedIndexs: [],
        }
    }

    let dateString = "";
    if (startDate !== null && endDate !== null) {
        dateString =
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getDate() === endDate.getDate()
                ? `[${endDate.getFullYear()}-${
                    endDate.getMonth() + 1
                }-${endDate.getDate()}]`
                : `[${startDate.getFullYear()}-${
                    startDate.getMonth() + 1
                }-${startDate.getDate()} ~ ${endDate.getFullYear()}-${
                    endDate.getMonth() + 1
                }-${endDate.getDate()}]`;
    }

    return {
        count,
        dateString,
        contentList,
        updatedIndexs,
    };
}

const JSON_URL = "data/index.json";

export function getIndexs() {
    const jsonFile = fs.readFileSync(JSON_URL, "utf-8");
    const jsonData = JSON.parse(jsonFile) as IJsonData;
    const indexs = jsonData.cse;
    return {
        indexs,
    };
}

export function updateIndexs(indexs: number[]) {
    try {
        const jsonFile = fs.readFileSync(JSON_URL, "utf-8");
        const jsonData = JSON.parse(jsonFile) as IJsonData;
        jsonData.cse = indexs;
        const updatedJson = JSON.stringify(jsonData, null, 2);
        fs.writeFileSync(JSON_URL, updatedJson, "utf-8");
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}