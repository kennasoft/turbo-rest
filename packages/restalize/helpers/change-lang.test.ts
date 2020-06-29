import { changeLanguage, updateConfigs } from "./change-lang";
import fs from "fs";
import rimraf from "rimraf";
import { JavascriptFlavor } from "../generate-api";

function crossSpawnMock(
  command: string,
  args?: string[],
  options?: Record<string, any>
) {
  return {
    command,
    args,
    on: (event: string, callback: Function) => undefined,
  };
}

jest.mock("fs");
jest.mock("cross-spawn", () => ({ __esModule: true, default: crossSpawnMock }));
jest.mock("rimraf");

const tsconfig = {
  compilerOptions: {
    target: "es2015",
    moduleResolution: "node",
    strict: true,
    resolveJsonModule: true,
    esModuleInterop: true,
    skipLibCheck: false,
    outDir: "./dist",
  },
  exclude: ["./templates", "./dist", "./output"],
};

let spies: Record<string, jest.MockInstance<any, any>>;

function setupSpies() {
  return {
    consoleLogSpy: jest.spyOn(console, "log").mockImplementation(jest.fn()),
    consoleErrorSpy: jest.spyOn(console, "error").mockImplementation(jest.fn()),
    writeFileSpy: jest.spyOn(fs, "writeFileSync").mockImplementation(jest.fn()),
  };
}

function removeSpies() {
  Object.keys(spies).map((key) => spies[key].mockRestore());
}

describe("Helper: change-lang", () => {
  beforeEach(() => {
    spies = setupSpies();

    spies.readFileSpy = jest
      .spyOn(fs, "readFileSync")
      .mockImplementation(() => JSON.stringify(tsconfig));
  });

  afterEach(() => {
    removeSpies();
  });

  it("should return immediately if targetLang == typescript", async () => {
    await changeLanguage("typescript");
    expect(spies.consoleLogSpy).toHaveBeenCalledTimes(0);
  });

  it("should load current tsconfig.json file", async () => {
    await changeLanguage("esnext").catch(jest.fn());
    expect(spies.readFileSpy).toHaveBeenCalledWith("./tsconfig.json", "utf8");
  });

  it("should update current tsconfig.json file", async () => {
    await changeLanguage("es2015").catch(jest.fn());
    expect(spies.writeFileSpy).toHaveBeenCalled();
    expect(spies.writeFileSpy.mock.calls[0]?.[0]).toBe("tsconfig.json");
    expect(spies.writeFileSpy.mock.calls[0]?.[2]).toBe("utf8");
  });

  it("should exit if targetLang is not one of [typescript,esnext,es2015]", async () => {
    await changeLanguage("golang" as JavascriptFlavor).catch(jest.fn());
    expect(spies.writeFileSpy).not.toHaveBeenCalled();
  });
});

describe("updateConfigs()", () => {
  beforeEach(() => {
    spies = setupSpies();
    spies.rimrafSpy = jest.spyOn(rimraf, "sync").mockImplementation(jest.fn());
  });

  afterEach(() => {
    removeSpies();
  });

  const resolve = jest.fn();
  const reject = jest.fn();

  it("should remove the server directory", () => {
    updateConfigs("esnext", reject, resolve);
    expect(spies.rimrafSpy).toHaveBeenCalledWith("server");
  });

  it("should rename targetLang folder (e.g. 'es2015', 'esnext') to 'server'", () => {
    spies.renameSpy = jest.spyOn(fs, "renameSync").mockImplementation();
    updateConfigs("es2015", reject, resolve);
    expect(spies.renameSpy).toHaveBeenCalledWith("es2015", "server");
  });

  it("should delete typescript configuration file (tsconfig.json)", () => {
    updateConfigs("esnext", reject, resolve);
    expect(spies.rimrafSpy).toHaveBeenCalledWith("tsconfig.json");
  });

  it("should write new nodemon.json file", () => {
    updateConfigs("esnext", reject, resolve);
    expect(spies.writeFileSpy).toHaveBeenCalled();
    expect(spies.writeFileSpy.mock.calls[0]?.[0]).toBe("nodemon.json");
    expect(spies.writeFileSpy.mock.calls[0]?.[2]).toBe("utf8");
  });
});
