import { Connection } from "typeorm";
import fs from "fs";
import path from "path";

import addToSwagger, {
  defaultSwagger,
  TSwaggerJSON,
  patchSwagger,
} from "../../../server/lib/utils/add-to-swagger";
import Pet from "../entities/Pet";
import { initializeDatabase, teardownDatabase } from "./db";

const sampleSwagger: TSwaggerJSON = {
  swagger: "2.0",
  info: {
    description:
      "This is an auto-generated API to access resources at http://localhost:3000/api",
    title: "Restalize API",
    version: "1.0.0",
  },
  host: "localhost:3000",
  basePath: "/api",
  tags: [],
  schemes: ["http", "https"],
  paths: {},
  definitions: {},
};

describe("swagger utils", () => {
  let dbConn: Connection;
  beforeAll(async () => {
    try {
      dbConn = await initializeDatabase();
    } catch (err) {
      console.log("unable to connect to sqlite database", err);
    }
  });

  afterAll(async () => {
    try {
      await teardownDatabase(dbConn);
    } catch (err) {
      console.log("unable to close sqlite database", err);
    }
  });

  describe("addToSwagger utility", () => {
    test("expect default swagger JSON to match sample", () => {
      expect(defaultSwagger).toEqual(sampleSwagger);
    });

    describe("check swagger output", () => {
      let persistedSwagger: TSwaggerJSON;

      beforeAll(async () => {
        try {
          const swaggerClone = Object.assign({}, defaultSwagger);
          jest
            .spyOn(fs, "writeFile")
            .mockImplementation((path, options, callback) => {
              // console.log(`attempted to fs.writeFile("${path}")`);
              return;
            });
          persistedSwagger = (await addToSwagger(
            Pet,
            swaggerClone
          )) as TSwaggerJSON;
          jest.unmock("fs");
        } catch (err) {
          console.log("unable to connect to sqlite database", err);
        }
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test("should differ from default after addToSwagger() has been called", () => {
        expect(persistedSwagger).not.toEqual(sampleSwagger);
      });

      describe("swagger JSON should contain API route '/Pets'", () => {
        test("swagger JSON path should include '/Pets'", () => {
          expect(Object.keys(persistedSwagger.paths)).toContain(`/Pets`);
        });

        ["GET", "POST", "PUT", "DELETE"].forEach((method) => {
          test(`API route '/Pets' should contain ${method} method`, () => {
            expect(
              persistedSwagger.paths["/Pets"][method.toLowerCase()]
            ).toBeDefined();
          });
        });
      });

      describe("swagger JSON should contain API route '/Pets/{id}'", () => {
        test("swagger JSON path should include '/Pets/{id}'", () => {
          expect(Object.keys(persistedSwagger.paths)).toContain(`/Pets/{id}`);
        });

        ["GET", "PUT", "DELETE"].forEach((method) => {
          test(`API route '/Pets/{id}' should contain ${method} method`, () => {
            expect(
              persistedSwagger.paths["/Pets/{id}"][method.toLowerCase()]
            ).toBeDefined();
          });
        });
      });

      describe("swagger JSON should contain definitions", () => {
        test("swagger JSON definitions should include 'Pet'", () => {
          expect(persistedSwagger.definitions.Pet).toBeDefined();
        });

        test("swagger JSON definitions should include 'PetResultList'", () => {
          expect(persistedSwagger.definitions.PetResultList).toBeDefined();
        });
      });

      describe("swagger JSON should contain tags", () => {
        it("should include 'Pet' tag", () => {
          expect(persistedSwagger.tags.length).toBe(1);
          expect(persistedSwagger.tags[0].name).toBe("Pet");
          expect(persistedSwagger.tags[0].description).toBe(
            "Access to all Pets"
          );
        });
      });
    });
  });

  describe("patchSwagger() utility", () => {
    let persistedSwagger: TSwaggerJSON;

    beforeAll(async () => {
      try {
        const swaggerClone = Object.assign({}, defaultSwagger);
        jest
          .spyOn(fs, "writeFileSync")
          // @ts-ignore
          .mockImplementation((path, content, options) => null);
        jest
          .spyOn(fs, "readFile")
          // @ts-ignore
          .mockImplementation((path, options, callback) => {
            return callback(null, JSON.stringify(swaggerClone));
          });

        const etraSwagger: TSwaggerJSON = {
          tags: [{ name: "Extra Tag", description: "An extra tag" }],
          paths: {
            "/new/api/path": {
              get: { operationId: "getOperation" },
              post: { operationId: "postOperation" },
              put: { operationId: "putOperation" },
              delete: { operationId: "deleteOperation" },
            },
          },
          definitions: {
            ExtraDefinition: {
              type: "object",
              properties: {
                name: "string",
              },
            },
          },
        };

        persistedSwagger = (await patchSwagger(etraSwagger)) as TSwaggerJSON;
        jest.unmock("fs");
      } catch (err) {
        console.log("unable to connect to sqlite database", err);
      }
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("should update existing swagger JSON", () => {
      it("should add more tags to tags array", async () => {
        expect(persistedSwagger.tags.length).toBe(2);
        expect(persistedSwagger.tags[1].name).toBe("Extra Tag");
        expect(persistedSwagger.tags[1].description).toBe("An extra tag");
      });

      it("should add a new path to the paths object", async () => {
        expect(persistedSwagger.paths["/new/api/path"]).toBeDefined();
        ["get", "post", "put", "delete"].forEach((method: string): void => {
          expect(persistedSwagger.paths["/new/api/path"][method]).toEqual({
            operationId: `${method}Operation`,
          });
        });
      });
    });
  });
});
