import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "path";
import { BooksModule } from "./books/books.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { AuthorsModule } from "./authors/authors.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
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
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ["dist/**/*.entity.js"],
      synchronize: false,
      logging: true,
    }),
    BooksModule,
    AuthorsModule,
    OrdersModule,
  ],
})
export class AppModule {}
