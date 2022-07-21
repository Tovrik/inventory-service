import { ArgsType, Field, Int } from "@nestjs/graphql";
import { Max, Min } from "class-validator";

@ArgsType()
export class PageableQuery {
  @Field(() => Int, {
    description: "How far into the result set to start taking results",
    defaultValue: 0,
  })
  @Min(0)
  skip: number;

  @Field(() => Int, {
    description: "The size of the page",
    defaultValue: 20,
  })
  @Min(1)
  @Max(50)
  take: number;
}
