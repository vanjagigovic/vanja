## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.
NestJS backend for the calendar APP, using PostgreSQL and Drizzle ORM.

## Stack

- NestJS
- PostgreSQL
- Drizzle ORM
- class-validator / class-transform

## Project setup

```bash
$ npm install
```

## Features
- `GET /events`
- `GET /events/:id`
- `POST /events`
- `PATCH /events/:id`
- `DELETE /events:id`
- overlap prevention or create/update
- UTC persistence with explicit event `timezone`

## Enviroment
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
PORT=3001
```

## Compile and run the project

```bash
$ npm run start:dev
```

## Run tests

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## DB
Generate or apply schema with Drizzle 
```bash
$ npm run drizzle: generate
$ npm run drizzle:push
```

