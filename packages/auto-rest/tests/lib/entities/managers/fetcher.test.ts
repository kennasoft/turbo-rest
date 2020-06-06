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
  });

  afterAll(async () => {
    await teardownDatabase(await dbConn);
  });

  it("should initialize using an Entity", async () => {
    fetcher = new ModelFetcher(Pet);
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

  it("should fetch sorted list of entities based on _orderBy_ param", async () => {
    const petList = await fetcher.list({ _orderBy_: "name.DESC" });
    expect(petList.rows[0].name).toBe("Tyrannosaurus Rex");
    expect(petList.rows[4].name).toBe("FuzzyCat");
  });

  it("should return a subset of results based on _pageSize_ param", async () => {
    const petList = await fetcher.list({ _pageSize_: 2 });
    expect(petList.total).toBe(5);
    expect(petList.subtotal).toBe(2);
    expect(petList.rows.length).toBe(2);
    expect(petList.rows.map((pet) => pet.name)).toEqual([
      "FuzzyCat",
      "NaughtyDog",
    ]);
  });

  it("should get a subset of results based on _page_ and _pageSize_ params", async () => {
    const petList = await fetcher.list({ _pageSize_: 2, _page_: 2 });
    expect(petList.total).toBe(5);
    expect(petList.subtotal).toBe(2);
    expect(petList.rows.length).toBe(2);
    expect(petList.rows.map((pet) => pet.name)).toEqual([
      "Spotty",
      "King Kong",
    ]);
  });
});
