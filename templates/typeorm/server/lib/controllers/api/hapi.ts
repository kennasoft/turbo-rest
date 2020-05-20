import Hapi from "@hapi/hapi";
import { ObjectType } from "typeorm";
import ModelFetcher from "../../entities/managers/fetcher";
import ModelUpdater from "../../entities/managers/updater";

function handleError(err: Error, h: Hapi.ResponseToolkit) {
  console.log(err);
  return h.response({ status: "error", message: err.message }).code(500);
}

export function listEntity<Entity>(type: ObjectType<Entity>) {
  return async function handleRequest(
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) {
    const query = request.query;
    const fetcher = new ModelFetcher(type);
    try {
      const data = await fetcher.list(query);
      return h.response({ status: "success", data }).code(200);
    } catch (err) {
      return handleError(err, h);
    }
  };
}

export function fetchEntity<Entity>(type: ObjectType<Entity>) {
  return async function handleRequest(
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) {
    const query = request.query;
    query.id = request.params.id;
    const fetcher = new ModelFetcher(type);
    try {
      const data = await fetcher.fetch(query);
      if (data) {
        return h.response({ status: "success", data }).code(data ? 200 : 404);
      } else {
        return h
          .response({
            status: "error",
            message: `${type.name} with id = ${query.id} not found`,
          })
          .code(404);
      }
    } catch (err) {
      return handleError(err, h);
    }
  };
}

export function createEntity<Entity>(type: ObjectType<Entity>) {
  return async function handleRequest(
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) {
    const body = JSON.parse(request.payload as string);
    const updater = new ModelUpdater(type);
    try {
      return h
        .response({ status: "success", data: await updater.insert(body) })
        .code(200);
    } catch (err) {
      return handleError(err, h);
    }
  };
}

export function updateEntity<Entity>(type: ObjectType<Entity>) {
  return async function handleRequest(
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) {
    const { updateFields, condition } = JSON.parse(request.payload as string);
    const updater = new ModelUpdater(type);
    try {
      const rowsAffected = await updater.update(updateFields, condition);
      console.log(rowsAffected);
      if (rowsAffected) {
        return h
          .response({
            status: "success",
            data: {
              rowsAffected,
            },
          })
          .code(200);
      } else {
        return h
          .response({ status: "error", message: "record not modified" })
          .code(417);
      }
    } catch (err) {
      return handleError(err, h);
    }
  };
}

export function deleteEntity<Entity>(type: ObjectType<Entity>) {
  return async function handleRequest(
    request: Hapi.Request,
    h: Hapi.ResponseToolkit
  ) {
    const query = request.query;
    const updater = new ModelUpdater(type);
    try {
      const rowsAffected = await updater.delete(query);
      if (rowsAffected) {
        return h
          .response({
            status: "success",
            data: { rowsAffected },
          })
          .code(200);
      } else {
        return h
          .response({ status: "error", message: `record not deleted` })
          .code(404);
      }
    } catch (err) {
      return handleError(err, h);
    }
  };
}
