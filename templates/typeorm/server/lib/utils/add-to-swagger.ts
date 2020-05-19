import { EntityMetadata, Connection, ObjectType } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";
import { RelationMetadata } from "typeorm/metadata/RelationMetadata";
import pluralize from "pluralize";
import fs from "fs";
import path from "path";

import dbConn from "./db";
import { mapSQLTypeToSwagger } from "./type-mappings";
// import Creator from '../server/lib/entities/creator'
// import Episode from '../server/lib/entities/episode'
// import Title from '../server/lib/entities/title'
// import Page from '../server/lib/entities/page'
// import Publisher from '../server/lib/entities/publisher'

export const defaultSwagger = {
  swagger: "2.0",
  info: {
    description:
      "This is an auto-generated API to access resources at http://localhost:3000/api",
    title: "Restalize API",
    version: "1.0.0",
  },
  host: "localhost:3000",
  basePath: "/api",
  tags: [],
  schemes: ["http", "https"],
  paths: {},
  definitions: {},
};

const queue = {
  waiting: [] as any[],
  busy: false,
};

export default async function addToSwagger<Entity>(
  entity: ObjectType<Entity>,
  swaggerJSON: any
): Promise<void> {
  if (queue.busy && !queue.waiting.includes(entity)) {
    queue.waiting.push(entity);
    return;
  } else {
    queue.busy = true;
  }
  const db: Connection = await dbConn;
  const entityMeta: EntityMetadata = db.getMetadata(entity);
  swaggerJSON.definitions[`${entity.name}`] = {
    type: "object",
    properties: entityMeta.columns
      .map((col: ColumnMetadata) => {
        const typeMap = mapSQLTypeToSwagger(col.type as string);
        return {
          [col.propertyName]: {
            type: typeMap[0],
            example: typeMap[1],
          },
        };
      })
      .reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {}),
  };
  if (entityMeta.ownRelations.length > 0) {
    entityMeta.ownRelations.map((rel: RelationMetadata) => {
      if (rel.isOneToMany || rel.isManyToMany) {
        swaggerJSON.definitions[`${entity.name}`].properties[
          rel.propertyName
        ] = {
          type: "array",
          items: {
            // @ts-ignore
            $ref: `#/definitions/${rel.type.name}`,
          },
        };
      } else {
        swaggerJSON.definitions[`${entity.name}`].properties[
          rel.propertyName
        ] = {
          // @ts-ignore
          $ref: `#/definitions/${rel.type.name}`,
        };
      }
    });
  }
  swaggerJSON.tags.push({
    name: entity.name,
    description: `Access to all ${pluralize(entity.name)}`,
  });

  const orderAndPagination = [
    {
      name: "_orderBy_",
      in: "query",
      required: false,
      description:
        "specify a field to sort the results by, and the sort order. E.g. email.DESC",
      type: "string",
    },
    {
      name: "_page_",
      in: "query",
      required: false,
      description:
        "specify page number of results. Combines with _pageSize_ to get offset",
      type: "number",
    },
    {
      name: "_pageSize_",
      in: "query",
      required: false,
      description: "specify number of records to return per page.",
      type: "number",
    },
  ];

  const restMethodProps = (
    entityMeta: EntityMetadata,
    paramSource = "query",
    additionalParams = [] as any[]
  ) => {
    return {
      tags: [entityMeta.name],
      produces: ["application/json"],
      parameters: [
        ...entityMeta.columns.map((col: ColumnMetadata) => ({
          name: col.propertyName,
          in: paramSource,
          required: false,
          type: mapSQLTypeToSwagger(col.type as string)[0],
        })),
        ...additionalParams,
      ],
    };
  };

  swaggerJSON.paths[`/${pluralize(entity.name)}`] = {
    get: {
      operationId: `getAll${pluralize(entity.name)}`,
      description: `Gets a list of ${pluralize(
        entity.name
      )} based on query parameters`,
      ...restMethodProps(entityMeta, "query", orderAndPagination),
    },
    post: {
      operationId: `create${pluralize(entity.name, 1)}`,
      description: `Bulk Creates a collection of ${pluralize(
        entity.name
      )} passed as JSON in the request body`,
      tags: [entity.name],
      produces: ["application/json"],
      parameters: [
        {
          name: "entityJSON",
          in: "body",
          required: true,
          description: `A JSON object/array containing the ${pluralize(
            entityMeta.name,
            1
          )}(s) to be created`,
          schema: {
            $ref: `#/definitions/${entity.name}`,
          },
        },
      ],
    },
    put: {
      description: `Updates a collection of ${pluralize(
        entity.name
      )} that match query parameters`,
      ...restMethodProps(entityMeta),
    },
    delete: {
      description: `Deletes a collection of ${pluralize(
        entity.name
      )} based on query parameters. Use with caution as this action is irreversible`,
      ...restMethodProps(entityMeta),
    },
  };
  swaggerJSON.paths[`/${pluralize(entity.name)}/{id}`] = {
    get: {
      description: `Gets single instance of ${pluralize(
        entity.name,
        1
      )} by the id specified in the path`,
      tags: [entityMeta.name],
      produces: ["application/json"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          type: mapSQLTypeToSwagger(
            entityMeta.primaryColumns[0].type as string
          )[0],
          description: `The primary key field with which to lookup the ${entityMeta.name}`,
        },
      ],
    },
    put: {
      description: `Updates a single ${pluralize(
        entity.name,
        1
      )} that matches the id in the path with the updateFields in the body`,
      tags: [entity.name],
      produces: ["application/json"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          type: mapSQLTypeToSwagger(
            entityMeta.primaryColumns[0].type as string
          )[0],
          description: `The primary key field of the ${pluralize(
            entityMeta.name,
            1
          )} to be updated`,
        },
        {
          name: "updateFields",
          in: "body",
          required: true,
          description: `A JSON object containing some fields of the ${pluralize(
            entityMeta.name,
            1
          )} to be updated`,
          schema: {
            $ref: `#/definitions/${entity.name}`,
          },
        },
      ],
    },
    delete: {
      tags: [entity.name],
      description: `Deletes specific instance of ${pluralize(
        entity.name,
        1
      )} that matches the id in the path. Use with caution as this action is irreversible`,
      produces: ["application/json"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          type: mapSQLTypeToSwagger(
            entityMeta.primaryColumns[0].type as string
          )[0],
          description: `The primary key field of the ${pluralize(
            entityMeta.name,
            1
          )} to be deleted.`,
        },
      ],
    },
  };
  queue.busy = false;
  if (queue.waiting.length > 0) {
    addToSwagger(queue.waiting.shift(), swaggerJSON);
  } else {
    const swaggerFile = path.join(
      __dirname,
      "..",
      "..",
      "docs",
      "swagger.json"
    );

    fs.writeFile(
      `${swaggerFile}`,
      JSON.stringify(swaggerJSON, null, 2),
      (err) => {
        if (!err) {
          console.log(`${swaggerFile} updated successfully!`);
        }
      }
    );
  }
}

// const mySwagger = {
//   swagger: '2.0',
//   info: {
//     description:
//       'This is an auto-generated API to access resources at http://localhost:3000/api',
//     title: 'Restalize API',
//     version: '1.0.0'
//   },
//   host: 'localhost:3000',
//   basePath: '/api',
//   tags: [],
//   schemes: ['http', 'https'],
//   paths: {},
//   definitions: {}
// }

// const entities = [Episode, Title, Page, Creator, Publisher]

// entities.map(e => addToSwagger(e, mySwagger))
