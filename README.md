# Instructions for consumers
This project contains an automatically generated `schema.gql` file that is effectively the public contract. It was written using the code-first annotations provided by NestJS to generate said schema. You can open a playground (which is the best way to explore the API) if you [run the project in Docker](#running-entirely-in-docker).

In short, there are 3 separate modules involved here. 
1. Book (owned by authors)
2. Author
3. Order

For the Book API:
- `searchBooks`: Used to search for books by id and/or across various fuzzy matched properties (title, isbn, category). Also exposes a pagination mechanism using `skip` and `take` properties.
- `createBook`: Used to create a new book
- `updateBook`: Used to update any properties of an existing book (i.e. `inventory`, `price`, etc)

For the Author API:
- `searchAuthors`: Used to search for authors by id and/or accross various fuzzy matched properties (firstName, lastName). Also exposes a pagination mechanism using `skip` and `take` properties.
- `createAuthor`: Used to create a new author.

For the Order API:
- `processOrder`: Used to submit a single order (i.e. a PURCHASE/RESERVE of a Book for a specific quantity). If fulfilled (enough quantitiy exists for a PURCHASE or the book isn't realeased yet and is therefore eligible for RESERVE) will return a property `fulfilled:true`. If there isn't enough stock, will return `fulfilled:false` 

I kept the queries/mutations available as pretty broad generic search/create/update but new actions could easily be added for more specific actions like `checkStock` if you specifically wanted to know the stock of a book rather than just doing a fetch with `searchBooks`. For the sake of time though, I didn't bother with that right now.

## Installation

```bash
$ npm install
```

## Running the app

### Running locally

```bash
# spin up the database with seeds
$ docker compose -f docker-compose.db.yml up

# run the service on your local machine
$ npm run start:dev
```

You should then be able to go to the GraphQL Playground at http://localhost:3000/graphql


### Running entirely in Docker

```bash
# spin up both the database and the service
$ docker compose -f docker-compose.yml up
```

You should then be able to go to the GraphQL Playground at http://localhost:3000/graphql

## Test
This service doesn't have particularly complicated domain logic so I just tested everything through e2e tests that run through the application as a whole and leverage a database container (using `testcontainers`) to actually allow the service to test writing/reading from a MySQL database.


```bash
# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Things to do
- Mask output errors (left them for now)
- Add a sort/filter ArgsType and combine using IntersectionType to make it so we can control by which property to sort the results and also when providing multiple search fields make it so that the consumer can determine how to aggregate them (currently they are all && together and we don't provide things like less than or equals, they are all just fuzzy match on strings)
- Use a library like dataloader to do nested resolutions
- Probably would actually separate the many-to-many between `Author` and `Book` and instead introduce an entity for the `AuthorsBooks` table so that we could simplify the resolvers.
