#!/usr/bin/env node
import chalk from "chalk";
import Commander from "commander";
import path from "path";
import prompts from "prompts";

import { generateApi } from "./generate-api";
import packageJson from "./package.json";

let apiRoot = "";

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments("<project-folder>")
  .usage(`${chalk.green("<project-folder>")} [options]`)
  .action((name) => {
    apiRoot = name;
  })
  .option(
    "-l, --lang <language>",
    "The language you want your generated api in. Options are: [typescript, es2015, esnext]",
    "typescript"
  )
  .option(
    "-h, --host <database-host>",
    "database host from which you want to generate the api. Default is localhost",
    "localhost"
  )
  .option("-p, port", "database port to connect to. Default is 3306", "3306")
  .option(
    "-d --database <database-name>",
    "database name to generate entities from."
  )
  .option(
    "-u, --username <database-user>",
    "the database user you want to connect with"
  )
  .option(
    "-x, --password <database-user-password>",
    "the password for database user you want to connect with"
  )
  .option(
    "-e, --engine",
    `database engine to use. 
      Options are
        * mysql
        * mssql
        * postgres
        * mariadb
        * oracle
        * sqlite
      Default is mysql`,
    "mysql"
  )
  .allowUnknownOption()
  .parse(process.argv);

async function run(): Promise<void> {
  if (typeof apiRoot === "string") {
    apiRoot = apiRoot.trim();
  }

  if (!apiRoot) {
    const res = await prompts({
      type: "text",
      name: "path",
      message: "What is your project named?",
      initial: "my-rest-api",
    });

    if (typeof res.path === "string") {
      apiRoot = res.path.trim();
    }
  }

  if (!apiRoot) {
    console.log();
    console.log("Please specify the project directory:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("<project-directory>")}`
    );
    console.log();
    console.log("For example:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("my-rest-api")}`
    );
    console.log();
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(apiRoot);
  const projectName = path.basename(resolvedProjectPath);

  const template = await prompts({
    type: "select",
    name: "value",
    message: "Pick a template",
    choices: [
      { title: "Typeorm", value: "typeorm" },
      { title: "Sequelize", value: "sequelize" },
    ],
  });

  if (!template.value) {
    console.log();
    console.log("Please specify the template");
    process.exit(1);
  }
  const npmConfig = require(`./templates/${template.value}/package.json`);
  console.log(npmConfig);

  await generateApi({
    appPath: resolvedProjectPath,
    tmgConfig: {
      host: program.host,
      port: program.port,
      database: program.database,
      user: program.username,
      password: program.password,
      engine: program.engine,
    },
    template: template.value,
    npmConfig,
  });
}

run().catch(async (reason) => {
  console.log();
  console.log("Aborting installation.");
  if (reason.command) {
    console.log(`  ${chalk.cyan(reason.command)} has failed.`);
  } else {
    console.log(chalk.red("Unexpected error. Please report it as a bug:"));
    console.log(reason);
  }
});
