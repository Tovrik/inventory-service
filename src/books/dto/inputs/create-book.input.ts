import { Field, InputType, Int, OmitType } from "@nestjs/graphql";
import { Book } from "./../../entities/book.entity";

@InputType()
export class CreateBookInput extends OmitType(
  Book,
  ["id", "authors"] as const,
  InputType
) {
  @Field(() => [Int], { description: "The authors id(s) who wrote the book", nullable: false })
  readonly authorIds: number[];
}
