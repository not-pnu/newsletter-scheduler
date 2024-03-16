import type {MessageType} from "@/types/message";
import {stringToDate} from "./email";

export function createPost(
    postIdxs: string[],
    pastPostIndexs: number[],
    messageInfo: MessageType,
    boardIdx: number,
    endDate: Date | null,
    startDate: Date | null,
    count: number
) {
    let tempContent = "";

    for (const postIdx of postIdxs) {
        const postIndex = Number(postIdx);
        if (pastPostIndexs.length <= boardIdx) {
            pastPostIndexs.push(0);
        }

        if (postIndex > pastPostIndexs[boardIdx]) {
            const tempDate = stringToDate(messageInfo.message[postIdx].pubDate);
            if (startDate === null || startDate > tempDate) {
                startDate = tempDate;
            }

            if (endDate === null || endDate < tempDate) {
                endDate = tempDate;
            }

            tempContent += `<div style='margin: 10px'>
                        <p>제목:
                          <a href="${messageInfo.message[postIndex].link}">
                            ${messageInfo.message[postIndex].title}
                          </a>
                          <br />
                          게시일: ${messageInfo.message[postIndex].pubDate}
                        </p>
                      </div>`;
            for (const img of messageInfo.message[postIndex].images) {
                tempContent += `<div style="width: 60vw; height: 85vw; overflow: hidden; max-width: 700px; max-height: 990px">
                            <img src="${img}" alt="image" style="width: 60vw; height: auto; max-width: 700px; max-height: none;">
                          </div>`;
            }
            count++;
        }
    }

    return {tempContent, count, startDate, endDate};
}

export function createPostForMe(
    postIdxs: string[],
    pastPostIndexs: number[],
    messageInfo: MessageType,
    boardIdx: number,
    endDate: Date | null,
    startDate: Date | null,
    count: number
) {
    let tempContent = "";

    for (const postIdx of postIdxs) {
        const postIndex = Number(postIdx);
        if (pastPostIndexs.length <= boardIdx) {
            pastPostIndexs.push(0);
        }

        if (postIndex > pastPostIndexs[boardIdx]) {
            const tempDate = stringToDate(messageInfo.message[postIdx].pubDate);
            if (startDate === null || startDate > tempDate) {
                startDate = tempDate;
            }

            if (endDate === null || endDate < tempDate) {
                endDate = tempDate;
            }

            tempContent += `<div style='margin: 10px'>
                        <p>제목:
                          <a href="${messageInfo.message[postIndex].link}">
                            ${messageInfo.message[postIndex].title}
                          </a>
                          <br />
                          게시일: ${
                messageInfo.message[postIndex].pubDate.split(" ")[0]
            }
                        </p>
                      </div>`;
            for (const img of messageInfo.message[postIndex].images) {
                tempContent += `<div style="width: 60vw; height: 85vw; overflow: hidden; max-width: 700px; max-height: 990px">
                            <img src="${img}" alt="image" style="width: 60vw; height: auto; max-width: 700px; max-height: none;">
                          </div>`;
            }
            count++;
        }
    }

    return {tempContent, count, startDate, endDate};
}

export function createPostInMarkdown(
    postIdxs: string[],
    pastPostIndexs: number[],
    messageInfo: MessageType,
    boardIdx: number,
    endDate: Date | null,
    startDate: Date | null,
    count: number
) {
    let tempContent = "";

    for (const postIdx of postIdxs) {
        const postIndex = Number(postIdx);
        if (pastPostIndexs.length <= boardIdx) {
            pastPostIndexs.push(0);
        }

        if (postIndex > pastPostIndexs[boardIdx]) {
            const tempDate = stringToDate(messageInfo.message[postIdx].pubDate);
            if (startDate === null || startDate > tempDate) {
                startDate = tempDate;
            }

            if (endDate === null || endDate < tempDate) {
                endDate = tempDate;
            }

            tempContent += `제목: <[${messageInfo.message[postIndex].title}](${messageInfo.message[postIndex].link})>
게시일: ${messageInfo.message[postIndex].pubDate}
`;
            for (const img of messageInfo.message[postIndex].images) {
                tempContent += `![image](${img})
`;
            }
            count++;
        }
    }

    return {tempContent, count, startDate, endDate};
}
