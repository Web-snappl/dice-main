# NestJS & React Monorepo Template

This project is a monorepo template using **pnpm** workspaces and **Turborepo** to manage a **NestJS** backend and a **React** frontend. It's designed to streamline development, building, and deployment processes for full-stack applications.

---

## 🚀 Getting Started

To get the project up and running, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone [your-repo-url]
    cd [your-repo-name]
    ```

2.  **Install dependencies**:
    This project uses **pnpm** as its package manager, which is a faster and more efficient alternative to npm or yarn, especially in monorepos. If you don't have it installed, you can get it with npm:
    ```bash
    npm install -g pnpm
    ```
    Once pnpm is installed, run the following command to install all project dependencies:
    ```bash
    pnpm install
    ```

3.  **Set up environment variables**:
    Both the `api` (NestJS) and `client` (React) apps may require their own `.env` files. Check the respective project directories (`apps/api` and `apps/client`) for `.env.example` files and create your own `.env` files based on them.

---

## 💻 Development

Use these commands to manage the project during development:

* **`pnpm dev`**: Starts both the NestJS backend and the React frontend in development mode with hot-reloading. This is the primary command for local development.
* **`pnpm build`**: Builds all apps in the monorepo for production. Turborepo handles the caching and parallelism, making subsequent builds faster.
* **`pnpm lint`**: Runs linting across all projects to ensure code quality and consistency.
* **`pnpm test`**: Runs tests for all projects.

---

## 🛠️ Scripts & Commands

This section details the most useful scripts defined in `package.json`.

### Build & Serve

* **`pnpm build:prod`**: Builds the `client` and `api` projects for production. This command is often used before deployment.
* **`pnpm start`**: Starts the production-ready NestJS backend. This should be run after `pnpm build:prod`.
* **`pnpm serve:client`**: Serves the production-ready React frontend.
* **`pnpm preview:full`**: A convenience script that first builds both projects and then starts both the production NestJS server and the React client simultaneously.

### Database & Prisma

This template includes a full suite of **Prisma** commands for database management. These commands are run specifically on the `api` project.

* **`pnpm prisma:generate`**: Generates Prisma Client based on your `schema.prisma`.
* **`pnpm prisma:push`**: Pushes the Prisma schema to the database without creating a migration. Useful for rapid prototyping.
* **`pnpm prisma:migrate`**: Creates a new migration and applies it to the database.
* **`pnpm prisma:migrate:deploy`**: Applies pending migrations to the database. Use this in production environments.
* **`pnpm prisma:studio`**: Starts Prisma Studio, a visual editor for your database.
* **`pnpm prisma:seed`**: Runs the seed script to populate your database.

---

## 📦 Monorepo Structure

The project is structured into a `apps` and `packages` directory.

* `apps/` - This directory contains the main applications.
    * `api`: The **NestJS** backend.
    * `client`: The **React** frontend.
* `packages/` - This directory contains shared code and utilities, such as UI components or utility functions.



---

## 🔑 Key Technologies

* **Turborepo**: A high-performance build system for JavaScript and TypeScript monorepos. It leverages caching and parallel execution to speed up your build and test pipelines.
* **pnpm**: A fast and efficient package manager.
* **NestJS**: A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
* **React**: A popular JavaScript library for building user interfaces.
* **Prisma**: A next-generation ORM for Node.js and TypeScript.