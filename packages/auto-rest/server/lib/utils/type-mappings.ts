export const floatTypes = [
  "float", // mysql, mssql, oracle, sqlite
  "double", // mysql, sqlite
  "dec", // oracle, mssql, mysql
  "decimal", // mysql, postgres, mssql, sqlite
  "smalldecimal", // sap
  "fixed", // mysql
  "numeric", // postgres, mssql, sqlite, mysql
  "real", // mysql, postgres, mssql, oracle, sqlite, cockroachdb, sap
  "double precision", // postgres, oracle, sqlite, mysql, cockroachdb
  "number", // oracle
];

export const intTypes = [
  "int", // mysql, mssql, oracle, sqlite, sap
  "int2", // postgres, sqlite, cockroachdb
  "int4", // postgres, cockroachdb
  "int8", // postgres, sqlite, cockroachdb
  "integer", // postgres, oracle, sqlite, mysql, cockroachdb, sap
  "tinyint", // mysql, mssql, sqlite, sap
  "smallint", // mysql, postgres, mssql, oracle, sqlite, cockroachdb, sap
  "mediumint", // mysql, sqlite
  "bigint", // mysql, postgres, mssql, sqlite, cockroachdb, sap
  "dec", // oracle, mssql, sap
  "decimal", // mysql, postgres, mssql, sqlite, sap
  "smalldecimal", // sap
  "fixed", // mysql
  "numeric", // postgres, mssql, sqlite
  "number", // oracle
];

export const stringTypes = [
  "character varying", // postgres, cockroachdb
  "varying character", // sqlite
  "char varying", // cockroachdb
  "nvarchar", // mssql, mysql
  "national varchar", // mysql
  "character", // mysql, postgres, sqlite, cockroachdb
  "native character", // sqlite
  "varchar", // mysql, postgres, mssql, sqlite, cockroachdb
  "char", // mysql, postgres, mssql, oracle, cockroachdb, sap
  "nchar", // mssql, oracle, sqlite, mysql, sap
  "national char", // mysql
  "varchar2", // oracle
  "nvarchar2", // oracle, sqlite
  "alphanum", // sap
  "shorttext", // sap
  "raw", // oracle
  "binary", // mssql
  "varbinary", // mssql, sap
  "string", // cockroachdb
  "enum", // mysql
  "tinyblob", // mysql
  "tinytext", // mysql
  "mediumblob", // mysql
  "mediumtext", // mysql
  "blob", // mysql, oracle, sqlite, cockroachdb, sap
  "text", // mysql, postgres, mssql, sqlite, cockroachdb, sap
  "ntext", // mssql
  "citext", // postgres
  "hstore", // postgres
  "longblob", // mysql
  "longtext", // mysql
  "alphanum", // sap
  "shorttext", // sap
  "bytes", // cockroachdb
  "bytea", // postgres, cockroachdb
  "long", // oracle
  "raw", // oracle
  "long raw", // oracle
  "bfile", // oracle
  "clob", // oracle, sqlite, sap
  "nclob", // oracle, sap
  "image", // mssql
];

export const dateTypes = [
  "timetz", // postgres
  "timestamptz", // postgres, cockroachdb
  "timestamp with local time zone", // oracle
  "smalldatetime", // mssql
  "date", // mysql, postgres, mssql, oracle, sqlite
  "interval year to month", // oracle
  "interval day to second", // oracle
  "interval", // postgres, cockroachdb
  "year", // mysql
  "seconddate", // sap
  "datetime", // mssql, mysql, sqlite
  "datetime2", // mssql
  "datetimeoffset", // mssql
  "time", // mysql, postgres, mssql, cockroachdb
  "time with time zone", // postgres, cockroachdb
  "time without time zone", // postgres
  "timestamp", // mysql, postgres, mssql, oracle, cockroachdb
  "timestamp without time zone", // postgres, cockroachdb
  "timestamp with time zone", // postgres, oracle, cockroachdb
  "timestamp with local time zone", // oracle
];

export const mapSQLTypeToSwagger = (type: string): string[] => {
  let swaggerType = "string";
  let example = "unknown type";
  if (stringTypes.includes(type)) {
    swaggerType = "string";
    example = "This is a string value";
  } else if (floatTypes.includes(type)) {
    swaggerType = "float";
    example = `${Math.random() * 10}`;
    // @ts-ignore because auto-generated id columns return a js Number type
  } else if (intTypes.includes(type) || type === Number) {
    swaggerType = "integer";
    example = `${Math.ceil(Math.random() * 100)}`;
  } else if (dateTypes.includes(type)) {
    swaggerType = "string";
    example = `${new Date().toISOString().substring(0, 19).replace("T", " ")}`;
  } else {
    console.log(`Unknown Type: ${type.toString()}`);
  }

  return [swaggerType, example];
};
