import express from "express";
import pluralize from "pluralize";
import fs from "fs";

import entities from "./lib/entities";
import {
  listEntity,
  fetchEntity,
  createEntity,
  updateEntity,
  deleteEntity,
} from "./lib/controllers/api";
import addToSwagger, { defaultSwagger } from "./lib/utils/add-to-swagger";

const routes = async function attachRoutes(server: express.Express) {
  /**
   * If you wish to override any of the generated routes with your own implementation,
   * Please insert them before the generated routes, as express will try to match the
   * routes from top to bottom
   *
   * e.g.
   *
   * server.get('/api/users', (req, res) => {
   *   res.status(200).send({ status: 'success', data: getUsers() });
   * })
   */

  server.use(express.static(`${__dirname}/docs`));

  // serve the swagger UI for trying out the API
  server.get("/", (_: express.Request, res: express.Response) => {
    res.sendFile(`${__dirname}/docs/index.html`);
  });

  const createSwagger: boolean = !fs.existsSync("./docs/swagger.json");
  let swaggerJSON: any = null;
  if (createSwagger) {
    swaggerJSON = Object.assign({}, defaultSwagger);
    const packageJSON = require("../package.json");
    swaggerJSON.info.title = packageJSON.name;
    swaggerJSON.info.description = packageJSON.description;
    swaggerJSON.info.version = packageJSON.version;
  }

  Object.keys(entities).map(async (e) => {
    const entityApiPath = `/api/${pluralize(e)}`;
    console.log(`Generating api routes for ${e}`);
    console.log(`    - GET ${entityApiPath}`);
    server.get(entityApiPath, listEntity(entities[e]));
    console.log(`    - GET ${entityApiPath}/:id`);
    server.get(`${entityApiPath}/:id(\\d+)`, fetchEntity(entities[e]));
    console.log(`    - POST ${entityApiPath}`);
    server.post(entityApiPath, createEntity(entities[e]));
    console.log(`    - PUT ${entityApiPath}`);
    server.put(entityApiPath, updateEntity(entities[e]));
    console.log(`    - PUT ${entityApiPath}/:id`);
    server.put(`${entityApiPath}/:id(\\d+)`, updateEntity(entities[e]));
    console.log(`    - DELETE ${entityApiPath}`);
    server.delete(entityApiPath, deleteEntity(entities[e]));
    console.log(`    - DELETE ${entityApiPath}/:id`);
    server.delete(`${entityApiPath}/:id(\\d+)`, deleteEntity(entities[e]));
    if (createSwagger) {
      console.log(`Generating Swagger documentation for ${e}`);
      await addToSwagger(entities[e], swaggerJSON);
    }
    console.log();
  });

  return server;
};

export default routes;
