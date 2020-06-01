import { Connection } from "typeorm";

import Manager from "../../../../server/lib/entities/managers/manager";
import { initializeDatabase, teardownDatabase, loadData } from "../../utils/db";
import Pet from "../Pet";

let dbConn: Connection;

describe("Manager", () => {
  beforeAll(async () => {
    dbConn = await initializeDatabase();
    await loadData();
  });

  afterAll(async () => {
    await teardownDatabase(await dbConn);
  });

  it("it should initialize using an Entity", () => {
    const manager = new Manager(Pet);
    expect(manager.type).toBe(Pet);
  });

  describe("_convertValue()", () => {
    const manager = new Manager(Pet);
    it("should convert date string to date", () => {
      const value = manager._convertValue("datetime", "2020-05-31");
      expect(value instanceof Date).toBeTruthy();
    });

    ["int", "bigint", "smallint", "mediumint"].forEach((type) => {
      it(`should convert sql type ${type} to javascript number type`, () => {
        const value = manager._convertValue(type, "350");
        expect(typeof value).toBe("number");
      });
    });

    ["float", "double", "decimal", "fixed"].forEach((type) => {
      it(`should convert sql type ${type} to javascript number type`, () => {
        const value = manager._convertValue(type, "30.57");
        expect(typeof value).toBe("number");
      });
    });
  });
});
