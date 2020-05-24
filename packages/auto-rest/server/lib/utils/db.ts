import { createConnection, Connection } from "typeorm";

const dbConn: Promise<Connection> = createConnection();

export default dbConn;
