# RESTalize v1.0.0

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

For a full description of usage type `npx restalize --help`, to see the below guide in your terminal:

```sh
guide goes here
```
