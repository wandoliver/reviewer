import { env } from "./config.js";
import { buildApp } from "./app.js";

const app = buildApp();

const start = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      app.listen(env.PORT, "0.0.0.0", () => resolve());
      app.once("error", reject);
    });
    console.log(`Reviewer listening on http://0.0.0.0:${env.PORT}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

void start();
