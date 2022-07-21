import { InputType, OmitType } from "@nestjs/graphql";
import { Author } from "./../../entities/author.entity";

@InputType()
// Same as ObjectType('Author') but without the id field
export class CreateAuthorInput extends OmitType(
  Author,
  ["id", "books"] as const,
  InputType
) {}
