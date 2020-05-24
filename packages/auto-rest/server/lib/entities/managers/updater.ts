import { Connection, ObjectType } from "typeorm";
import Manager from "./manager";

export default class ModelUpdater<Entity> extends Manager<Entity> {
  constructor(type: ObjectType<Entity>) {
    super(type);
  }

  async insert(record = {} as Entity): Promise<any> {
    const db: Connection = await this.connect;
    const validated = this._validateFields(record, db);
    if (validated !== true) {
      throw new Error(
        `The following fields are not valid on type <${this.type.name}>: ${validated}`
      );
    }
    console.log(`Creating new ${this.type.name} with params`, record);
    return db.manager
      .insert(this.type, record)
      .then((res) => Object.assign({}, record, res.generatedMaps[0]))
      .catch((err) => {
        throw err;
      });
  }

  async update(updateFields: Entity, condition = {} as Entity): Promise<any> {
    const db: Connection = await this.connect;

    const validated = this._validateFields(updateFields, db);
    if (validated !== true) {
      throw new Error(
        `The following fields are not valid on type <${this.type.name}>: ${validated}`
      );
    }

    const queryFilters = this._buildWhereClause(condition, db);
    console.log(`Updating ${this.type.name} with params`, queryFilters);
    if (!queryFilters || JSON.stringify(queryFilters) === "{}") {
      throw new Error(
        `You must specify valid query parameters for an update operation, to avoid modifying all rows in your database table in error`
      );
    }
    return db.manager
      .update(this.type, queryFilters, updateFields)
      .then((res) => res.raw.affectedRows)
      .catch((err) => {
        throw err;
      });
  }

  async delete(params = {} as Record<string, any>): Promise<number | void> {
    const db: Connection = await this.connect;
    let queryFilters = this._buildWhereClause(params, db);
    console.log(`Deleting ${this.type.name} with params`, queryFilters);

    if (!queryFilters || JSON.stringify(queryFilters) === "{}") {
      throw new Error(
        `You must specify valid query parameters for a delete operation, to avoid clearing out your database table in error`
      );
    }

    // @ts-ignore
    return db.manager
      .delete(this.type, queryFilters)
      .then((res) => res.affected)
      .catch((err) => {
        throw err;
      });
  }
}
