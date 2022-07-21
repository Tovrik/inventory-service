import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { MySqlContainer, StartedMySqlContainer } from "testcontainers";
import * as fs from "fs";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BooksModule } from "../src/books/books.module";
import { AuthorsModule } from "../src/authors/authors.module";
import { OrdersModule } from "../src/orders/orders.module";
import { Book } from "src/books/entities/book.entity";
import { Author } from "src/authors/entities/author.entity";
import { Not } from "typeorm";

describe("Authors (e2e)", () => {
  let app: INestApplication;
  let dbContainer: StartedMySqlContainer;
  jest.setTimeout(30000);

  beforeAll(async () => {
    dbContainer = await new MySqlContainer("mysql:8.0")
      .withRootPassword("password")
      .withDatabase("inventory")
      .withExposedPorts(3306)
      .start();

    await dbContainer.executeQuery(
      fs.readFileSync(`${__dirname}/../baseline.sql`, "utf8")
    );

    // this is pretty awful, but I don't know how to get the container to work with the app module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          debug: true,
          playground: true,
          autoSchemaFile: join(process.cwd(), "src/schema.gql"),
        }),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [".env"],
        }),
        TypeOrmModule.forRoot({
          type: "mysql",
          host: dbContainer.getHost(),
          port: dbContainer.getMappedPort(3306),
          username: "root",
          password: dbContainer.getRootPassword(),
          database: dbContainer.getDatabase(),
          entities: [__dirname + "/../**/*.entity.{js,ts}"],
          synchronize: false,
          logging: false, // flip this to true to make debugging test failures easier
        }),
        BooksModule,
        AuthorsModule,
        OrdersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    app.close();
  });

  describe("searchAuthors", () => {
    it.each([
      // [description, variables, assertion callback]
      [
        'should find all authors with first name "Bob"',
        { firstName: "Bob" },
        (authors: Author[]) => {
          expect(authors.length).toBe(1);
          authors.map((author) => {
            expect(author.firstName).toContain("Bob");
          });
        },
      ],
      [
        'should find all authors with last name "Dylan"',
        { lastName: "Dylan" },
        (authors: Author[]) => {
          expect(authors.length).toBe(1);
          authors.map((author) => {
            expect(author.lastName).toContain("Dylan");
          });
        },
      ],
      [
        "should find all authors with id = 3",
        { id: 3 },
        (authors: Author[]) => {
          expect(authors.length).toBe(1);
          authors.map((author) => {
            expect(author.id).toBe(3);
          });
        },
      ],
    ])("%s", async (description, variables, assertion) => {
      const searchAuthorsQuery = `
          query searchAuthors(
            $id: Int,
            $firstName: String = "",
            $lastName: String = "",
            $skip: Int = 0,
            $take: Int = 10
          ) {
            searchAuthors(
              id: $id,
              firstName: $firstName, 
              lastName: $lastName, 
              skip: $skip,
              take: $take
          ) {
              id
              firstName
              lastName
              books {
                id
                category
                isbn
                inventory
                notes
                price
                priceOverride
                releaseDate
                title
              }
            }
          }
        `;

      return request(app.getHttpServer())
        .post("/graphql")
        .send({
          variables: variables,
          query: searchAuthorsQuery,
        })
        .expect((res) => {
          assertion(res.body.data.searchAuthors);
        })
        .expect(200);
    });
  });

  describe("createAuthors", () => {
    it.each([
      // [description, variables, assertion callback]
      [
        "should create multiple authors",
        {
          authors: [
            { firstName: "First", lastName: "Test" },
            { firstName: "Second", lastName: "Test" },
          ],
        },
        (authors: Author[]) => {
          expect(authors.length).toBe(2);
          expect(authors[0].firstName).toContain("First");
          expect(authors[1].firstName).toContain("Second");
        },
      ],
    ])("%s", async (description, variables, assertion) => {
      const createAuthorsMutation = `
          mutation createAuthors(
            $authors: [CreateAuthorInput!]!
          ) {
            createAuthors(
              createAuthorInputs: $authors
          ) {
              id
              firstName
              lastName
            }
          }
        `;

      return request(app.getHttpServer())
        .post("/graphql")
        .send({
          variables: variables,
          query: createAuthorsMutation,
        })
        .expect((res) => {
          assertion(res.body.data.createAuthors);
        })
        .expect(200);
    });
  });
});
