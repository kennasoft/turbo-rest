import fs from "fs";
import chalk from "chalk";
import spawn from "cross-spawn";
import rimraf from "rimraf";

import { JavascriptFlavor } from "../generate-api";

export async function changeLanguage(
  targetLang: JavascriptFlavor
): Promise<void | string> {
  if (targetLang === "typescript") {
    return;
  }
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

    if (!child.pid) {
      // if process was never started, reject promise
      reject(`unable to spawn process yarn with args: [build]`);
    }

    /* istanbul ignore next */
    child.on("close", (code) => {
      if (code !== 0) {
        reject(`There was an error building ${targetLang} version`);
        return;
      } else {
        updateConfigs(targetLang, reject, resolve);
      }
    });
  });
}

export function updateConfigs(
  targetLang: string,
  reject: (reason?: any) => void,
  resolve: (
    value?: string | void | PromiseLike<string | void> | undefined
  ) => void
) {
  try {
    rimraf.sync("server");
    fs.renameSync(targetLang, "server");
    rimraf.sync("tsconfig.json");
    const nodemonConfig = {
      watch: ["server/**/*.js"],
      ext: "js",
      exec: "node --inspect ",
    };
    fs.writeFileSync(
      "nodemon.json",
      JSON.stringify(nodemonConfig, null, 2),
      "utf8"
    );
    try {
      const data = fs.readFileSync(".env", "utf8");
      const entitiesLocation = "TYPEORM_ENTITIES=./server/lib/entities/*.js";
      const newEnv = data.replace(/TYPEORM_ENTITIES=.*$/gm, entitiesLocation);
      fs.writeFileSync(".env", newEnv, "utf8");
    } catch (err) {
      reject(
        `Failed to update .env file. Api will not be able to find entity definitions`
      );
    }
    try {
      const data = fs.readFileSync("package.json", "utf8");
      const packageJSON = JSON.parse(data);
      packageJSON.scripts = {
        dev: "nodemon ./server/server.js",
        start: "node ./server/server.js",
      };
      packageJSON.devDependencies = {
        nodemon: packageJSON.devDependencies.nodemon,
      };
      fs.writeFileSync(
        "package.json",
        JSON.stringify(packageJSON, null, 2),
        "utf8"
      );
      console.log(
        `${chalk.green(`Api code successfully converted to ${targetLang}`)}`
      );
      resolve();
    } catch (err) {
      reject(`Failed to update package.json. Scripts may not work`);
    }
  } catch (e) {
    reject(e);
  }
}
