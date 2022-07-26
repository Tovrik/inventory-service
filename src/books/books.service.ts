import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthorsService } from "./../authors/authors.service";
import { Repository } from "typeorm";
import { CreateBookInput } from "./dto/inputs/create-book.input";
import { UpdateBookInput } from "./dto/inputs/update-book.input";
import { SearchBookArgs } from "./dto/queries/search-book.query";
import { Book } from "./entities/book.entity";

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly BookRepository: Repository<Book>,

    @Inject(AuthorsService)
    private readonly authorsService: AuthorsService
  ) {}

  async create(createBookInput: CreateBookInput): Promise<Book> {
    let authors = await this.authorsService.findByIds(
      createBookInput.authorIds
    );
    if (authors.length !== createBookInput.authorIds.length) {
      throw Error("One or more authors not found");
    }

    let bookInput = {
      title: createBookInput.title,
      isbn: createBookInput.isbn,
      category: createBookInput.category,
      inventory: createBookInput.inventory,
      releaseDate: createBookInput.releaseDate,
      notes: createBookInput.notes,
      price: createBookInput.price,
      priceOverride: createBookInput.priceOverride,
      authors: authors,
    };
    return await this.BookRepository.save(
      this.BookRepository.create(bookInput)
    );
  }

  async search(searchBookArgs: SearchBookArgs): Promise<Book[]> {
    let query = this.BookRepository.createQueryBuilder("b")
      .select()
      .innerJoin("authors_books", "ab", "b.id = ab.book_id")
      .innerJoin("authors", "a", "ab.author_id = a.id");

    if (searchBookArgs.id) {
      query.andWhere("b.id = :id", { id: searchBookArgs.id });
    }
    if (searchBookArgs.title) {
      query.andWhere("b.title LIKE :title", {
        title: `%${searchBookArgs.title}%`,
      });
    }
    if (searchBookArgs.isbn) {
      query.andWhere("b.isbn LIKE :isbn", { isbn: `%${searchBookArgs.isbn}%` });
    }
    if (searchBookArgs.category) {
      query.andWhere("b.category LIKE :category", {
        category: `%${searchBookArgs.category}%`,
      });
    }
    if (searchBookArgs.skip) {
      query.offset(searchBookArgs.skip);
    }
    if (searchBookArgs.take) {
      query.limit(searchBookArgs.take);
    }

    let books = await query.getMany();
    return books;
  }

  async update(id: number, updateBookInput: UpdateBookInput) {
    let result = await this.BookRepository.update(id, updateBookInput);
    if (result.affected === 0) {
      throw new Error("Book not found");
    } else {
      return this.BookRepository.findOneById(updateBookInput.id);
    }
  }

  async findByAuthor(authorId: number): Promise<Book[]> {
    let books = await this.BookRepository.createQueryBuilder("b")
      .select()
      .innerJoin("authors_books", "ab", "b.id = ab.book_id")
      .innerJoin("authors", "a", "ab.author_id = a.id")
      .where("a.id = :authorId", { authorId })
      .getMany();
    return books;
  }

  async findById(id: number): Promise<Book> {
    return this.BookRepository.findOneById(id);
  }

  remove(id: number) {
    return this.BookRepository.delete(id);
  }
}
