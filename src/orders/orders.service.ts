import { Inject, Injectable } from "@nestjs/common";
import { BooksService } from "../books/books.service";
import { Book } from "../books/entities/book.entity";
import { ProcessOrderInput } from "./dto/process-order.input";
import { OrderType } from "./enums/order-type.enum";
import { Order } from "./models/order.model";

@Injectable()
export class OrdersService {
  constructor(
    @Inject(BooksService)
    private readonly booksService: BooksService
  ) {}

  async processOrder(input: ProcessOrderInput): Promise<Order> {
    const attempt = { ...input, fulfilled: false };
    try {
      await this.orderBook(attempt);
      attempt.fulfilled = true;
    } catch (error) {
      // do nothing becasuse attempt.fulfilled is false
    }
    return attempt;
  }

  private async orderBook(order: Order): Promise<Book> {
    let book = await this.booksService.findById(order.bookId);
    if (
      book.inventory - order.quantity > 0 ||
      (order.type === OrderType.RESERVE && book.releaseDate > new Date())
    ) {
      book.inventory - order.quantity;
      await this.booksService.update(book.id, {
        id: book.id,
        inventory: book.inventory - order.quantity,
      });
    } else {
      throw new Error("Book not available");
    }

    return book;
  }
}
