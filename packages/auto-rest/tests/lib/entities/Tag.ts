import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import Pet from "./Pet";

@Entity({ name: "tag" })
class Tag {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "id",
    comment: "Auto-generated id for Tags",
  })
  id?: number;

  @Column("varchar", {
    name: "name",
    unique: true,
    comment: "This is a unique name that can be used to tag pets",
  })
  name?: string;

  @ManyToMany(() => Pet, (pet) => pet.tags)
  pets?: Pet[];

  constructor(init?: Partial<Tag>) {
    Object.assign(this, init);
  }
}

export default Tag;
