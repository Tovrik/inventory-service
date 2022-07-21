import { CreateBookInput } from "./create-book.input";
import { InputType, Field, Int, PartialType, OmitType } from "@nestjs/graphql";

@InputType()
export class UpdateBookInput extends PartialType(
  OmitType(CreateBookInput, ["authorIds"] as const)
) {
  @Field(() => Int, { description: "Identifier for the book record" })
  readonly id: number;
}
