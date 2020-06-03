import { Connection, ObjectType } from "typeorm";
// @ts-ignore
process.env.NODE_ENV = "test"; // set NODE_ENV to test so sqlite is used
import dbConn from "../../../server/lib/utils/db";
import Tag from "../entities/Tag";
import Pet from "../entities/Pet";
import Category from "../entities/Category";

export type DeferredExecution = {
  run: Function;
  args?: any[];
};

export type QExecutor = {
  execute: Function;
  interval: number | null;
};

export const initializeDatabase = async (): Promise<Connection> => {
  // console.log("connecting to database");
  return dbConn;
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

export const dbQueue = {
  waiting: [] as DeferredExecution[],
  busy: false,
};

export const Executor: QExecutor = {
  execute: async (job?: Function, args?: any[]): Promise<any> => {
    console.log(dbQueue);
    return new Promise(async (resolve, reject) => {
      if (job) {
        dbQueue.waiting.push({ run: job, args });
      }
      if (!dbQueue.busy && dbQueue.waiting.length > 0) {
        const next = dbQueue.waiting.shift();
        dbQueue.busy = true;
        return next?.run
          .apply(null, next.args)
          .then((res: any) => {
            console.log(
              `finished running ${next.run.name} with args ${JSON.stringify(
                next.args
              )}`
            );
            dbQueue.busy = false;
            return resolve(res);
          })
          .catch((err: any) => {
            dbQueue.busy = false;
            return reject(err);
          })
          .finally(() => (dbQueue.busy = false));
      }
    });
  },
  interval: null,
};
// Executor.interval = setInterval(Executor.execute, 100);

export const teardownDatabase = async (conn: Connection): Promise<void> => {
  // console.log("Closing connection");
  await conn.close();
};
