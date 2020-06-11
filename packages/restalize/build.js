#!/usr/bin/env node
const cpy = require("cpy");
const { execSync, exec } = require("child_process");

// using this file to avoid having this in package.json script > build:
// ts-node helpers/link-template-files && ncc build ./index.ts -o dist/ && rimraf ./dist/templates && cp -R templates dist

// first link template folder
console.log("Linking template files from restalize-template...");
execSync("node_modules/.bin/ts-node helpers/link-template-files", {
  stdio: "inherit",
});
console.log();

const extraBuildArgs =
  process.argv[2] === "release"
    ? "--minify --no-cache --no-source-map-register"
    : "";

console.log("Building dist/index.js executable file...");

execSync(`node_modules/.bin/ncc build ./index.ts -o dist/ ${extraBuildArgs}`, {
  stdio: "inherit",
});

console.log("removing content of dist/templates folder");
execSync("node_modules/.bin/rimraf ./dist/templates", {
  stdio: "inherit",
});
console.log();

console.log("copying relevant template files to dist/template folder...");
cpy(
  [
    "templates/typeorm/server/**",
    "templates/typeorm/tests/**",
    "templates/typeorm/*",
  ],
  "dist",
  {
    parents: true,
    cwd: __dirname,
    filter: (file) => {
      return file.name !== "swagger.json" && file.name !== "node_modules";
    },
  }
);
console.log();
console.log("Build complete!");
