import nodemailer from "nodemailer";

import User from "@/models/user";
import type { IUser } from "@/models/user";
import type { MessagesType } from "@/types/message";
import type { IDepartment } from "@/models/department";
import { createPost, createPostForMe } from "./post";
import user from "@/models/user";

// send email for all in department.
export async function sendEmail(
  messages: MessagesType,
  department: IDepartment
) {
  console.log(`Sending email for All in ${department.name}...`);

  const values = Object.values(messages);
  const condition = Array.from({ length: values.length }, (_, idx) => ({
    [`latest_post_indexs.${idx}`]: { $lt: values[idx].latestPostIndex },
  }));
  const query = {
    department_code: department.code,
    $or: [],
  };
  if (condition.length > 0) {
    query.$or = condition;
  }

  const users = await User.find(query);
  if (users.length === 0) {
    console.log(`All users of ${department.name} are latest.`);
    return;
  }

  try {
    for (const user of users) {
      if (department.code === "me") {
        await sendEmailForMe(user, messages, department);
      } else {
        await sendEmailFor(user, messages, department);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

// send email for one user.
async function sendEmailFor(
  user: IUser,
  messages: MessagesType,
  department: IDepartment
) {
  const { count, dateString, content, updatedLatestPostIndexs } = withTemplate(
    messages,
    department,
    user
  );

  const mailOptions = {
    from: process.env.APP_TITLE,
    to: user.email,
    subject: `[${process.env.APP_TITLE}]${dateString} ${department.name}에서 ${count}개의 새 소식이 왔습니다!`,
    html: content,
  };

  // create email transporter.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GOOGLE_MAIL_USER_ID,
      pass: process.env.GOOGLE_MAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail(mailOptions);
    console.log("[Success] Send email to", user.email);
    await User.updateOne(
      { email: user.email },
      { latest_post_indexs: updatedLatestPostIndexs }
    );
  } catch (error) {
    console.error(error);
  }
}

// send email for one user of machine engineering.
async function sendEmailForMe(
  user: IUser,
  messages: MessagesType,
  department: IDepartment
) {
  let count = 0;
  let boardIdx = 0;
  let content = "";
  const boardNames = Object.keys(messages);
  const updatedLatestPostIndexs = [];

  let startDate = null;
  let endDate = null;

  for (const boardName of boardNames) {
    const messageInfo = messages[boardName];
    const postIdxs = Object.keys(messageInfo.message);
    updatedLatestPostIndexs.push(
      messageInfo.latestPostIndex === -1
        ? user.latest_post_indexs[boardIdx]
        : messageInfo.latestPostIndex
    );
    let pastPostIndexs = user.latest_post_indexs;

    const result = createPostForMe(
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

    content +=
      `<br /><br />
      <h1>[${department.name}] ${boardName.split("|")[0]}</h1>
      <div style="background-color: black; width: 40vw; height: 3px"/>` +
      tempContent;
  }
  content =
    "" +
    content +
    `</br></br></br>
    <div style="background-color: black; width: 70vw; height: 3px"/>
    <div style="text-align: center; margin: 20px">
      <a href="${
        process.env.NODE_ENV === "production"
          ? process.env.PRODUCTION_URL
          : process.env.DEVELOPMENT_URL
      }">Unsubscribe</a>
    </div>`;

  // if there is no new post, return.
  if (count === 0 || startDate === undefined || endDate === undefined) {
    return;
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

  const mailOptions = {
    from: process.env.APP_TITLE,
    to: user.email,
    subject: `[${process.env.APP_TITLE}]${dateString} ${department.name}에서 ${count}개의 새 소식이 왔습니다!`,
    html: content,
  };

  // create email transporter.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GOOGLE_MAIL_USER_ID,
      pass: process.env.GOOGLE_MAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail(mailOptions);
    console.log("[Success] Send email to", user.email);
    await User.updateOne(
      { email: user.email },
      { latest_post_indexs: updatedLatestPostIndexs }
    );
  } catch (error) {
    console.error(error);
  }
}

// send email validation.
export async function sendEmailValidation(email: string) {
  const mailOptions = {
    from: process.env.APP_TITLE,
    to: email,
    subject: `[${process.env.APP_TITLE}] 이메일 검증 안내`,
    html: `<div style="gap: 10px">
                다음 버튼을 눌러 최종적으로 메일을 검증해주시기 바랍니다.
                </br>
                <a href="${
                  process.env.NODE_ENV === "production"
                    ? process.env.PRODUCTION_URL
                    : process.env.DEVELOPMENT_URL
                }/api/user/validation/${email}">
                  <button>Validate</button>
                </a>
              </div>`,
  };

  // create email transporter.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GOOGLE_MAIL_USER_ID,
      pass: process.env.GOOGLE_MAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail(mailOptions);
}

// send subscrition success email.
export async function sendSubscritionSuccessEmail(
  email: string,
  department_name: string
) {
  const mailOptions = {
    from: process.env.APP_TITLE,
    to: email,
    subject: `[${process.env.APP_TITLE}] 구독 완료`,
    html: `<p>
      ${email}님의 ${department_name} 구독이 성공적으로 완료되었습니다:)<br/>
      MailBadara 서비스를 구독해주셔서 감사드립니다:)<br/>
      구독 취소는 아래 버튼을 눌러 진행하실 수 있습니다.
      <hr>
    </p>
    <div style="text-align: center; margin: 20px">
      <a href="${
        process.env.NODE_ENV === "production"
          ? process.env.PRODUCTION_URL
          : process.env.DEVELOPMENT_URL
      }">Unsubscribe</a>
    </div>`,
  };

  // create email transporter.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    from: process.env.APP_TITLE,
    port: 587,
    secure: false,
    auth: {
      user: process.env.GOOGLE_MAIL_USER_ID,
      pass: process.env.GOOGLE_MAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail(mailOptions);
}

// check whether the email is valid.
export function isValid(email: string) {
  return (
    email.length > 0 &&
    email.includes("@") &&
    email.includes(".") &&
    email.split("@")[0].length >= 5
  );
}

// check whether the email exists in the database.
export async function isExistingEmail(email: string) {
  return await User.findOne({ email: email });
}

export function stringToDate(dateString: string) {
  const dateParts = dateString.split(" ");
  const datePart = dateParts[0];
  const timePart = dateParts[1];

  const [year, month, day] = datePart.split("-");
  const [hours, minutes, seconds] = timePart.split(":");

  const milliseconds = parseFloat(seconds);

  const dateObject = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
    Number(milliseconds)
  );
  return dateObject;
}

function withTemplate(
    messages: MessagesType,
    department: IDepartment,
    user: IUser,
):{ count: number, dateString: string, content: string, updatedLatestPostIndexs: number[] } {
  let count = 0;
  let boardIdx = 0;
  let content = "";
  const boardNames = Object.keys(messages);
  const updatedLatestPostIndexs = [];

  let startDate = null;
  let endDate = null;

  for (const boardName of boardNames) {
    const messageInfo = messages[boardName];
    const postIdxs = Object.keys(messageInfo.message);
    updatedLatestPostIndexs.push(
        messageInfo.latestPostIndex === -1
            ? user.latest_post_indexs[boardIdx]
            : messageInfo.latestPostIndex
    );
    let pastPostIndexs = user.latest_post_indexs;

    const result = createPost(
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

    content +=
        `<br /><br />
      <h1>[${department.name}] ${boardName}</h1>
      <div style="background-color: black; width: 40vw; height: 3px"/>` +
        tempContent;
  }
  content =
      "" +
      content +
      `</br></br></br>
    <div style="background-color: black; width: 70vw; height: 3px"/>
    <div style="text-align: center; margin: 20px">
      <a href="${
          process.env.NODE_ENV === "production"
              ? process.env.PRODUCTION_URL
              : process.env.DEVELOPMENT_URL
      }">Unsubscribe</a>
    </div>`;

  // if there is no new post, return.
  if (count === 0 || startDate === undefined || endDate === undefined) {
    return {
        count: 0,
        dateString: "",
        content: "",
        updatedLatestPostIndexs: [],
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
        content,
        updatedLatestPostIndexs,
    };
}