# RESTalize Monorepo

[![kennasoft](https://circleci.com/gh/kennasoft/restalize.svg?style=shield)](https://app.circleci.com/pipelines/gh/kennasoft/restalize) [![codecov](https://codecov.io/gh/kennasoft/restalize/branch/master/graph/badge.svg)](https://codecov.io/gh/kennasoft/restalize)

This is a monorepo that houses 2 projects

- [restalize](packages/restalize/README.md) [![codecov](https://codecov.io/gh/kennasoft/restalize/branch/master/graph/badge.svg?flag=main)](https://codecov.io/gh/kennasoft/restalize)
- [restalize-template](packages/restalize-template/README.md) [![codecov](https://codecov.io/gh/kennasoft/restalize/branch/master/graph/badge.svg?flag=template)](https://codecov.io/gh/kennasoft/restalize)

[restalize](packages/restalize/README.md) uses [restalize-template](packages/restalize-template/README.md) as a dependency, and in order to easily test both and keep dependencies in sync, they have to reside in the same monorepo.

This monorepo offers a bunch of scripts:

| script        | description                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| clean         | run `yarn clean` in all packages                                                                 |
| bootstrap     | run `lerna bootstrap` to build and update dependency symlinks in all packages                    |
| test          | run `yarn test`                                                                                  |
| build         | run `yarn build` in all packages                                                                 |
| build-t       | run `yarn build` in only the [restalize-template](packages/restalize-template/README.md) package |
| build-r       | run `yarn build` in only the [restalize](packages/restalize/README.md) package                   |
| deploy        | run `yarn deploy` in all packages                                                                |
| version:patch | run `yarn version --patch` in all packages, to increment their patch semantic version number     |
| version:minor | run `yarn version --minor` in all packages, to increment their minor semantic version number     |
| version:major | run `yarn version --major` in all packages, to increment their major semantic version number     |
| dev-r         | run `yarn dev` in the [restalize](packages/restalize/README.md) package                          |
| dev-t         | run `yarn dev` in the [restalize-template](packages/restalize-template/README.md) package        |
