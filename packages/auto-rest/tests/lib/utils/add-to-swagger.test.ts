import { Connection } from "typeorm";
import fs from "fs";
import path from "path";

import addToSwagger, {
  defaultSwagger,
} from "../../../server/lib/utils/add-to-swagger";
import Pet from "../entities/Pet";
import { initializeDatabase, teardownDatabase } from "./db";

const sampleSwagger = {
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

let dbConn: Promise<Connection>;

describe.only("addToSwagger utility", () => {
  test("expect default swagger JSON to match sample", () => {
    expect(defaultSwagger).toEqual(sampleSwagger);
  });

  describe("check swagger output", () => {
    let persistedSwagger: any;

    beforeAll(async () => {
      try {
        dbConn = initializeDatabase();
        const swaggerClone = Object.assign({}, defaultSwagger);
        await addToSwagger(Pet, swaggerClone);
        persistedSwagger = JSON.parse(
          fs.readFileSync(
            path.resolve(`${__dirname}/../../../server/docs/swagger.json`),
            "utf8"
          )
        );
      } catch (err) {
        console.log("unable to connect to sqlite database", err);
      }
    });

    afterAll(async () => {
      try {
        teardownDatabase(await dbConn);
      } catch (err) {
        console.log("unable to close sqlite database", err);
      }
    });

    test("swagger JSON should differ from default if addToSwagger() called", () => {
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
  });
});
