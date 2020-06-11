import { Connection } from "typeorm";
import moment from "moment";

import ModelUpdater, {
  DeleteResponse,
} from "../../../../server/lib/entities/managers/updater";
import {
  initializeDatabase,
  teardownDatabase,
  clearData,
} from "../../utils/db";
import Pet from "../Pet";
import petdata from "../../../data/petdata.json";
import Category from "../Category";
import ModelFetcher from "../../../../server/lib/entities/managers/fetcher";

let dbConn: Connection;

describe("ModelUpdater", () => {
  let updater: ModelUpdater<Pet>;
  beforeAll(async () => {
    dbConn = await initializeDatabase();
    await clearData();
    // await loadData();
    updater = new ModelUpdater(Pet);
  });

  afterAll(async () => {
    await teardownDatabase(await dbConn);
  });

  it("should initialize using an Entity", async () => {
    updater = new ModelUpdater(Pet);
    expect(updater.type).toBe(Pet);
  });

  it("should insert a new Entity instance and return it with an id", async () => {
    const firstPet = new Pet(petdata[0]);
    const newPet = (await updater.insert(firstPet)) as Pet;
    expect(newPet.id).toBe(1);
  });

  it("should insert multiple Entity instances and return an array of entities with ids", async () => {
    const [_, ...otherPets] = petdata;
    otherPets.map((p) => {
      delete p.category;
      delete p.tags;
    });
    const newPets = (await updater.insert(
      otherPets.map((p) => new Pet(p))
    )) as Pet[];
    newPets.forEach((pet: Pet, i: number) => {
      expect(isNaN(pet.id as number)).toBeFalsy();
      expect(Array.isArray(pet.photoUrls)).toBeTruthy();
      expect(pet.createdAt?.toISOString().substr(0, 10)).toBe(
        new Date().toISOString().substr(0, 10)
      );
      expect(pet.name).toBe(otherPets[i].name);
    });
  });

  it("should update an Entity by id", async () => {
    const category = new Category({ name: "cat", id: 1 });
    const res = await updater.update({ category }, { id: 3 });
    expect(res.length).toBe(1);
    const pet = await new ModelFetcher(Pet).fetch({
      id: 3,
      _select_: "id,name,category",
    });
    expect(pet.category?.name).toBe("cat");
    expect(pet.category?.id).toBe(1);
  });

  it("should update entities matching contition", async () => {
    const updateDate = moment("2020-06-10").toDate();
    const res = await updater.update(
      { updatedAt: updateDate },
      { category: null }
    );
    expect(res.length).toBe(3);
    res.forEach((pet) => {
      // time should be equivalent up to the minute
      expect(pet.updatedAt?.toISOString().substr(0, 16)).toBe(
        updateDate.toISOString().substr(0, 16)
      );
    });
  });

  it("should delete all entities matching condition", async () => {
    const res = await updater.delete({ "id.gte": 3 });
    expect(res.total).toBe(3);
    res.deleted.forEach((pet) => {
      expect(pet.id).toBeGreaterThanOrEqual(3);
    });
  });

  it("should throw an exception if delete is called with no args", async () => {
    try {
      await updater.delete();
    } catch (err) {
      expect(err.message).toBe(
        "You must specify valid query parameters for a delete operation, to avoid clearing out your database table in error"
      );
    }
  });

  it("should throw an exception if delete condition matches no rows", async () => {
    try {
      await updater.delete({ createdAt: "2020-01-01" });
    } catch (err) {
      expect(err.message).toBe("No records matching the condition passed in");
    }
  });
});
