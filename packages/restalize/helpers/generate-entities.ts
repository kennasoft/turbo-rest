import chalk from "chalk";
import spawn from "cross-spawn";
import makeDir from "make-dir";
import fs from "fs";
import rimraf from "rimraf";

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

const defaultFields: TmgConfig = {
  host: "localhost",
  port: "3306",
  engine: "mysql",
};

function isDefault(conf: TmgConfig): boolean {
  const nonDefaults = Object.keys(conf).filter((key) => {
    return (
      conf[key as keyof TmgConfig] !== defaultFields[key as keyof TmgConfig]
    );
  });
  return nonDefaults.length > 0;
}

export const makeEnvFile = (config: TmgConfig, root: string): string => {
  let envFile = `TYPEORM_CONNECTION=${config.engine || ""}
TYPEORM_HOST=${config.host || ""}
TYPEORM_USERNAME=${config.user || ""}
TYPEORM_PASSWORD=${config.pass || ""}
TYPEORM_DATABASE=${config.database || ""}
TYPEORM_PORT=${config.port || ""}
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false
TYPEORM_ENTITIES=./dist/lib/entities/*.js,./server/lib/entities/*.ts
`;

  fs.writeFileSync(`${root}/.env`, envFile, "utf8");
  return envFile;
};

export async function generateEntities(
  root: string,
  config: TmgConfig
): Promise<void | Record<string, string>> {
  console.log(config);
  const args: string[] = ["typeorm-model-generator"];
  const entityPath = `${root}/server/lib`;

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
    /* istanbul ignore next */
    child.on("close", (code) => {
      if (code !== 0) {
        reject({ command: `npx ${args.join(" ")}` });
        return;
      } else {
        postProcess(config, entityPath, root, reject);
      }
      resolve();
    });
  });
}

export function postProcess(
  config: TmgConfig,
  entityPath: string,
  root: string,
  reject: (reason?: any) => void
) {
  try {
    let conf: TmgConfig = Object.assign({}, config);
    if (conf.engine !== "sqlite" && isDefault(conf)) {
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
    // remove auto-generated tsconfig
    rimraf.sync(`${entityPath}/tsconfig.json`);
  } catch (exc) {
    const errorMsg = `unable to automatically generate your .env file. Open ${chalk.green(
      `${root}/.env`
    )} to update with appropriate values`;
    console.log(errorMsg, exc);
    reject(errorMsg);
  }
}
