import * as base from "./generate-entities";
import fs from "fs";
import rimraf from "rimraf";
// import spawn from "cross-spawn";

function crossSpawnMock(
  command: string,
  args?: string[],
  options?: Record<string, any>
) {
  return {
    command,
    args,
    // on: (event: string, callback: Function) => undefined,
    emit: (event: string, message: any) => undefined,
  };
}
jest.mock("cross-spawn", () => ({ __esModule: true, default: crossSpawnMock }));
jest.mock("make-dir");
jest.mock("rimraf");
jest.mock("fs");

const mockConfig: base.TmgConfig = {
  host: "localhost",
  port: "3306",
  engine: "mysql",
  database: "",
  user: "",
  pass: "",
  skipTables: "",
};

describe("Helper: generateEntities()", () => {
  let mockExit: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  beforeEach(() => {
    mockExit = jest
      .spyOn(process, "exit")
      // @ts-ignore
      .mockImplementation((code?: number) => code);
    mockConsoleLog = jest
      .spyOn(console, "log")
      .mockImplementation((text: string) => text);
    mockConsoleError = jest
      .spyOn(console, "error")
      .mockImplementation((text: string) => text);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("should invoke typeorm-model-generator with no args if only default args present", async () => {
    try {
      await base.generateEntities("", mockConfig);
    } catch {}
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "spawning process npx with args [typeorm-model-generator]"
    );
  });

  it("should invoke typeorm-model-generator with specified args if set", async () => {
    await base
      .generateEntities("/home/node", {
        ...mockConfig,
        database: "petstore_db",
        user: "root",
        pass: "root",
        engine: "sqlite",
      })
      .catch((err) => crossSpawnMock("npx").emit("on", err));
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "spawning process npx with args [typeorm-model-generator --host localhost --port 3306 --engine sqlite --database petstore_db --user root --pass root -o /home/node/server/lib --generateConstructor true --defaultExport true --skipSchema true]"
    );
  });
});

describe("makeEnvFile()", () => {
  const writeFileSpy = jest
    .spyOn(fs, "writeFileSync")
    .mockImplementation(jest.fn());
  it("should populate entries in an env file based on config values passed in", () => {
    const output = base.makeEnvFile(
      { ...mockConfig, database: "petstore_db", user: "root", pass: "root" },
      "/my/rest-api"
    );
    expect(writeFileSpy).toHaveBeenCalled();
    expect(writeFileSpy.mock.calls[0]?.[0]).toEqual("/my/rest-api/.env");
    expect(writeFileSpy.mock.calls[0]?.[2]).toEqual("utf8");
    expect(output).toContain(`TYPEORM_HOST=${mockConfig.host}`);
    expect(output).toContain(`TYPEORM_USERNAME=root`);
    expect(output).toContain(`TYPEORM_PASSWORD=root`);
    expect(output).toContain(`TYPEORM_DATABASE=petstore_db`);
  });
});

describe("postProcess()", () => {
  const ormconfig = [
    {
      engine: "mysql",
      user: "root",
      pass: "root",
      database: "petstore_db",
    },
  ];
  const readFileSpy = jest
    .spyOn(fs, "readFileSync")
    .mockImplementation((path, options) => JSON.stringify(ormconfig));
  it("should call makeEnvFile() if only default config present", () => {
    const makeEnvFileSpy = jest.spyOn(base, "makeEnvFile").mockImplementation();
    base.postProcess(
      mockConfig,
      "/my/rest-api/lib/entities",
      "/my/rest-api",
      (reason?: string) => {}
    );
    expect(readFileSpy).toHaveBeenCalledWith(
      "/my/rest-api/lib/entities/ormconfig.json",
      "utf8"
    );
    expect(makeEnvFileSpy).toHaveBeenCalled();
    makeEnvFileSpy.mockRestore();
  });

  it("should remove auto-generated tsconfig.json file", () => {
    const rimrafSpy = jest.spyOn(rimraf, "sync").mockImplementation();
    base.postProcess(
      { ...mockConfig, user: "root", pass: "root" },
      "/my/rest-api/lib/entities",
      "/my/rest-api",
      (reason?: string) => {}
    );
    expect(rimrafSpy).toHaveBeenCalled();
    expect(rimrafSpy.mock.calls[0]?.[0]).toBe(
      "/my/rest-api/lib/entities/tsconfig.json"
    );
    rimrafSpy.mockRestore();
  });
});
