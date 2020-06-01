import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import Pet from "./Pet";

@Entity({ name: "category" })
class Category {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "id",
    comment: "Auto-generated id for Categories",
  })
  id?: number;

  @Column("varchar", {
    name: "name",
    unique: true,
    comment: "This is a unique name that can be used to categorize pets",
  })
  name?: string;

  @OneToMany(() => Pet, (pet) => pet.category)
  pets?: Pet[];

  constructor(init?: Partial<Category>) {
    Object.assign(this, init);
  }
}

export default Category;
