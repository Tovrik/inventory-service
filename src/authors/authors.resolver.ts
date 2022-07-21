import { forwardRef, Inject, Injectable } from "@nestjs/common";
import {
  Args,
  Mutation,
  Resolver,
  Query,
  ResolveField,
  Parent,
} from "@nestjs/graphql";
import { BooksService } from "./../books/books.service";
import { Book } from "./../books/entities/book.entity";
import { AuthorsService } from "./authors.service";
import { CreateAuthorInput } from "./dto/inputs/create-author.input";
import { SearchAuthorArgs } from "./dto/queries/search-author.query";
import { Author } from "./entities/author.entity";

@Resolver(() => Author)
@Injectable()
export class AuthorsResolver {
  constructor(
    private readonly authorsService: AuthorsService,
    @Inject(forwardRef(() => BooksService))
    private readonly booksService: BooksService
  ) {}

  @Mutation((returns) => Author)
  async createAuthor(
    @Args("createAuthorInput") createAuthorInput: CreateAuthorInput
  ): Promise<Author> {
    return this.authorsService.create(createAuthorInput);
  }

  @Mutation((returns) => [Author])
  async createAuthors(
    @Args("createAuthorInputs", { type: () => [CreateAuthorInput] })
    createAuthorInputs: CreateAuthorInput[]
  ) {
    return this.authorsService.createMany(createAuthorInputs);
  }

  @Query(() => [Author], { name: "searchAuthors" })
  async searchAuthors(
    @Args() searchAuthorArgs: SearchAuthorArgs
  ): Promise<Author[]> {
    return this.authorsService.search(searchAuthorArgs);
  }

  @ResolveField()
  async books(@Parent() author: Author): Promise<Book[]> {
    return this.booksService.findByAuthor(author.id);
  }
}
