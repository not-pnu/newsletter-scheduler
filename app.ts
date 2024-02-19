import { setMongoose, schedulingJobs } from "./src/job";

async function main() {
  await setMongoose()
    .then(() => schedulingJobs())
    .catch((error) => console.error(error));
}

(async () => {
  await main();
  process.exit(0);
})();
