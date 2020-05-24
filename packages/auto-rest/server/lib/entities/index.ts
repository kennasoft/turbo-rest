import * as fs from "fs";

const entityFiles = fs.readdirSync(__dirname);

const excluded = [".", "..", "managers", "index.ts", "index.js"];

const defaultExport: Record<string, any> = {};

entityFiles
  .filter((f) => !excluded.includes(f))
  .forEach((f) => {
    const entityName = f.replace(/\.(t|j)s/, "");
    const exportName = `${entityName[0].toUpperCase()}${entityName.slice(1)}`;
    defaultExport[exportName] = require(`./${entityName}`);
    // use default or named export
    defaultExport[exportName] =
      defaultExport[exportName].default ||
      defaultExport[exportName][exportName];
  });

export default defaultExport;
