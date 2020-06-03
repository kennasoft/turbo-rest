import { Connection } from "typeorm";

import ModelFetcher from "../../../../server/lib/entities/managers/fetcher";
import { initializeDatabase, teardownDatabase, loadData } from "../../utils/db";
import Pet from "../Pet";

let dbConn: Connection;

describe("ModelFetcher", () => {
  let fetcher: ModelFetcher<Pet>;
  beforeAll(async () => {
    dbConn = await initializeDatabase();
    await loadData();
    fetcher = new ModelFetcher(Pet);
  });

  afterAll(async () => {
    await teardownDatabase(await dbConn);
  });

  it("should initialize using an Entity", async () => {
    expect(fetcher.type).toBe(Pet);
  });

  it("should fetch entity by name.like", async () => {
    const pet = await fetcher.fetch({ "name.like": "Fuzzy*" });
    expect(pet.name).toMatch(/Fuzzy.*/);
  });

  it("should fetch a list of entities", async () => {
    const result = await fetcher.list();
    expect(result.total).toEqual(5);
    expect(result.subtotal).toEqual(5);
    expect(result.rows[0] instanceof Pet).toBeTruthy();
  });

  it("should fetch list of entities matching condition", async () => {
    const result = await fetcher.list({ status: "available" });
    expect(result.total).toBe(4);
    expect(
      result.rows.reduce(
        (acc, curr) => acc && curr.status === "available",
        true
      )
    ).toBeTruthy();
  });

  it("should count entities matching condition", async () => {
    const count = await fetcher.count({ status: "unavailable" });
    expect(count).toBe(1);
  });
});
