import fs from "fs";
import path from "path";

// const handleError = (err: NodeJS.ErrnoException | null) =>
//   err && console.error(err);
const pathToAutoRest = require.resolve("restalize-template");
const typeormTemplateRoot = path.join(__dirname, "..", "templates", "typeorm");
const autoRestRoot = pathToAutoRest.replace(/\/dist\/server.js$/, "");

export default async function linkTemplateFiles(
  serverType: string
): Promise<string | void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(typeormTemplateRoot)) {
      return resolve();
    }
    fs.symlink(autoRestRoot, typeormTemplateRoot, (err) => {
      if (err) {
        reject(err.message);
        return err.message;
      }
      console.log(`template files symlinked at "${typeormTemplateRoot}"`);
      return resolve();
    });
  });
}

// linkTemplateFiles("").then((err) => console.error(err));
