import {
  generateApi,
  GenerateApiConfig,
  JavascriptFlavor,
} from "./generate-api";

jest.mock("cpy");
jest.mock("fs");
jest.mock("make-dir");
jest.mock("./helpers/is-folder-empty", () => ({ isFolderEmpty: () => true }));
jest.mock("./helpers/generate-entities");
jest.mock("./helpers/install");
jest.mock("./helpers/change-lang");
jest.mock("./helpers/link-template-files");

import { EXIT_CODES } from "./generate-api";

describe("generateApi", () => {
  const args: GenerateApiConfig = {
    appPath: ".",
    language: "typescript",
    template: "typeorm",
    tmgConfig: {},
    npmConfig: {
      name: "testalize-api",
    },
  };
  let mockExit: jest.SpyInstance;
  let mockStdOut: jest.SpyInstance;
  beforeEach(() => {
    mockExit = jest
      .spyOn(process, "exit")
      // @ts-ignore
      .mockImplementation((code?: number) => code);
    mockStdOut = jest
      .spyOn(process.stdout, "write")
      // @ts-ignore
      .mockImplementation((text: string) => text);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockStdOut.mockRestore();
  });

  it("should fail if root directory arg is not specified", async () => {
    await generateApi({ ...args, appPath: "" });
    expect(mockExit).toHaveBeenCalledWith(EXIT_CODES.NO_APP_PATH_SPECIFIED);
    mockExit.mockRestore();
  });
});
