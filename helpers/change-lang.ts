import fs from "fs";
import chalk from "chalk";
import spawn from "cross-spawn";
import rimraf from "rimraf";

import { JavascriptFlavor } from "../generate-api";

export async function changeLanguage(
  targetLang: JavascriptFlavor
): Promise<void | string> {
  console.log(
    `converting api code at ${process.cwd()} to ${chalk.yellowBright(
      targetLang
    )}...`
  );
  const tsconfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf8"));
  tsconfig.compilerOptions.target = targetLang;
  tsconfig.include = ["./server"];
  tsconfig.compilerOptions.outDir = `./${targetLang}`;
  switch (targetLang) {
    case "es2015":
      tsconfig.compilerOptions.module = "CommonJS";
      break;
    case "esnext":
      tsconfig.compilerOptions.module = "ESNext";
      break;
    default:
      return;
  }
  fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2), "utf8");
  return new Promise((resolve, reject) => {
    const child = spawn("yarn", ["build"], {
      stdio: "inherit",
      env: { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" },
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject("");
        return;
      } else {
        try {
          rimraf("server", () => {
            fs.renameSync(targetLang, "server");
          });
          rimraf("tsconfig.json", () => null);
          const nodemonConfig = {
            watch: ["server/**/*.js"],
            ext: "js",
            exec: "node --inspect ",
          };
          fs.writeFile(
            "nodemon.json",
            JSON.stringify(nodemonConfig, null, 2),
            "utf8",
            () => null
          );
          fs.readFile(".env", "utf8", (err, data) => {
            if (err) {
              reject(
                `Failed to update .env file. Api will not be able to find entity definitions`
              );
            }
            const entitiesLocation =
              "TYPEORM_ENTITIES=./server/lib/entities/*.js";
            const newEnv = data.replace(
              /TYPEORM_ENTITIES=.*$/gm,
              entitiesLocation
            );
            fs.writeFile(".env", newEnv, "utf8", () => null);
          });
          fs.readFile("package.json", "utf8", (err, data) => {
            if (err) {
              reject(`Failed to update package.json. Scripts may not work`);
            }
            const packageJSON = JSON.parse(data);
            packageJSON.scripts = {
              dev: "nodemon ./server/server.js",
              start: "node ./server/server.js",
            };
            packageJSON.devDependencies = {
              nodemon: packageJSON.devDependencies.nodemon,
            };
            fs.writeFile(
              "package.json",
              JSON.stringify(packageJSON, null, 2),
              "utf8",
              () => {
                console.log(
                  `${chalk.green(
                    `Api code successfully converted to ${targetLang}`
                  )}`
                );
                resolve();
              }
            );
          });
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}
