# Express-Boilerplate

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com)

A boilerplate/template for building RestAPI's using NodeJS, TypeScript, Express

## Installation

#### Install the dependencies

```bash
  npm i
  or
  yarn install
```

#### Setup .env

```
  Create .env file in root folder and Add the following
  PORT=yourChoicePort
  TOKEN_KEY=yourChoiceTokenKey
  MAILER_USER=emailAccount
  MAILER_PASSWORD=emailPassword (this is provided by your email provider if google (try to check App Password))
  DB_HOST=
  DB_PORT=
  DB_USERNAME=
  DB_PASSWORD=
  DB_DATABASE=
```

## Documentation

#### Framework and Libraries

-   [ExpressJS](https://expressjs.com/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Jest](https://jestjs.io/)
-   [Supertest](https://github.com/ladjs/supertest)
-   [CryptoJS](https://cryptojs.gitbook.io/docs/)
-   [NodeMailer](https://nodemailer.com/about/)

## Features

-   JWT Authentication
-   Password encryption using CryptoJS
-   Cron Job
-   Testing: automated testing using Jest
-   Dependency management with NPM
-   Environment variables using cross-env and dotenv
-   CORS
-   Git hooks using hustky and lint-staged
-   Linting using prettier, eslint and tslint
-   Compression using GZIP
-   Middleware HTTP Protection using Helmet
-   Email sender using NodeMailer


#### Steps for creating API

    - Create your own interface in inteface (Folder)
    - Create schemas in models (Folder)
    - Add your services in controller (Folder)

## Commands

#### Run local

```
npm run start
```

#### Test

```
npm run test
```

### Linting

```
npm run lint
```

## Roadmap
-   Logger
