import fs from "fs";
import path from "path";
const { templatePath } = require("restalize-template");

// const handleError = (err: NodeJS.ErrnoException | null) =>
//   err && console.error(err);

export default async function linkTemplateFiles(
  serverType: string
): Promise<string | void> {
  // const pathToTemplate = require.resolve("restalize-template");
  console.log(`pathToTemplate: ${templatePath}`);
  const typeormTemplateRoot = path.join(
    __dirname,
    "..",
    "templates",
    "typeorm"
  );
  console.log(`typeormTemplateRoot: ${typeormTemplateRoot}`);
  const templateModuleRoot = templatePath.replace(/\/dist$/, "");
  console.log(`templateModuleRoot: ${templateModuleRoot}`);
  return new Promise((resolve, reject) => {
    if (fs.existsSync(typeormTemplateRoot)) {
      return resolve();
    }
    fs.symlink(templateModuleRoot, typeormTemplateRoot, (err) => {
      if (err) {
        reject(err.message);
        return err.message;
      }
      console.log(`template files symlinked at "${typeormTemplateRoot}"`);
      return resolve();
    });
  });
}

linkTemplateFiles("").then((err) => console.error(err));
