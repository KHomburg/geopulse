## Project visions:
Building a location-centric visual social app (let’s call it "GeoPulse") requires a delicate balance between the high-engagement "scroll" of Instagram and the hyper-local anonymity of Jodel.
To help Claude (or any AI) build this effectively, you need to provide a clear hierarchy of "The Three Pillars": Discovery (The Map), Engagement (The Feed), and Privacy (The Shield).

## core requirements
- high fidelity, mobile first visual design
- a web app which is provided to the mobile experience via a PWA
- intuitive navigation
- high data security standards - no cross user data retrievel
- each table that contains user related data contains a column `userId` to indicate the owner of that dataset
- generally recommended, state-of-the-art security standards for api and data security
- all libraries that will be used, should be free for commercial use

## basic technical requirements
- usage of `any` should be prevented as much as possible

## backend standards
Domain driven design with the following core module structur inside the modules folder:
/sampleModule
  ├─ sample.controller.ts
  ├─ sample.controller.test.ts => large units of business logic and whole workflows
  ├─ sample.service.test.ts
  ├─ sample.service.ts => small units of business logic
  ├─ sample.repository.test.ts
  ├─ sample.repository.ts => single purpose DB interaction functions
  ├─ sample.routes.ts => usable routes that are provided to the express router
  ├─ sample.routes.test.ts
  ├─ sample.utils.test.ts
  ├─ sample.utils.ts => small single purpose helper functions
  ├─ sample.schemas.ts => validators for bodies/objects/json data. use zod

to ensure to not run into circular dependency issues, to module use a layered approached:
- repository: contains single purpose DB interaction function. Has no dependency to resources outside of the module
- service: contains units of business logic assembled from functions from repositories and utils. cannot import other services or controller
- controllers: contain whole workflows to fullfill the requirements for a specific use cases and larger units of business logic. cannot access other controllers

## API standards
- versioning (/api/v1)
- as needed, multiple different APIs for endusers, customer support managers/ sysadmin (i.e. /api/v1/...; /cs/...; /sysadmin/...)
- as close as possible to REST standards

## Frontend standards
- state-of-the-art react setup
- Zustand for state management
- should build upon an existing component library (free for commercial use) and implement its own design system
- No dependency to tailwind

## testing
- create seeds for demos and testing, that will be adjusted at each step where the db structure changes
- make use of extensive test setup with minimal mocking
- for testing database transaction, the testing suit uses a an sqlite setup, to run tests against an actual database and seed extensive test data to emulate real production-like circumstances
- for routes, there will be extensive integrations testing that will ensure, that routes are hit with various inputs, validatiing that data is correctly written to, and retreived from the database

## development and documentation
- for rapid prototyping and development use a sqlite database
- for every deveopment step and every feature progress there should be a markdown file in the documentation folder with timestamp in the name, documenting what has be done and summarizing the ai conversation session
- repeatadly go back to what already has been done - review it and improve iteratively