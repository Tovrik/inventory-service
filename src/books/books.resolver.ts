import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from "@nestjs/graphql";
import { BooksService } from "./books.service";
import { Book } from "./entities/book.entity";
import { CreateBookInput } from "./dto/inputs/create-book.input";
import { UpdateBookInput } from "./dto/inputs/update-book.input";
import { SearchBookArgs } from "./dto/queries/search-book.query";
import { Author } from "./../authors/entities/author.entity";
import { AuthorsService } from "./../authors/authors.service";

@Resolver(() => Book)
export class BooksResolver {
  constructor(
    private readonly booksService: BooksService,
    private readonly authorsService: AuthorsService
  ) {}

  @Mutation((returns) => Book)
  async createBook(
    @Args("createBookInput") createBookInput: CreateBookInput
  ): Promise<Book> {
    return this.booksService.create(createBookInput);
  }

  @Query(() => [Book], { name: "searchBooks" })
  async searchBooks(@Args() searchBookArgs: SearchBookArgs): Promise<Book[]> {
    return this.booksService.search(searchBookArgs);
  }

  @Mutation(() => Book)
  updateBook(@Args("updateBookInput") updateBookInput: UpdateBookInput) {
    return this.booksService.update(updateBookInput.id, updateBookInput);
  }

  @Mutation(() => Book)
  removeBook(@Args("id", { type: () => Int }) id: number) {
    return this.booksService.remove(id);
  }

  @ResolveField()
  async authors(@Parent() book: Book): Promise<Author[]> {
    return this.authorsService.findByBook(book.id);
  }
}
