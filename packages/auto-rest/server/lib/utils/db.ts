import { createConnection, Connection, ConnectionOptions } from "typeorm";
import path from "path";

const dbconfig: ConnectionOptions =
  process.env.NODE_ENV === "test"
    ? {
        name: "default",
        type: "sqlite",
        // database: "./petstore_db",
        database: ":memory:",
        synchronize: true,
        logging: false,
        dropSchema: true,
        entities: [
          path.resolve(`${__dirname}/../../../tests/lib/entities/*.ts`),
        ],
      }
    : ({} as ConnectionOptions);

const dbConn: Promise<Connection> = createConnection(dbconfig);

export default dbConn;
