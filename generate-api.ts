import chalk from "chalk";
import cpy from "cpy";
import fs from "fs";
import makeDir from "make-dir";
import os from "os";
import path from "path";

import { isFolderEmpty } from "./helpers/is-folder-empty";
import { TmgConfig, generateEntities } from "./helpers/generate-entities";
import { shouldUseYarn } from "./helpers/should-use-yarn";
import { getOnline } from "./helpers/is-online";
import { install } from "./helpers/install";

export type GenerateApiConfig = {
  appPath: string;
  tmgConfig: TmgConfig; // typeorm-model-generator config
  template: string;
  npmConfig: any; // object to hold sample package.json
};

const purple = chalk.hex("8a2be2");

export async function generateApi({
  appPath,
  tmgConfig,
  template,
  npmConfig,
}: GenerateApiConfig): Promise<void> {
  const root = path.resolve(appPath);
  const appName = path.basename(root);
  const packageJSON = npmConfig;

  await makeDir(root);
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const useYarn = shouldUseYarn();
  const isOnline = !useYarn || (await getOnline());
  const originalDirectory = process.cwd();
  // console.log("originalDirectory:", originalDirectory);

  const displayedCommand = useYarn ? "yarn" : "npm";
  console.log(
    `Creating a new ${purple("restalize")} api in ${chalk.green(root)}.`
  );
  console.log();

  await generateEntities(root, tmgConfig);

  process.chdir(root);

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

  await cpy("**", root, {
    parents: true,
    cwd: path.join(__dirname, "templates", template),
    rename: (name) => {
      switch (name) {
        case "gitignore": {
          return ".".concat(name);
        }
        // README.md is ignored by webpack-asset-relocator-loader used by ncc:
        // https://github.com/zeit/webpack-asset-relocator-loader/blob/e9308683d47ff507253e37c9bcbb99474603192b/src/asset-relocator.js#L227
        case "README-template.md": {
          return "README.md";
        }
        default: {
          return name;
        }
      }
    },
  });

  packageJSON.name = appName;
  fs.writeFileSync("package.json", JSON.stringify(packageJSON), "utf8");

  let cdpath: string;
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
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
  console.log(purple(`  ${displayedCommand} start`));
  console.log("    Runs the built app in production mode.");
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(purple("  cd"), cdpath);
  console.log(`  ${purple(`${displayedCommand} ${useYarn ? "" : "run "}dev`)}`);
  console.log();
}
