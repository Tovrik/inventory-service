import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Book } from "../../books/entities/book.entity";

@Entity("authors")
@ObjectType()
export class Author {
  @PrimaryGeneratedColumn()
  @Field(() => Int, { description: "Identifier for the author record" })
  readonly id: number;

  @Column({ name: "first_name", length: 256 })
  @Field(() => String, { description: "First name of the author (ex. John)" })
  readonly firstName: string;

  @Column({ name: "last_name", length: 256 })
  @Field(() => String, { description: "Last name of the author (ex. Doe)" })
  readonly lastName: string;

  @ManyToMany(() => Book, (book) => book.authors)
  @Field(() => [Book], { description: "The books written by this author" })
  readonly books: Book[];
}
