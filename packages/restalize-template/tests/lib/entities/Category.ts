import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import Pet from "./Pet";

@Entity({ name: "category" })
class Category {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "id",
    comment: "Auto-generated id for Categories",
  })
  public id?: number;

  @Column("varchar", {
    name: "name",
    unique: true,
    comment: "This is a unique name that can be used to categorize pets",
  })
  public name?: string;

  @OneToMany(() => Pet, (pet) => pet.category)
  public pets?: Pet[];

  @CreateDateColumn({ name: "created_at" })
  public createdAt?: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt?: Date;

  constructor(init?: Partial<Category>) {
    Object.assign(this, init);
  }
}

export default Category;
