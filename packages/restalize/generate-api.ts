import chalk from "chalk";
import cpy from "cpy";
import fs from "fs";
import makeDir from "make-dir";
import path from "path";
import replace from "replace-in-file";
import rimraf from "rimraf";

import { isFolderEmpty } from "./helpers/is-folder-empty";
import { TmgConfig, generateEntities } from "./helpers/generate-entities";
import { shouldUseYarn } from "./helpers/should-use-yarn";
import { getOnline } from "./helpers/is-online";
import { install } from "./helpers/install";
import { changeLanguage } from "./helpers/change-lang";

export type JavascriptFlavor = "typescript" | "es2015" | "esnext";
export type HttpServerTypes = "express" | "hapi";

export type GenerateApiConfig = {
  appPath?: string;
  tmgConfig: TmgConfig; // typeorm-model-generator config
  template: string;
  npmConfig?: any; // object to hold sample package.json
  language: JavascriptFlavor;
  httpServer?: HttpServerTypes;
};

export enum EXIT_CODES {
  NO_ERROR = 0,
  UNKNOWN_ERROR = 1,
  NO_APP_PATH_SPECIFIED = 4,
  NO_DATABASE_CONFIG_SPECIFIED = 6,
  UNSUPPORTED_LANGUAGE = 8,
  LANGUAGE_CHANGE_FAILED = 10,
  PROJECT_FOLDER_NOT_EMPTY = 12,
  MODEL_GENERATOR_FAILED = 14,
}

const purple = chalk.hex("8a2be2");

export async function generateApi({
  appPath,
  tmgConfig,
  template,
  npmConfig,
  language,
  httpServer,
}: GenerateApiConfig): Promise<void> {
  if (!appPath) {
    return process.exit(EXIT_CODES.NO_APP_PATH_SPECIFIED);
    // throw new Error(`You must specify a project folder to Proceed`);
  }
  const root = path.resolve(appPath as string);
  const appName = path.basename(root);
  const packageJSON = npmConfig;
  const hapiDependencies = ["@hapi/hapi", "@hapi/inert", "husky"];
  const expressDependencies = ["express", "cors", "body-parser", "husky"];

  await makeDir(root);
  if (!isFolderEmpty(root, appName)) {
    return process.exit(EXIT_CODES.PROJECT_FOLDER_NOT_EMPTY);
  }

  const useYarn = shouldUseYarn();
  const isOnline = !useYarn || (await getOnline());
  const originalDirectory = process.cwd();

  const displayedCommand = useYarn ? "yarn" : "npm";
  console.log(
    `Creating a new ${purple("restalize")} api in ${chalk.green(root)}.`
  );
  console.log();

  const entityFailed = await generateEntities(root, tmgConfig);

  if (entityFailed) {
    console.error(
      `${chalk.red(
        `Error generating entities at command: ${entityFailed.command}`
      )}`
    );
    return process.exit(EXIT_CODES.MODEL_GENERATOR_FAILED);
  }

  process.chdir(root);

  packageJSON.name = appName;
  const unnecessaryDeps =
    httpServer === "express" ? hapiDependencies : expressDependencies;
  unnecessaryDeps.forEach((dep) => {
    delete packageJSON.dependencies[dep];
    let depType = dep;
    // namespaced package type definitions {@namespace/package} are
    // usually named with the pattern @types/{namespace}__{package}
    if (dep.startsWith("@")) {
      depType = dep.slice(1).replace("/", "__");
    }
    delete packageJSON.devDependencies[`@types/${depType}`];
  });
  ["main", "files", "repository", "husky", "license"].forEach(
    (key: string) => delete packageJSON[key]
  );
  [
    "test:watch",
    "version:patch",
    "version:minor",
    "version:major",
    "deploy",
  ].forEach((key: string) => delete packageJSON.scripts[key]);

  fs.writeFileSync(
    "package.json",
    JSON.stringify(packageJSON, null, 2),
    "utf8"
  );

  console.log(
    `Installing ${Object.keys(packageJSON.dependencies)
      .map((dep: string) => chalk.cyan(dep))
      .join(", ")}, ${Object.keys(packageJSON.devDependencies)
      .map((dep: string) => chalk.cyan(dep))
      .join(", ")} using ${displayedCommand}...`
  );
  console.log();

  await install(root, null, { useYarn, isOnline });
  console.log();

  console.log("copying ** from ", path.join(__dirname, "templates", template));
  console.log();

  await cpy("**", root, {
    parents: true,
    cwd: path.join(__dirname, "templates", template),
    filter: (file) => file.name !== "package.json",
  });

  function noop() {}

  // remove unnecessary files
  if (httpServer === "express") {
    rimraf(`${root}/server/server.hapi.ts`, noop);
    rimraf(`${root}/server/routes.hapi.ts`, noop);
    rimraf(`${root}/server/lib/controllers/api/hapi.ts`, noop);
  } else {
    try {
      fs.renameSync(
        `${root}/server/server.hapi.ts`,
        `${root}/server/server.ts`
      );
      replace.sync({
        files: `${root}/server/server.ts`,
        from: /.\/routes.hapi/gm,
        to: "./routes",
      });
      fs.renameSync(
        `${root}/server/routes.hapi.ts`,
        `${root}/server/routes.ts`
      );
      fs.renameSync(
        `${root}/server/lib/controllers/api/hapi.ts`,
        `${root}/server/lib/controllers/api/index.ts`
      );
    } catch (err) {
      console.error(err);
    }
  }

  const langChangeFailed = await changeLanguage(language);
  if (langChangeFailed) {
    console.error(`${chalk.red(langChangeFailed)}`);
    return process.exit(EXIT_CODES.LANGUAGE_CHANGE_FAILED);
  }

  let cdpath: string;
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath as string;
  }

  console.log(`${chalk.green("Success!")} Created ${appName} at ${appPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(purple(`  ${displayedCommand} ${useYarn ? "" : "run "}dev`));
  console.log("    Starts the development server.");
  console.log();
  console.log(purple(`  ${displayedCommand} ${useYarn ? "" : "run "}build`));
  console.log("    Builds the app for production.");
  console.log();
  console.log(
    purple(`  ${displayedCommand} ${useYarn ? "" : "run "}test --verbose`)
  );
  console.log("    Runs all tests on the app.");
  console.log();
  console.log(purple(`  ${displayedCommand} start`));
  console.log("    Runs the built app in production mode.");
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(purple("  cd"), cdpath);
  console.log(`  ${purple(`${displayedCommand} ${useYarn ? "" : "run "}dev`)}`);
  console.log();
}
