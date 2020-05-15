import * as fs from "fs";

const entityFiles = fs.readdirSync(__dirname);

const excluded = [".", "..", "managers", "index.ts", "index.js"];

const defaultExport: Record<string, any> = {};

entityFiles
  .filter((f) => !excluded.includes(f))
  .forEach((f) => {
    const entityName = f.replace(/\.(t|j)s/, "");
    defaultExport[
      `${entityName[0].toUpperCase()}${entityName.substr(1)}`
    ] = require(`./${entityName}`).default;
  });

export default defaultExport;
