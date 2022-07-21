import {
  ArgsType,
  IntersectionType,
  OmitType,
  PartialType,
} from "@nestjs/graphql";
import { Book } from "./../../entities/book.entity";
import { PageableQuery } from "./../../../contracts/pageable.query";

// Same as ObjectType('Book') but all properties are optional and we omit authors
@ArgsType()
export class SearchBookArgs extends IntersectionType(
  PartialType(OmitType(Book, ["authors"] as const), ArgsType),
  PageableQuery
) {}
