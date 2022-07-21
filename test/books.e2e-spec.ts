import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
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

describe("Books (e2e)", () => {
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
  describe("searchBooks", () => {
    it.each([
      // [description, variables, assertion callback]
      [
        "should return book with id 3",
        { id: 3 },
        (books: Book[]) => {
          expect(books.length).toBe(1);
          books.map((book) => {
            expect(book.id).toBe(3);
          });
        },
      ],
      [
        'should return all books containing title with "The"',
        { title: "The" },
        (books: Book[]) => {
          expect(books.length).toBe(2);
          books.map((book) => {
            expect(book.title).toContain("The");
          });
        },
      ],
      [
        'should return all books with isbn containing "374"',
        { isbn: "374" },
        (books: Book[]) => {
          expect(books.length).toBe(2);
          books.map((book) => {
            expect(book.isbn).toContain("374");
          });
        },
      ],
      [
        'should return all books with category "nonfiction"',
        { category: "nonfiction" },
        (books: Book[]) => {
          expect(books.length).toBe(3);
          books.map((book) => {
            expect(book.category).toEqual("nonfiction");
          });
        },
      ],
      [
        'should return only 1 books (using take)"',
        { skip: 0, take: 1 },
        (books: Book[]) => {
          expect(books.length).toBe(1);
        },
      ],
      [
        'should return 0 books (using skip)"',
        { skip: 100 },
        (books: Book[]) => {
          expect(books.length).toBe(0);
        },
      ],
      [
        "should return the authors for the books",
        {},
        (books: Book[]) => {
          books.map((book) => {
            expect(book.authors.length).toBeGreaterThan(0);
          });
        },
      ],
    ])("%s", async (description, variables, assertion) => {
      const searchBooksQuery = `
          query SearchBooks(
            $title: String = "",
            $isbn: String = "",
            $category: String = "",
            $id: Int,
            $skip: Int = 0,
            $take: Int = 10
          ) {
            searchBooks(
              title: $title, 
              isbn: $isbn, 
              category: $category, 
              id: $id
              skip: $skip,
              take: $take
          ) {
              id
              category
              isbn
              inventory
              notes
              title
              authors {
                id
                firstName
                lastName
              }
            }
          }
        `;

      return request(app.getHttpServer())
        .post("/graphql")
        .send({
          variables: variables,
          query: searchBooksQuery,
        })
        .expect((res) => {
          assertion(res.body.data.searchBooks);
        })
        .expect(200);
    });
  });

  describe("createBook", () => {
    const createBookMutation = `
          mutation createBook(
            $book: CreateBookInput!
          ) {
            createBook(
              createBookInput: $book
          ) {
              id
              category
              isbn
              inventory
              notes
              price
              priceOverride
              releaseDate
              title
              authors {
                id
                firstName
                lastName
              }
            }
          }
        `;

    it.each([
      // [description, variables, assertion callback]
      [
        "should create a book",
        {
          book: {
            title: "The Book",
            isbn: "123",
            category: "nonfiction",
            inventory: 10,
            price: 12.99,
            releaseDate: "2021-01-21",
            notes: "This is a note",
            authorIds: [1],
          },
        },
        (res: any) => {
          const book = res.body.data.createBook;
          expect(book.title).toBe("The Book");
          expect(book.isbn).toBe("123");
          expect(book.category).toBe("nonfiction");
          expect(book.inventory).toBe(10);
          expect(book.notes).toBe("This is a note");
          expect(book.price).toBe(12.99);
          expect(book.releaseDate).toBe("2021-01-21T00:00:00.000Z");
          expect(book.authors.length).toBe(1);
          expect(book.authors[0].id).toBe(1);
          expect(book.authors[0].firstName).toBe("Jaideva");
          expect(book.authors[0].lastName).toBe("Goswami");
        },
      ],
      [
        "should return an error if the isbn already exists",
        {
          book: {
            title: "FOO",
            isbn: "123",
            category: "nonfiction",
            inventory: 10,
            price: 12.99,
            releaseDate: "2021-01-21",
            notes: "This is a note",
            authorIds: [1],
          },
        },
        (res: any) => {
          console.dir(res.body);
          expect(res.body.errors.length).toBeGreaterThan(0);
        },
      ],
    ])("%s", async (description, variables, assertion) => {
      return request(app.getHttpServer())
        .post("/graphql")
        .send({
          variables: variables,
          query: createBookMutation,
        })
        .expect((res) => {
          assertion(res);
        })
        .expect(200);
    });

    it("should link to an author that already exists", async () => {
      return request(app.getHttpServer())
        .post("/graphql")
        .send({
          variables: {
            book: {
              title: "The Book, Part 2",
              isbn: "987654321",
              category: "nonfiction",
              inventory: 10,
              price: 12.99,
              releaseDate: "2021-01-21",
              notes: "This is a note",
              authorIds: [1],
            },
          },
          query: createBookMutation,
        })
        .expect((res) => {
          let book = res.body.data.createBook;
          expect(book.authors.length).toBe(1);
          expect(book.authors[0].id).toBe(1);
        })
        .expect(200);
    });

    describe("updateBook", () => {
      it.each([
        // [description, variables, assertion callback]
        [
          "should update the Title of a book",
          { book: { title: "The Book", id: 1 } },
          (res: any) => {
            const book = res.body.data.updateBook;
            expect(book.title).toBe("The Book");
            expect(book.isbn).toBe("3726362789");
            expect(book.category).toBe("nonfiction");
            expect(book.inventory).toBe(9);
            expect(book.notes).toBeNull();
            expect(book.price).toBe(6.49);
            expect(book.releaseDate).toBe("2019-02-16T08:00:00.000Z");
            expect(book.authors.length).toBe(1);
            expect(book.authors[0].firstName).toBe("Jaideva");
            expect(book.authors[0].lastName).toBe("Goswami");
            expect(res.status).toBe(200);
          },
        ],
        [
          "should update the ISBN of a book",
          { book: { isbn: "999999", id: 1 } },
          (res: any) => {
            const book = res.body.data.updateBook;
            expect(book.title).toBe("The Book");
            expect(book.isbn).toBe("999999");
            expect(book.category).toBe("nonfiction");
            expect(book.inventory).toBe(9);
            expect(book.notes).toBeNull();
            expect(book.price).toBe(6.49);
            expect(book.releaseDate).toBe("2019-02-16T08:00:00.000Z");
            expect(book.authors.length).toBe(1);
            expect(book.authors[0].firstName).toBe("Jaideva");
            expect(book.authors[0].lastName).toBe("Goswami");
            expect(res.status).toBe(200);
          },
        ],
        [
          "should update the category of a book",
          { book: { category: "fakeCategory", id: 1 } },
          (res: any) => {
            const book = res.body.data.updateBook;
            expect(book.title).toBe("The Book");
            expect(book.isbn).toBe("999999");
            expect(book.category).toBe("fakeCategory");
            expect(book.inventory).toBe(9);
            expect(book.notes).toBeNull();
            expect(book.price).toBe(6.49);
            expect(book.releaseDate).toBe("2019-02-16T08:00:00.000Z");
            expect(book.authors.length).toBe(1);
            expect(book.authors[0].firstName).toBe("Jaideva");
            expect(book.authors[0].lastName).toBe("Goswami");
            expect(res.status).toBe(200);
          },
        ],
        [
          "should update the inventory of a book",
          { book: { inventory: 99, id: 1 } },
          (res: any) => {
            const book = res.body.data.updateBook;
            expect(book.title).toBe("The Book");
            expect(book.isbn).toBe("999999");
            expect(book.category).toBe("fakeCategory");
            expect(book.inventory).toBe(99);
            expect(book.notes).toBeNull();
            expect(book.price).toBe(6.49);
            expect(book.releaseDate).toBe("2019-02-16T08:00:00.000Z");
            expect(book.authors.length).toBe(1);
            expect(book.authors[0].firstName).toBe("Jaideva");
            expect(book.authors[0].lastName).toBe("Goswami");
            expect(res.status).toBe(200);
          },
        ],
        [
          "should update the price of a book",
          { book: { price: 0.99, id: 1 } },
          (res: any) => {
            const book = res.body.data.updateBook;
            expect(book.title).toBe("The Book");
            expect(book.isbn).toBe("999999");
            expect(book.category).toBe("fakeCategory");
            expect(book.inventory).toBe(99);
            expect(book.notes).toBeNull();
            expect(book.price).toBe(0.99);
            expect(book.priceOverride).toBeNull();
            expect(book.releaseDate).toBe("2019-02-16T08:00:00.000Z");
            expect(book.authors.length).toBe(1);
            expect(book.authors[0].firstName).toBe("Jaideva");
            expect(book.authors[0].lastName).toBe("Goswami");
            expect(res.status).toBe(200);
          },
        ],
        [
          "should update the priceOverride of a book",
          { book: { priceOverride: 0.49, id: 1 } },
          (res: any) => {
            const book = res.body.data.updateBook;
            expect(book.title).toBe("The Book");
            expect(book.isbn).toBe("999999");
            expect(book.category).toBe("fakeCategory");
            expect(book.inventory).toBe(99);
            expect(book.notes).toBeNull();
            expect(book.price).toBe(0.99);
            expect(book.priceOverride).toBe(0.49);
            expect(book.releaseDate).toBe("2019-02-16T08:00:00.000Z");
            expect(book.authors.length).toBe(1);
            expect(book.authors[0].firstName).toBe("Jaideva");
            expect(book.authors[0].lastName).toBe("Goswami");
            expect(res.status).toBe(200);
          },
        ],
        [
          "should not find a book to update",
          { book: { title: "10 Secrets for How Not To Fail", id: 99999 } },
          (res: any) => {
            expect(res.body.errors.length).toBeGreaterThan(0);
          },
        ],
      ])("%s", async (description, variables, assertion) => {
        const updateBookMutation = `
          mutation updateBook(
            $book: UpdateBookInput!
          ) {
            updateBook(
              updateBookInput: $book
          ) {
              id
              category
              isbn
              inventory
              notes
              price
              priceOverride
              releaseDate
              title
              authors {
                id
                firstName
                lastName
              }
            }
          }
        `;

        return request(app.getHttpServer())
          .post("/graphql")
          .send({
            variables: variables,
            query: updateBookMutation,
          })
          .expect((res) => {
            assertion(res);
          });
      });
    });
  });
});
