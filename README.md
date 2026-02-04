[![Express JS](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)]()
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)]()
[![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=React_Query&logoColor=white)]()
[![TS Node](https://img.shields.io/badge/ts--node-3178C6?style=for-the-badge&logo=ts-node&logoColor=white)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()
[![Typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()


# Installation
Create a `.env` file in the project directory (apps/api and apps/dashoard) with your environment variables. You can copy the contents of the `.env.example` file and replace the values  with your own. <br /> <br />
Install dependencies by running the command in the terminal (root folder)
```
npm install
```

Run the following command in the root directory to start the application
```
npm run dev
```

create a db
```bash
docker run --name <your-app-name>  -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=<your-app-name> -d postgres
```

docker run --name <your_app_name>  -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=melo_app -d postgres

# Build

To build a production-ready version of your application, run the command in the terminal (root folder):

```
npm run build
```


# Framework / Libraries
This project uses the following frameworks and libraries:

 - [🚀 Turborepo](https://turbo.build/repo) - A build tool for a mono repo that is optimized for JavaScript and TypeScript codebases1
 - [⚛️ React](https://react.dev/) - a free and open-source front-end JavaScript library for building user interfaces based on UI components.
 - [🌐 Express JS](https://expressjs.com/) - A popular web application framework for Node.js, a JavaScript runtime environment that allows server-side JavaScript execution.
 - [🔍 React Query](https://tanstack.com/query/v4/docs/react/adapters/react-query) - A JavaScript library for managing and synchronizing server state in React applications.
 - [🎨 Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework that provides a set of pre-designed utility classes to quickly build user interfaces.
 - [📚 Typescript](https://www.typescriptlang.org/) - A strongly-typed superset of JavaScript that adds static typing and other features to the language.
 - [🐻 Zustand](https://github.com/pmndrs/zustand) - A state management library for React applications.
