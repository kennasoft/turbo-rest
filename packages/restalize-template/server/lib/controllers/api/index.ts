import express from "express";
import ModelFetcher from "../../entities/managers/fetcher";
import ModelUpdater from "../../entities/managers/updater";

function handleError(err: Error, res: express.Response) {
  console.log(err);
  return res.status(500).send({ status: "error", message: err.message });
}

export function listEntity<Entity>(type: {
  new (init?: Partial<Entity>): Entity;
}): express.Handler {
  return async function handleRequest(
    req: express.Request,
    res: express.Response
  ) {
    const query = req.query;
    const fetcher = new ModelFetcher(type);
    try {
      const data = await fetcher.list(query);
      return res.status(200).send({ status: "success", data });
    } catch (err) {
      return handleError(err, res);
    }
  };
}

export function fetchEntity<Entity>(type: {
  new (init?: Partial<Entity>): Entity;
}): express.Handler {
  return async function handleRequest(
    req: express.Request,
    res: express.Response
  ) {
    const query = req.query;
    query.id = req.params.id;
    const fetcher = new ModelFetcher(type);
    try {
      const data = await fetcher.fetch(query);
      if (data) {
        return res.status(data ? 200 : 404).send({ status: "success", data });
      } else {
        return res.status(404).send({
          status: "error",
          message: `${type.name} with id = ${query.id} not found`,
        });
      }
    } catch (err) {
      return handleError(err, res);
    }
  };
}

export function createEntity<Entity>(type: {
  new (init?: Partial<Entity>): Entity;
}): express.Handler {
  return async function handleRequest(
    req: express.Request,
    res: express.Response
  ) {
    const body = req.body;
    const updater = new ModelUpdater(type);
    try {
      return res
        .status(200)
        .send({ status: "success", data: await updater.insert(body) });
    } catch (err) {
      return handleError(err, res);
    }
  };
}

export function updateEntity<Entity>(type: {
  new (init?: Partial<Entity>): Entity;
}): express.Handler {
  return async function handleRequest(
    req: express.Request,
    res: express.Response
  ) {
    const { updateFields, condition } = req.body;
    const updater = new ModelUpdater(type);
    try {
      const rowsAffected = await updater.update(updateFields, condition);
      console.log(rowsAffected);
      if (rowsAffected) {
        return res.status(200).send({
          status: "success",
          data: {
            rowsAffected,
          },
        });
      } else {
        return res
          .status(417)
          .send({ status: "error", message: "record not modified" });
      }
    } catch (err) {
      return handleError(err, res);
    }
  };
}

export function deleteEntity<Entity>(type: {
  new (init?: Partial<Entity>): Entity;
}): express.Handler {
  return async function handleRequest(
    req: express.Request,
    res: express.Response
  ) {
    const query = req.query;
    const updater = new ModelUpdater(type);
    try {
      const rowsAffected = await updater.delete(query);
      if (rowsAffected) {
        return res.status(200).send({
          status: "success",
          data: { rowsAffected },
        });
      } else {
        return res
          .status(404)
          .send({ status: "error", message: `record not deleted` });
      }
    } catch (err) {
      return handleError(err, res);
    }
  };
}
