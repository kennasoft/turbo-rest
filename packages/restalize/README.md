# RESTalize

[![kennasoft](https://circleci.com/gh/kennasoft/restalize.svg?style=shield)](https://app.circleci.com/pipelines/gh/kennasoft/restalize) [![codecov](https://codecov.io/gh/kennasoft/restalize/branch/master/graph/badge.svg)](https://codecov.io/gh/kennasoft/restalize)

Restalize is a robust Code generator that receives a relational database connection as input and creates a node.js-based REST api project in a specified folder.

## Installation

Although you can install the package globally and execute it as a binary, it is recommended that you run it using `npx`

### Global installation

Using `yarn`:

```sh
yarn global add restalize
```

Using `npm`:

```sh
npm install -g restalize
```

## Running Restalize

To generate a new api, you need to invoke the restalize command, passing one required argument (The target project directory path) with other optional flags. You can do this via `npx` or from a global install

### Using npx

```sh
npx restalize my-rest-api
```

### Using global install

```sh
restalize my-rest-api
```

When invoked as above with no flags other than the directory name, the underlying entity generation module, [typeorm-model-generator](https://www.npmjs.com/package/typeorm-model-generator) will prompt you for parameters like database-name, user, password, host, port etc.

For a full description of usage, type `npx restalize --help`, to see the below guide in your terminal:

```sh
Usage: restalize <project-folder> [options]

Options:
  -V, --version                            output the version number
  -l, --lang <language>                    The language you want your generated api in. Options are: [typescript, es2015, esnext] (default: "typescript")
  -h, --host <database-host>               database host from which you want to generate the api. (default: "localhost")
  -p, port <database-port>                 database port to connect to. (default: "3306")
  -d, --database <database-name>           database name to generate entities from.
  -u, --username <database-user>           the database user you want to connect with
  -x, --password <database-user-password>  the password for database user you want to connect with
  --skipTables <list-of-tables-to-skip>    comma-separated list of table names to be excluded
  -e, --engine <database-engine>           database engine to use.
        Options are
          * mysql
          * mssql
          * postgres
          * mariadb
          * oracle
          * sqlite
       (default: "mysql")
  --help                                   display help for command
```
