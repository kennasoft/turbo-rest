import { Connection, ObjectType } from "typeorm";
import Manager from "./manager";

export type ApiListResponse<Entity> = {
  total: number;
  subtotal: number;
  rows: Entity[];
};

const DEFAULT_PAGE_SIZE = 20;

export default class ModelFetcher<Entity> extends Manager<Entity> {
  constructor(type: ObjectType<Entity>) {
    super(type);
  }

  async fetch(params = {} as Record<string, any>): Promise<Entity> {
    const db: Connection = await this.connect;
    let queryFilters: Record<string, any> = {
      where: this._buildWhereClause(params, db),
    };
    if (params.attribs) {
      queryFilters = Object.assign(
        queryFilters,
        this._pickAttributes(params.attribs, db)
      );
    }
    return db.manager
      .findOne(this.type, queryFilters)
      .then((obj: any) => obj)
      .catch((err: Error) => console.error(err));
  }

  async count(params = {} as Record<string, any>): Promise<number | void> {
    const db: Connection = await this.connect;
    let queryFilters = { where: this._buildWhereClause(params, db) };
    return db.manager
      .count(this.type, queryFilters)
      .then((total: number) => total)
      .catch((err: Error) => console.error(err));
  }

  async list(
    params = {} as Record<string, any>
  ): Promise<ApiListResponse<Entity>> {
    const db: Connection = await this.connect;
    let pageSize =
      "_pageSize_" in params ? parseInt(params._pageSize_) : DEFAULT_PAGE_SIZE;
    if (isNaN(pageSize)) {
      throw new Error(
        `_pageSize_ must be numeric, you passed in '${params._pageSize_}'`
      );
    }
    let page = "_page_" in params ? parseInt(params._page_) : 1;
    if (isNaN(page)) {
      throw new Error(`page must be numeric, you passed in '${params._page_}'`);
    }
    let orderBy = "_orderBy_" in params ? params._orderBy_ : null;
    let queryFilters: Record<string, any> = {
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
    if (orderBy) {
      const parts = orderBy.split(",");
      queryFilters.order = parts
        .map((ord: string) => ord.split("."))
        .reduce((acc: Record<string, string>, curr: string[]) => {
          acc[curr[0]] = curr[1];
          return acc;
        }, {});
    }
    queryFilters.where = this._buildWhereClause(params, db);
    if (params.attribs) {
      queryFilters = Object.assign(
        queryFilters,
        this._pickAttributes(params.attribs, db)
      );
    }

    console.log(queryFilters);

    return db.manager
      .findAndCount(this.type, queryFilters)
      .then((listOfItems: any[]) => {
        const resp = {
          total: listOfItems[1],
          subtotal: 0,
          rows: listOfItems[0],
        };
        if (listOfItems[1]) {
          resp.subtotal = resp.rows.length;
        }
        return resp;
      })
      .catch((err: Error) => {
        console.log(err);
        throw err;
      });
  }
}

module.exports = ModelFetcher;
