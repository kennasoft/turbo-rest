import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import Pet from "./Pet";

@Entity({ name: "tag" })
class Tag {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "id",
    comment: "Auto-generated id for Tags",
  })
  public id?: number;

  @Column("varchar", {
    name: "name",
    unique: true,
    comment: "This is a unique name that can be used to tag pets",
  })
  public name?: string;

  @ManyToMany(() => Pet, (pet) => pet.tags)
  public pets?: Pet[];

  @CreateDateColumn({ name: "created_at" })
  public createdAt?: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt?: Date;

  constructor(init?: Partial<Tag>) {
    Object.assign(this, init);
  }
}

export default Tag;
