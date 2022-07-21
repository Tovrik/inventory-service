import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Author } from "../../authors/entities/author.entity";

@Entity("books")
@ObjectType()
export class Book {
  @PrimaryGeneratedColumn()
  @Field(() => Int, { description: "Identifier for the book record" })
  readonly id: number;

  @Column({ length: 256, nullable: false })
  @Field(() => String, {
    description:
      "Title of the book (ex. Harry Potter And The Sorcerer's Stone)",
  })
  title: string;

  @Column({ length: 256, nullable: false })
  @Field(() => String, {
    description:
      "The ISBN number of the book. This should be unique for all books (ex. 37463567283)",
  })
  isbn: string;

  @Column({ length: 256, nullable: false })
  @Field(() => String, {
    description: "The category of the book (ex. fantasy)",
  })
  category: string;

  @Column("int", { nullable: false })
  @Field(() => Int, {
    description: "The count of books in the inventory (ex. 7)",
  })
  inventory: number;

  @Column({ nullable: false })
  @Field(() => Float, { description: "The price of the book (ex. 12.99)" })
  price: number;

  @Column({ name: "price_override", nullable: true })
  @Field(() => Float, {
    description:
      "Temporary price that overrides the normal price in cases of a sale or high demand (ex. 9.99))",
    nullable: true,
  })
  priceOverride?: number;

  @Column({ name: "release_date", nullable: false })
  @Field(() => Date, {
    description: "The date the book was released (ex. 2020-01-01)",
  })
  releaseDate: Date;

  @Column({ length: 256, nullable: true })
  @Field(() => String, {
    description: "Optional internal notes on the book",
    nullable: true,
  })
  notes?: string;

  @ManyToMany(() => Author, (author) => author.books, { cascade: true })
  @Field(() => [Author], { description: "The authors of the book" })
  @JoinTable({
    name: "authors_books",
    joinColumn: { name: "book_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "author_id", referencedColumnName: "id" },
  })
  readonly authors: Author[];
}
