import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersResolver } from "./orders.resolver";
import { BooksModule } from "../books/books.module";

@Module({
  imports: [BooksModule],
  providers: [OrdersResolver, OrdersService],
})
export class OrdersModule {}
