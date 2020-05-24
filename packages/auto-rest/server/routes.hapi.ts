import Hapi from "@hapi/hapi";
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

const routes = function attachRoutes(server: Hapi.Server) {
  /**
   * If you wish to override any of the generated routes with your own implementation,
   * Please insert them before the generated routes, as hapi will try to match the
   * routes from top to bottom
   *
   * e.g.
   *
   * server.route({
   *    method: "GET",
   *    path: "/api/users",
   *    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
   *      h.response({status: "success", data: getUser()}).code(200);
   *    },
   * });
   */

  // serve the swagger UI for trying out the API
  server.route({
    method: "GET",
    path: "/",
    handler: {
      file: `index.html`,
    },
  });

  const createSwagger: boolean = !fs.existsSync(
    `${__dirname}/docs/swagger.json`
  );
  let swaggerJSON: any = null;
  if (createSwagger) {
    swaggerJSON = Object.assign({}, defaultSwagger);
    const packageJSON = require("../package.json");
    swaggerJSON.info.title = packageJSON.name;
    swaggerJSON.info.description = packageJSON.description;
    swaggerJSON.info.version = packageJSON.version;
  }

  // -------- auto-generated generic CRUD routes -----------
  Object.keys(entities).map((e) => {
    const entityApiPath = `/api/${pluralize(e)}`;
    console.log(`Generating api routes for ${e}`);
    console.log(`    - GET ${entityApiPath}`);
    server.route({
      method: "GET",
      path: entityApiPath,
      handler: listEntity(entities[e]),
    });
    console.log(`    - GET ${entityApiPath}/{id}`);
    server.route({
      method: "GET",
      path: `${entityApiPath}/{id}`,
      handler: fetchEntity(entities[e]),
    });
    console.log(`    - POST ${entityApiPath}`);
    server.route({
      method: "POST",
      path: entityApiPath,
      handler: createEntity(entities[e]),
    });
    console.log(`    - PUT ${entityApiPath}`);
    server.route({
      method: "PUT",
      path: entityApiPath,
      handler: updateEntity(entities[e]),
    });
    console.log(`    - PUT ${entityApiPath}/{id}`);
    server.route({
      method: "PUT",
      path: `${entityApiPath}/{id}`,
      handler: updateEntity(entities[e]),
    });
    console.log(`    - DELETE ${entityApiPath}`);
    server.route({
      method: "DELETE",
      path: entityApiPath,
      handler: deleteEntity(entities[e]),
    });
    console.log(`    - DELETE ${entityApiPath}/{id}`);
    server.route({
      method: "DELETE",
      path: `${entityApiPath}/{id}`,
      handler: deleteEntity(entities[e]),
    });
    if (createSwagger) {
      console.log(`Generating Swagger documentation for ${e}`);
      addToSwagger(entities[e], swaggerJSON);
    }
    console.log();
  });

  server.route({
    method: "GET",
    path: "/{filename}",
    handler: {
      file: function (request: Hapi.Request) {
        return request.params.filename;
      },
    },
  });

  return server;
};

export default routes;
