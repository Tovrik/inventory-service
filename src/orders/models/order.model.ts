import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { OrderType } from "../enums/order-type.enum";

@ObjectType()
export class Order {
  @Field(() => Int, { description: "Identifier of the book being purchased" })
  bookId: number;

  @Field(() => OrderType, { description: "Purchase or Reserve" })
  type: OrderType;

  @Field(() => Int, { description: "Quantity of this book to be ordered" })
  quantity: number;

  @Field(() => Boolean, {
    description: "Acknowledgement that that the order was filled",
  })
  fulfilled: boolean;
}
