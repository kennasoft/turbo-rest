import { Connection } from "typeorm";

import ModelFetcher from "../../../../server/lib/entities/managers/fetcher";
import { initializeDatabase, teardownDatabase, loadData } from "../../utils/db";
import Pet from "../Pet";

let dbConn: Connection;

describe("ModelFetcher", () => {
  beforeAll(async () => {
    dbConn = await initializeDatabase();
    await loadData();
  });

  afterAll(async () => {
    await teardownDatabase(await dbConn);
  });

  it("should initialize using an Entity", async () => {
    const fetcher = new ModelFetcher(Pet);
    expect(fetcher.type).toBe(Pet);
  });

  it("should fetch entity by name.like", async () => {
    const fetcher = new ModelFetcher(Pet);
    const pet = await fetcher.fetch({ "name.like": "Fuzzy*" });
    expect(pet.name).toMatch(/Fuzzy.*/);
  });
});
