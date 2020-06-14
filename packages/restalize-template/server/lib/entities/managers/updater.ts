import { Connection, FindConditions } from "typeorm";
import Manager from "./manager";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

const DEFAULT_PAGE_SIZE = 20;
export type DeleteResponse = {
  deleted: any[];
  total: number;
};

export default class ModelUpdater<Entity> extends Manager<Entity> {
  constructor(type: { new (init?: Partial<Entity>): Entity }) {
    super(type);
  }

  async insert(record = {} as Entity | Entity[]): Promise<Entity | Entity[]> {
    const db: Connection = await this.connect;
    // console.log(`Creating new ${this.type.name} with params`, record);
    let records = Array.isArray(record) ? record : [record];
    let entities = records.map((rec) => {
      const validated = this._validateFields(rec, db);
      if (validated !== true) {
        throw new Error(
          `The following fields are not valid on type <${this.type.name}>: [${validated}]`
        );
      }
      return new this.type(rec);
    });
    return db
      .getRepository(this.type)
      .save(entities)
      .then((res: Entity[]) =>
        Array.isArray(record)
          ? res.map((r) => new this.type(r))
          : new this.type(res[0])
      )
      .catch((err) => {
        throw err;
      });
  }

  async update(
    updateFields: Partial<Entity>,
    condition = {} as Partial<Entity>
  ): Promise<Entity[]> {
    const db: Connection = await this.connect;

    const validated = this._validateFields(updateFields, db);
    if (validated !== true) {
      throw new Error(
        `The following fields are not valid on type <${this.type.name}>: ${validated}`
      );
    }

    const queryFilters = this._buildWhereClause(condition, db);
    if (!queryFilters || JSON.stringify(queryFilters) === "{}") {
      throw new Error(
        `You must specify valid query parameters for an update operation, to avoid modifying all rows in your database table in error`
      );
    }
    const fetchAffectedRows = async () => {
      return db.getRepository(this.type).find(queryFilters);
    };
    return db
      .getRepository(this.type)
      .update(
        queryFilters as FindConditions<Entity>,
        updateFields as QueryDeepPartialEntity<Entity>
      )
      .then((res) => {
        return fetchAffectedRows();
      })
      .catch((err) => {
        throw err;
      });
  }

  async delete(params = {} as Record<string, any>): Promise<DeleteResponse> {
    const db: Connection = await this.connect;
    let where = this._buildWhereClause(params, db);
    const repo = db.getRepository(this.type);

    if (!where || JSON.stringify(where) === "{}") {
      throw new Error(
        `You must specify valid query parameters for a delete operation, to avoid clearing out your database table in error`
      );
    }

    let deleteCandidates: any[];
    deleteCandidates = await repo.findAndCount({
      where,
      take: DEFAULT_PAGE_SIZE,
    });

    if (deleteCandidates[1] === 0) {
      throw new Error(`No records matching the condition passed in`);
    }

    // @ts-ignore
    return repo
      .delete(where as FindConditions<Entity>)
      .then(async () => {
        const deleteCheck = await repo.count(where);
        if (deleteCheck === 0) {
          return {
            deleted: deleteCandidates[0],
            total: deleteCandidates[1],
          };
        }
        throw new Error(`Failed to delete records`);
      })
      .catch((err) => {
        throw err;
      });
  }
}
