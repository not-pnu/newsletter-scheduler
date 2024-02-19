import mongoose from "mongoose";

import Department from "@/models/department";
import { sendEmail } from "@/jobs/email";
import type { MessagesType } from "./types/message";
import { crawlGeneral } from "./jobs/crawlGeneral";
import { crawlMachine } from "./jobs/crawlMachine";

export async function setMongoose() {
  const CONNECTION_URL =
    process.env.NODE_ENV === "production"
      ? process.env.MONGO_ATLAS_CONNECTION_URL
      : process.env.MONGO_LOCAL_CONNECTION_URL;
  console.log(CONNECTION_URL);
  try {
    if (!CONNECTION_URL) {
      throw new Error("[Fail] MongoDB Connection URL is not defined.");
    }
    await mongoose.connect(CONNECTION_URL);
    console.log("[Success] MongoDB Connected");
  } catch (error) {
    console.error(error);
  }
}

export async function schedulingJobs() {
  console.log("-----------------------------");
  const now = new Date();
  const date = new Date(now);
  const kstDate = date.toLocaleString("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  });
  console.log(`[Cron] Fetching RSS data (${kstDate}).`);
  try {
    const temp_departments = await Department.find({});
    const departments = temp_departments.filter((_, index) => {
      return index % 12 === parseInt(kstDate) % 12;
    });
    if (departments.length === 0) {
      console.log("[Cron] Department is nothing.");
      return;
    }

    for (const department of departments) {
      if (department.boards.length === 0) {
        console.log("[Cron] No RSS data on", department.name);
        return;
      }

      let messages: MessagesType = {};
      console.log("[Cron] Fetching RSS data on", department.name);
      if (department.code === "me") {
        messages = await crawlMachine(department);
      } else {
        messages = await crawlGeneral(department);
      }

      await sendEmail(messages, department);
      console.log("[Cron] Finished working on", department.name);
    }
    console.log("[Cron] Finished all working on fetching RSS data.");
  } catch (error) {
    console.log(error);
  }
  console.log("-----------------------------");
}
