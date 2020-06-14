import { Connection, ObjectType } from "typeorm";
import Manager from "./manager";

export type ApiListResponse<Entity> = {
  total: number;
  subtotal: number;
  rows: Entity[];
};

const DEFAULT_PAGE_SIZE = 20;

export default class ModelFetcher<Entity> extends Manager<Entity> {
  constructor(type: { new (init?: Partial<Entity>): Entity }) {
    super(type);
  }

  async fetch(params = {} as Record<string, any>): Promise<Entity> {
    const db: Connection = await this.connect;
    let queryFilters: Record<string, any> = {
      where: this._buildWhereClause(params, db),
    };
    if (params._select_) {
      queryFilters = Object.assign(
        queryFilters,
        this._pickAttributes(params._select_, db)
      );
    }
    return db
      .getRepository(this.type)
      .findOne(queryFilters)
      .then((obj: any) => new this.type(obj))
      .catch((err: Error) => {
        throw err;
      });
  }

  async count(params = {} as Record<string, any>): Promise<number | void> {
    const db: Connection = await this.connect;
    let queryFilters = { where: this._buildWhereClause(params, db) };
    return db
      .getRepository(this.type)
      .count(queryFilters)
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
          if (curr.length < 2) {
            curr.push("ASC");
          }
          acc[curr[0]] = curr[1].toUpperCase();
          return acc;
        }, {});
    }
    queryFilters.where = this._buildWhereClause(params, db);
    if (params._select_) {
      queryFilters = Object.assign(
        queryFilters,
        this._pickAttributes(params._select_, db)
      );
    }

    // console.log(queryFilters);

    return db
      .getRepository(this.type)
      .findAndCount(queryFilters)
      .then((listOfItems: any[]) => {
        const resp = {
          total: listOfItems[1],
          subtotal: 0,
          rows: listOfItems[0].map(
            (raw: Partial<Entity>) => new this.type(raw)
          ),
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
