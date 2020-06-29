import fs from "fs";
import path from "path";
import {
  generateApi,
  GenerateApiConfig,
  JavascriptFlavor,
  EXIT_CODES,
} from "./generate-api";
import * as ife from "./helpers/is-folder-empty";
import * as chl from "./helpers/change-lang";
import rimraf from "rimraf";
import replace from "replace-in-file";

function isFolderEmptyMockFactory(reponse: boolean) {
  return () => ({
    __esModule: true,
    isFolderEmpty: () => reponse,
  });
}

jest.mock("cpy");
jest.mock("fs");
jest.mock("replace-in-file");
jest.mock("rimraf");
jest.mock("make-dir");
jest.mock("./helpers/generate-entities");
jest.mock("./helpers/change-lang");
jest.mock("./helpers/should-use-yarn");
jest.mock("./helpers/is-online");
jest.mock("./helpers/install");
jest.mock("./helpers/is-folder-empty", isFolderEmptyMockFactory(true));

let spies: Record<string, jest.SpyInstance>;

function setupSpies() {
  return {
    consoleLogSpy: jest.spyOn(console, "log").mockImplementation(jest.fn()),
    consoleErrorSpy: jest.spyOn(console, "error").mockImplementation(jest.fn()),
    writeFileSpy: jest.spyOn(fs, "writeFileSync").mockImplementation(jest.fn()),
    rimrafSpy: jest.spyOn(rimraf, "sync").mockImplementation(jest.fn()),
    renameSpy: jest.spyOn(fs, "renameSync"),
    replaceSpy: jest.spyOn(replace, "sync"),
    // @ts-ignore
    exitSpy: jest.spyOn(process, "exit").mockImplementation(jest.fn()),
    isFolderEmptySpy: jest.spyOn(ife, "isFolderEmpty"),
    changeLangSpy: jest.spyOn(chl, "changeLanguage"),
    chDirSpy: jest.spyOn(process, "chdir").mockImplementation(),
  };
}

function removeSpies() {
  Object.keys(spies).map((key) => spies[key].mockRestore());
}

function remock(modulePath: string, newMockFactory = () => jest.fn() as any) {
  jest.doMock(modulePath, newMockFactory);
  jest.resetModules();
  return require("./generate-api");
}

describe("generateApi", () => {
  const args: GenerateApiConfig = {
    appPath: "my-rest-api",
    language: "typescript",
    template: "typeorm",
    tmgConfig: {},
    npmConfig: {
      name: "restalize-api",
      dependencies: {},
      devDependencies: {},
      scripts: {},
    },
  };
  beforeEach(() => {
    spies = setupSpies();
  });

  afterEach(() => {
    removeSpies();
  });

  it("should fail if root directory arg is not specified", async () => {
    await generateApi({ ...args, appPath: "" });
    expect(spies.exitSpy).toHaveBeenCalledWith(
      EXIT_CODES.NO_APP_PATH_SPECIFIED
    );
  });

  it("should check if project directory is empty", async () => {
    await generateApi(args);
    expect(spies.isFolderEmptySpy).toHaveBeenCalled();
  });

  it("should stop installation if project directory is not empty", async () => {
    const { generateApi: genApi } = remock(
      "./helpers/is-folder-empty",
      isFolderEmptyMockFactory(false)
    );
    await genApi(args);
    expect(spies.exitSpy).toHaveBeenCalledWith(
      EXIT_CODES.PROJECT_FOLDER_NOT_EMPTY
    );
    remock("./helpers/is-folder-empty", isFolderEmptyMockFactory(true));
  });

  it("should stop installation if project folder cannot be created", async () => {
    const { generateApi: genApi } = remock("make-dir", () => ({
      __esModule: true,
      default: () => {
        throw new Error("E_NO_ACCESS");
      },
    }));
    await genApi(args);
    expect(spies.exitSpy).toHaveBeenCalledWith(
      EXIT_CODES.PROJECT_DIRECTORY_ACCESS_DENIED
    );
  });

  it("should delete hapi-related files if express server is chosen", async () => {
    const projectRoot = path.resolve(args.appPath as string);
    await generateApi({ ...args, httpServer: "express" });
    expect(spies.rimrafSpy).toHaveBeenCalledWith(
      `${projectRoot}/server/server.hapi.ts`
    );
    expect(spies.rimrafSpy).toHaveBeenCalledWith(
      `${projectRoot}/server/routes.hapi.ts`
    );
    expect(spies.rimrafSpy).toHaveBeenCalledWith(
      `${projectRoot}/server/lib/controllers/api/hapi.ts`
    );
  });

  it("should rename hapi-related files if hapi server is chosen", async () => {
    const projectRoot = path.resolve(args.appPath as string);
    await generateApi({ ...args, httpServer: "hapi" });
    expect(spies.renameSpy).toHaveBeenCalledWith(
      `${projectRoot}/server/server.hapi.ts`,
      `${projectRoot}/server/server.ts`
    );
    expect(spies.renameSpy).toHaveBeenCalledWith(
      `${projectRoot}/server/routes.hapi.ts`,
      `${projectRoot}/server/routes.ts`
    );
    expect(spies.renameSpy).toHaveBeenCalledWith(
      `${projectRoot}/server/lib/controllers/api/hapi.ts`,
      `${projectRoot}/server/lib/controllers/api/index.ts`
    );
    expect(spies.replaceSpy).toHaveBeenCalled();
  });

  it("should call changeLanguage helper if language is set", async () => {
    await generateApi({ ...args, language: "esnext" });
    expect(spies.changeLangSpy).toHaveBeenCalled();
  });

  it("should stop installation if language change fails", async () => {
    remock("make-dir");
    const { generateApi: genApi } = remock("./helpers/change-lang", () => ({
      changeLanguage: (lang: JavascriptFlavor) =>
        `LANGUAGE_CHANGE_FAILED:${lang}`,
    }));
    await genApi({ ...args, language: "esnext" });
    expect(spies.exitSpy).toHaveBeenCalledWith(
      EXIT_CODES.LANGUAGE_CHANGE_FAILED
    );
  });
});
