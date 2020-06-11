import { Connection, ObjectType } from "typeorm";
// @ts-ignore
process.env.NODE_ENV = "test"; // set NODE_ENV to test so sqlite is used
import dbConn from "../../../server/lib/utils/db";
import Tag from "../entities/Tag";
import Pet from "../entities/Pet";
import Category from "../entities/Category";

export const initializeDatabase = async (): Promise<Connection> => {
  // console.log("connecting to database");
  return dbConn;
};

export const clearData = async () => {
  const db = await dbConn;
  const entities = [Pet, Category, Tag];
  const entitiesMeta = entities.map((entity) => db.getMetadata(entity));
  try {
    for (const meta of entitiesMeta) {
      const repository = await db.getRepository(meta.name);
      await repository.query(`DELETE FROM \`${meta.tableName}\`;`);
    }
  } catch (error) {
    throw new Error(`ERROR: Cleaning test db: ${error}`);
  }
};

async function insertOrIgnore<Entity>(
  entity: ObjectType<Entity>,
  payload: Entity
) {
  const db = await dbConn;
  await db
    .createQueryBuilder()
    .insert()
    .into(entity)
    .values(payload)
    .orIgnore()
    .execute();

  const insertId = db
    .getRepository(entity)
    .findOne({ where: { name: (payload as any).name } });
  return insertId;
}

async function savePets(pets: Pet[]): Promise<any> {
  const db = await dbConn;
  return db.getRepository(Pet).save(pets);
}

export const loadData = async (): Promise<any[]> => {
  const mockData = require("../../data/petdata.json");
  // const categories: Category[] = [],
  // tags: Tag[] = [];
  await clearData();
  const promises: Promise<Pet>[] = mockData.map(async (petData: Pet) => {
    petData.tags?.map(async (tag: any) => {
      tag.id = (await insertOrIgnore(Tag, tag)).id;
      // tags.push(tag);
    });
    if (petData.category) {
      petData.category.id = (
        await insertOrIgnore(Category, petData.category)
      )?.id;
      // categories.push(petData.category);
    }
    const pet = new Pet(petData);
    return pet;
  });
  const pets = await Promise.all(promises);
  // console.log(`categories: ${JSON.stringify(categories)}`);
  // console.log(`tags: ${JSON.stringify(tags)}`);
  const results = await savePets(pets);
  return results;
};

export const teardownDatabase = async (conn: Connection): Promise<void> => {
  // console.log("Closing connection");
  await conn.close();
};
