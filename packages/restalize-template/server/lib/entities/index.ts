// @ts-ignore
import glob from "glob";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

function getEntityGlobs(): string[] {
  if (process.env.TYPEORM_ENTITIES) {
    return process.env.TYPEORM_ENTITIES.split(",").map((p) => {
      // if absolute path, return as-is
      if (p.startsWith("/")) {
        return p;
      }
      // else resolve relative path
      return path.resolve(process.cwd(), p);
    });
  }
  return [];
}

const entityGlobs: string[] = getEntityGlobs();

const entityFiles: string[] = entityGlobs
  .map((pattern: string) => glob.sync(pattern))
  .reduce((acc: string[], curr: string[]) => acc.concat(curr), []);

const excluded = [".", "..", "managers", "index.ts", "index.js"];

const defaultExport: Record<string, any> = {};

entityFiles
  .filter((f) => !excluded.includes(path.basename(f)))
  .forEach((f) => {
    const entityName = path.basename(f).replace(/\.(t|j)s/, "");
    const exportName = `${entityName[0].toUpperCase()}${entityName.slice(1)}`;
    defaultExport[exportName] = require(f);
    // use default or named export
    defaultExport[exportName] =
      defaultExport[exportName].default ||
      defaultExport[exportName][exportName];
  });

export default defaultExport;
