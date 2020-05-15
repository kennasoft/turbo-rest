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
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  engine: DatabaseEngine;
};

export async function generateEntities(
  root: string,
  {
    host = "localhost",
    port = "3306",
    database,
    engine = "mysql",
    user,
    password,
  }: TmgConfig
): Promise<void> {
  const args: string[] = ["typeorm-model-generator"];
  const entityPath = `${root}/server/lib`;
  const envFile = `
TYPEORM_CONNECTION=${engine}
TYPEORM_HOST=${host}
TYPEORM_USERNAME=${user}
TYPEORM_PASSWORD=${password}
TYPEORM_DATABASE=${database}
TYPEORM_PORT=${port}
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=false
TYPEORM_ENTITIES=./dist/lib/entities/*.js,./server/lib/entities/*.ts
`;

  fs.writeFileSync(`${root}/.env`, envFile, "utf8");

  await makeDir(entityPath);
  args.push("-h", host);
  args.push("-p", port);
  args.push("-d", database);
  args.push("-u", user);
  args.push("-x", password);
  args.push("-e", engine);
  args.push("-o", entityPath);
  // args.push("-pv", "public");
  args.push("--generateConstructor", "true");
  args.push("--defaultExport", "true");
  args.push("--skipSchema", "true");
  args.push("--noConfig", "true");
  console.log(args);

  return new Promise((resolve, reject) => {
    const child = spawn("npx", args, {
      stdio: "inherit",
      env: { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" },
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject({ command: `npx ${args.join(" ")}` });
        return;
      }
      resolve();
    });
  });
}
