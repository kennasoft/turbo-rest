import { Connection, ObjectType } from "typeorm";
import pick from "lodash.pick";
import Manager, { RelationFragment } from "./manager";

export type ApiListResponse<Entity> = {
  total: number;
  subtotal: number;
  currentPage?: number;
  totalPages?: number;
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
      .then((obj: any) => {
        const newObj = this.restructureRelations(
          obj,
          queryFilters.relationFragments
        );
        return new this.type(newObj);
      })
      .catch((err: Error) => {
        throw err;
      });
  }

  private restructureRelations(obj: any, partialRelations: RelationFragment[]) {
    const newObj = { ...obj };
    partialRelations?.forEach((prel: RelationFragment) => {
      if (Array.isArray(newObj[prel.name])) {
        newObj[prel.name] = newObj[prel.name].map((val: any) =>
          pick(val, prel.select)
        );
      } else {
        newObj[prel.name] = pick(newObj[prel.name], prel.select);
      }
    });
    return newObj;
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
      queryFilters = {
        ...queryFilters,
        ...this._pickAttributes(params._select_, db),
      };
    }

    // console.log(queryFilters);

    return db
      .getRepository(this.type)
      .findAndCount(queryFilters)
      .then((listOfItems: [Entity[], number]) => {
        const resp: ApiListResponse<Entity> = {
          subtotal: 0,
          total: listOfItems?.[1] || 0,
          currentPage: page,
          totalPages: 0,
          rows: listOfItems[0].map((raw: Partial<Entity>) => {
            return new this.type(
              this.restructureRelations(raw, queryFilters.relationFragments)
            );
          }),
        };
        if (resp.total) {
          resp.subtotal = resp.rows.length;
          resp.totalPages = Math.ceil(resp.total / page);
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
