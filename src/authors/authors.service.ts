import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { query } from "express";
import { Repository } from "typeorm";
import { CreateAuthorInput } from "./dto/inputs/create-author.input";
import { SearchAuthorArgs } from "./dto/queries/search-author.query";
import { Author } from "./entities/author.entity";

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly AuthorRespository: Repository<Author>
  ) {}

  async create(createAuthorInput: CreateAuthorInput): Promise<Author> {
    let author = this.AuthorRespository.create(createAuthorInput);
    await this.AuthorRespository.upsert(author, {
      conflictPaths: ["firstName", "lastName"],
    });
    return author;
  }

  async createMany(createAuthorInputs: CreateAuthorInput[]): Promise<Author[]> {
    let authors = this.AuthorRespository.create(createAuthorInputs);
    await this.AuthorRespository.upsert(authors, {
      conflictPaths: ["firstName", "lastName"],
    });
    return authors;
  }

  async findByBook(bookId: number): Promise<Author[]> {
    let authors = await this.AuthorRespository.createQueryBuilder("a")
      .select()
      .innerJoin("authors_books", "ab", "a.id = ab.author_id")
      .innerJoin("books", "b", "ab.book_id = b.id")
      .where("b.id = :bookId", { bookId })
      .getMany();
    return authors;
  }

  async findByIds(authorIds: number[]): Promise<Author[]> {
    let authors = await this.AuthorRespository.findByIds(authorIds);
    return authors;
  }

  async search(args: SearchAuthorArgs): Promise<Author[]> {
    let query = this.AuthorRespository.createQueryBuilder()
      .select("authors")
      .from(Author, "authors");

    if (args.id) {
      query.andWhere("authors.id = :id", { id: args.id });
    }
    if (args.firstName) {
      query.andWhere("authors.firstName LIKE :firstName", {
        firstName: `%${args.firstName}%`,
      });
    }
    if (args.lastName) {
      query.andWhere("authors.lastName LIKE :lastName", {
        lastName: `%${args.lastName}%`,
      });
    }
    if (args.skip) {
      query.offset(args.skip);
    }
    if (args.take) {
      query.limit(args.take);
    }

    let authors = await query.getMany();
    return authors;
  }
}
