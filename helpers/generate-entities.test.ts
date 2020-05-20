import { TmgConfig, generateEntities } from "./generate-entities";
import * as spawn from "cross-spawn";

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
jest.mock("cross-spawn", () => ({ default: crossSpawnMock }));
jest.mock("make-dir");
jest.mock("fs");

describe("generateEntities()", () => {
  const mockConfig: TmgConfig = {
    host: "localhost",
    port: "3306",
    engine: "mysql",
    database: "",
    user: "",
    pass: "",
    skipTables: "",
  };

  let mockExit: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;
  beforeEach(() => {
    mockExit = jest
      .spyOn(process, "exit")
      // @ts-ignore
      .mockImplementation((code?: number) => code);
    mockConsoleLog = jest
      .spyOn(console, "log")
      .mockImplementation((text: string) => text);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
  });

  it("should invoke typeorm-model-generator with no args if only default args present", async () => {
    try {
      await generateEntities("", mockConfig);
    } catch {}
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "spawning process npx with args [typeorm-model-generator]"
    );
  });
});
