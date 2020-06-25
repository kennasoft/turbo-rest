import Hapi from "@hapi/hapi";
import attachRoutes from "./routes.hapi";
import path from "path";

import "reflect-metadata";

const port = process.env.PORT || 3000;
const start = async () => {
  const server: Hapi.Server = new Hapi.Server({
    host: "localhost",
    port,
    routes: {
      files: {
        relativeTo: path.join(__dirname, "docs"),
      },
    },
  });

  await server.register(require("@hapi/inert"));

  const appServer = await attachRoutes(server);

  await appServer.start();

  console.log(`> Ready on http://localhost:${port}`);
};

start();
