import express from "express";
import pluralize from "pluralize";
import entities from "./lib/entities";
import {
  listEntity,
  fetchEntity,
  createEntity,
  updateEntity,
  deleteEntity,
} from "./lib/route-handlers/api";

const routes = function attachRoutes(server: express.Express) {
  Object.keys(entities).map((e) => {
    const entityApiPath = `/api/${pluralize(e.toLowerCase())}`;
    server.get(entityApiPath, listEntity(entities[e]));
    server.get(`${entityApiPath}/:id(\\d+)`, fetchEntity(entities[e]));
    server.post(entityApiPath, createEntity(entities[e]));
    server.put(entityApiPath, updateEntity(entities[e]));
    server.delete(entityApiPath, deleteEntity(entities[e]));
  });

  return server;
};

export default routes;
