import {
  ArgsType,
  IntersectionType,
  OmitType,
  PartialType,
} from "@nestjs/graphql";
import { Author } from "./../../entities/author.entity";
import { PageableQuery } from "./../../../contracts/pageable.query";

@ArgsType()
export class SearchAuthorArgs extends IntersectionType(
  PartialType(OmitType(Author, ["books"] as const), ArgsType),
  PageableQuery
) {}
