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

  it("should fetch only fields specified in _select_ param", async () => {
    const pet = await fetcher.fetch({ id: 1, _select_: "id,name,status" });
    expect(Object.keys(pet)).toEqual(["id", "name", "status"]);
  });

  it("should fetch relation specified in _select_ param", async () => {
    const pet = await fetcher.fetch({
      id: 1,
      _select_: "id,name,category,tags",
    });
    expect(pet.tags?.length).toBeTruthy();
    expect(pet.category?.id).toBeTruthy();
    expect(pet.category?.name).toContain("cat");
  });

  it("should fetch only fields specified for relations in _select_ param", async () => {
    const pet = await fetcher.fetch({
      id: 1,
      _select_: "id,name,category(id|name|createdAt),tags(name)",
    });
    expect(Object.keys(pet.category || {})).toEqual([
      "id",
      "name",
      "createdAt",
    ]);
    expect(Object.keys(pet?.tags?.[0] || {})).toEqual(["name"]);
    expect(pet.category?.updatedAt).toBeUndefined();
    expect(pet.category?.pets).toBeUndefined();
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
