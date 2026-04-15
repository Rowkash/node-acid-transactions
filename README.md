# Transaction API

A modular Node.js backend application demonstrating how to work with financial transactions using **Fastify**, **Drizzle ORM**, **PostgreSQL**, and **Zod**.

The project also includes a data generation endpoint powered by **drizzle-seed** and a **k6** load test that generates transactions between users.

## Tech Stack

* **Node.js** — JavaScript runtime
* **TypeScript** — type-safe development
* **Fastify** — web framework
* **Drizzle ORM** — SQL ORM
* **PostgreSQL** — relational database
* **Zod** — request validation and schemas
* **drizzle-seed** — test data generation
* **k6** — load testing
* **pnpm** — package manager
* **Docker Compose** — PostgreSQL containerization

## Project Overview

The main purpose of this project is to demonstrate transaction processing in a modular Node.js application.

The workflow is:

1. Start PostgreSQL using Docker Compose.
2. Apply the database schema using Drizzle Kit.
3. Generate 1,000 users using `drizzle-seed`.
4. Fetch all generated user IDs.
5. Run the k6 load test.
6. The load test creates transactions between the generated users.

Each transaction contains an idempotency key to prevent duplicate transaction processing.

## Project Structure

The application follows a modular architecture:

```text
src/
├── users/         # Users module (routes, controller, service, schema)
├── transactions/  # Transactions module (routes, controller, service, schema, dto)
├── common/        # Shared core (drizzle.service, exception.filter, config, etc.)
├── app.ts         # Fastify application setup
└── main.ts        # Application entry point
```

### Modules

#### Users

Responsible for user-related functionality, including generating test users and retrieving their IDs.

#### Transactions

Responsible for transaction creation and transaction processing.

#### Common

Contains shared application infrastructure such as:

* Database service
* Configuration service
* HTTP errors
* Global exception handling

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* pnpm/npm
* Docker (not neccessary)
* Docker Compose (not neccessary)

For load testing:

* [k6](https://k6.io/)

### Installation

Clone the repository and install dependencies:

```bash
pnpm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure the required environment variables in `.env`.

## Start PostgreSQL

The project includes a `docker-compose.yml` file for running PostgreSQL.

Start the database (you can skip if you run PostgreSQL without docker):

```bash
docker compose up -d
```

You can check the running containers with:

```bash
docker compose ps
```

## Database Setup

The project uses **Drizzle ORM** and **Drizzle Kit**.

After PostgreSQL is running and the environment variables are configured, push the database schema:

```bash
npx drizzle-kit push
```

This creates/updates the database structure according to the Drizzle schema.

## Running the Application

### Development

Start the application in development mode:

```bash
pnpm dev
```

The application uses `tsx` with environment variables loaded from `.env` and automatically restarts when source files change.

### Type Checking

Run TypeScript type checking in watch mode:

```bash
pnpm type:check
```

### Build

Build the production version:

```bash
pnpm build
```

### Production

After building the application:

```bash
pnpm start:prod
```

### Clean Build

To remove the `dist` directory:

```bash
pnpm clean
```

## Available Scripts

| Script            | Description                                |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Start the application in development mode  |
| `pnpm start:prod` | Start the compiled production application  |
| `pnpm type:check` | Run TypeScript type checking in watch mode |
| `pnpm clean`      | Remove the `dist` directory                |
| `pnpm build`      | Clean and build the production application |

## API

### Create Transaction

```http
POST /transactions
```

Creates a new transaction between two users.

#### Request example

```json
{
  "idempotencyKey": "b205af5e-db4d-4425-97bf-0d86bb091e7e",
  "fromUserId": "00f9c0da-002f-4a3c-a1ee-69d24697d1f5",
  "toUserId": "03c51cd2-2aba-4d2c-08e6-27dd78d49396",
  "amount": "10.50"
}
```

#### Response example

```json
{
  "id": "bda4c7f8-4986-4535-b310-8b5df0b0d7c5",
  "idempotencyKey": "b205af5e-db4d-4425-97bf-0d86bb091e7e",
  "fromUserId": "00f9c0da-002f-4a3c-a1ee-69d24697d1f5",
  "toUserId": "03c51cd2-2aba-4d2c-08e6-27dd78d49396",
  "amount": "10.50",
  "status": "completed",
  "updatedAt": "2026-09-28T18:54:12.507Z",
  "createdAt": "2026-09-28T18:54:12.507Z"
}
```

### Generate Users

```http
POST /users/generate
```

Generates **1,000 users** in the database using `drizzle-seed`.

This endpoint is intended for development and load-testing purposes.

### Get Users

```http
GET /users
```

Returns an array containing the IDs of all generated users.

#### Response example

```json
[
  "00f9c0da-002f-4a3c-a1ee-69d24697d1f5",
  "03c51cd2-2aba-4d2c-08e6-27dd78d49396",
  "..."
]
```

The endpoint returns user IDs only, rather than complete user objects. These IDs are used by the k6 load test to create transactions.

## Idempotency

Transaction creation uses an `idempotencyKey`.

The key is unique for each transaction request and allows the application to identify duplicate requests.

Example:

```json
{
  "idempotencyKey": "b205af5e-db4d-4425-97bf-0d86bb091e7e"
}
```

The database enforces uniqueness for the idempotency key, providing an additional layer of protection against duplicate transactions.

## Load Testing

The project contains a `load-test.js` file with instructions and the k6 load-testing scenario.

### Install k6

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) according to the instructions for your operating system.

Verify the installation:

```bash
k6 version
```

### Running the Load Test

The `load-test.js` file contains the configuration and instructions required to run the test.

The test workflow is:

```text
GET /users
        │
        ▼
Receive user IDs
        │
        ▼
Create transactions
        │
        ▼
POST /transactions
```

The test uses the generated user IDs to create transactions between users and can be used to evaluate transaction processing under load.

Refer to the comments and instructions inside `load-test.js` for the exact command and configuration.

## Typical Setup Flow

A typical local setup looks like this:

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL connection settings.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Apply the database schema

```bash
npx drizzle-kit push
```

### 5. Start the API

```bash
pnpm dev
```

### 6. Generate test users

```http
POST /users/generate
```

This creates 1,000 users.

### 7. Verify generated users

```http
GET /users
```

The response contains the generated user IDs.

### 8. Run the load test

Install k6 and follow the instructions in:

```text
load-test.js
```

The load test retrieves the user IDs and then creates transactions between them.

## Environment Variables

The project includes an environment variable template:

```text
.env.example
```

Create a local `.env` file from this template:

```bash
cp .env.example .env
```

Make sure the PostgreSQL connection settings match the database running through Docker Compose.

## Purpose

This project is primarily an example application for demonstrating transaction processing with Node.js.

The included load-testing workflow makes it possible to:

* generate a controlled set of test users;
* retrieve their IDs;
* create a large number of transactions;
* test transaction processing under load;
* work with PostgreSQL transactions through Drizzle ORM;
* validate API input with Zod;
* handle duplicate requests using idempotency keys.
