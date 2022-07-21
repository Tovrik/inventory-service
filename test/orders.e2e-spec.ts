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
import { OrderType } from "../src/orders/enums/order-type.enum";
import { Order } from "../src/orders/models/order.model";

describe("Orders (e2e)", () => {
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
  describe("processOrders", () => {
    it.each([
      // [description, variables, assertion callback]
      [
        "should fulfill if enough inventory present for PURCHASE",
        { order: { bookId: 1, type: "PURCHASE", quantity: 3 } },
        (order: Order) => {
          expect(order.fulfilled).toBe(true);
        },
      ],
      [
        "should NOT fulfill if NOT enough inventory present for PURCHASE",
        { order: { bookId: 1, type: "PURCHASE", quantity: 1000 } },
        (order: Order) => {
          expect(order.fulfilled).toBe(false);
        },
      ],
      [
        "should be fulfill if even if not enough inventory present for RESERVE",
        { order: { bookId: 7, type: "RESERVE", quantity: 1000 } },
        (order: Order) => {
          expect(order.fulfilled).toBe(true);
        },
      ],
    ])("%s", async (description, variables, assertion) => {
      const processOrderMutation = `
          mutation ProcessOrder(
            $order: ProcessOrderInput!
          ) {
            processOrder(
              processOrderInput: $order
          ) {
              bookId
              type
              quantity
              fulfilled
            }
          }
        `;

      return request(app.getHttpServer())
        .post("/graphql")
        .send({
          variables: variables,
          query: processOrderMutation,
        })
        .expect((res) => {
          assertion(res.body.data.processOrder);
        })
        .expect(200);
    });
  });
});
