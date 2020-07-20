import { Connection, Not, MoreThanOrEqual, Between } from "typeorm";
import moment from "moment";

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

  describe("getPrimaryKeyColumnNames()", () => {
    const manager = new Manager(Pet);
    it("should get the Entity primary key name(s)", async () => {
      expect(manager.getPrimaryKeyColumnNames(dbConn)[0]).toBe("id");
    });
  });

  describe("_validateFields()", () => {
    const manager = new Manager(Pet);
    const fields = {
      id: 1,
      status: "available",
      name: "Furball",
    };

    it("should return true if all fields are valid", async () => {
      expect(manager._validateFields(fields, dbConn)).toBe(true);
    });

    it("should return a string array of wrong fields if any is invalid", async () => {
      const badFields = { ...fields, unknown: "fake", wrong: "false" };
      expect(manager._validateFields(badFields, dbConn)).toEqual([
        "unknown",
        "wrong",
      ]);
    });
  });

  describe("_pickAttributes()", () => {
    const manager = new Manager(Pet);
    const attribs = ["id", "name", "category", "tags", "unknown", "status"];

    it("should separate relations from select fields and discard invalid fields", async () => {
      const result = manager._pickAttributes(attribs, dbConn);
      expect(result?.select).toEqual(["id", "name", "status"]);
      expect(result?.relations).toEqual(["category", "tags"]);
      expect(result?.select?.includes("unknown")).toBeFalsy();
      expect(result?.relations?.includes("unknown")).toBeFalsy();
    });

    it("should be able to handle relations with select fields", async () => {
      const result = manager._pickAttributes(
        ["id", "name", "category(id|name)", "tags(name|updatedAt)"],
        dbConn
      );
      expect(result?.relationFragments).toBeTruthy();
      const categoryRef = result?.relationFragments.find(
        (ref) => ref.name === "category"
      );
      expect(categoryRef).toBeTruthy();
      const tagsRef = result?.relationFragments.find(
        (ref) => ref.name === "tags"
      );
      expect(tagsRef).toBeTruthy();
      expect(tagsRef?.select.includes("name")).toBeTruthy();
      expect(categoryRef?.select.includes("id")).toBeTruthy();
    });
  });

  describe("_buildWhereClause()", () => {
    const manager = new Manager(Pet);
    const params = {
      "id.gte": "1",
      "name.not.eq": "Furball",
      "createdAt.between": ["2020-05-01", "2020-05-25"],
      status: "unknown",
    };

    it("should construct where clause object from params", async () => {
      const result = manager._buildWhereClause(params, dbConn);
      expect(result.id).toEqual(MoreThanOrEqual(1));
      expect(result.name).toEqual(Not("Furball"));
      expect(result.status).toBe("unknown");
      expect(result.createdAt).toEqual(
        Between(moment("2020-05-01").toDate(), moment("2020-05-25").toDate())
      );
    });
  });
});
