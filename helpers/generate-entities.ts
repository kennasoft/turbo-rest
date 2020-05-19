import chalk from "chalk";
import spawn from "cross-spawn";
import makeDir from "make-dir";
import fs from "fs";

export type DatabaseEngine =
  | "mysql"
  | "mssql"
  | "postgres"
  | "mariadb"
  | "oracle"
  | "sqlite";

export type TmgConfig = {
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  pass?: string;
  engine?: DatabaseEngine;
  skipTables?: string;
};

const makeEnvFile = (config: TmgConfig, root: string) => {
  let envFile = `
TYPEORM_CONNECTION=${config.engine}
TYPEORM_HOST=${config.host}
TYPEORM_USERNAME=${config.user}
TYPEORM_PASSWORD=${config.pass}
TYPEORM_DATABASE=${config.database}
TYPEORM_PORT=${config.port}
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false
TYPEORM_ENTITIES=./dist/lib/entities/*.js,./server/lib/entities/*.ts
  `;

  fs.writeFileSync(`${root}/.env`, envFile, "utf8");
};

export async function generateEntities(
  root: string,
  config: TmgConfig
): Promise<void | Record<string, string>> {
  console.log(config);
  const args: string[] = ["typeorm-model-generator"];
  const entityPath = `${root}/server/lib`;

  const defaultFields: TmgConfig = {
    host: "localhost",
    port: "3306",
    engine: "mysql",
  };
  const defaults = Object.keys(defaultFields);

  const allEmpty = Object.keys(config)
    .filter((c) => !defaults.includes(c))
    .reduce((acc: boolean, curr: string) => {
      acc = acc && !config[curr as keyof TmgConfig];
      return acc;
    }, true);

  await makeDir(entityPath);
  if (!allEmpty) {
    Object.keys(config).forEach((key) => {
      const i = key as keyof TmgConfig;
      if (config[i]) {
        args.push(`--${i}`, config[i] as string);
      } else {
        if (i in defaultFields) {
          args.push(`--${i}`, defaultFields[i] as string);
        }
      }
    });
    args.push("-o", entityPath);
    args.push("--generateConstructor", "true");
    args.push("--defaultExport", "true");
    args.push("--skipSchema", "true");
    // args.push("--noConfig", "true");
  }

  console.log(`spawning process npx with args [${args.join(" ")}]`);

  return new Promise((resolve, reject) => {
    const child = spawn("npx", args, {
      stdio: "inherit",
      env: { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" },
    });
    if (!child.pid) {
      // if process was never started, reject promise
      reject(`unable to spawn process npx with args: [${args.join(" ")}]`);
    }
    child.on("close", (code) => {
      if (code !== 0) {
        reject({ command: `npx ${args.join(" ")}` });
        return;
      } else {
        try {
          let conf: TmgConfig = Object.assign({}, config);
          if (!conf.user && !conf.pass) {
            const ormconfig = JSON.parse(
              fs.readFileSync(`${entityPath}/ormconfig.json`, "utf8")
            )[0];
            conf = {
              ...ormconfig,
              engine: ormconfig.type,
              user: ormconfig.username,
              pass: ormconfig.password,
            };
          }
          makeEnvFile(conf, root);
        } catch (exc) {
          const errorMsg = `unable to automatically generate your .env file. Open ${chalk.green(
            `${root}/.env`
          )} to update with appropriate values`;
          console.log(errorMsg);
          reject(errorMsg);
        }
      }
      resolve();
    });
  });
}
