import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import attachRoutes from "./routes";

import "reflect-metadata";

const port = process.env.PORT || 3000;

const server: express.Express = express();
//attach middleware
server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

const appServer = attachRoutes(server);

appServer.listen(port, () => {
  // if (err) throw err
  console.log(`> Ready on http://localhost:${port}`);
});
