import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const app = buildApp();

  const response = await fetch("http://127.0.0.1:3335/health").catch(() => null);
  if (response) {
    console.log(response.status);
    console.log(await response.text());
    return;
  }

  await new Promise<void>((resolve, reject) => {
    app.listen(3335, "127.0.0.1", (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  const health = await fetch("http://127.0.0.1:3335/health");
  console.log(health.status);
  console.log(await health.text());

  await new Promise<void>((resolve, reject) => {
    app.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

void main();
