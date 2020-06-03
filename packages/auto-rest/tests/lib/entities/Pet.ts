import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import Category from "./Category";
import Tag from "./Tag";

@Entity({ name: "pet" })
class Pet {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "id",
    comment: "Auto-generated id for Pets",
  })
  public id?: number;

  @Column("varchar", { name: "name", comment: "Name of Pet" })
  public name?: string;

  @Column("varchar", {
    name: "status",
    nullable: true,
    comment: "status of Pet (available or unavailable)",
  })
  public status?: string;

  @Column("text", {
    name: "photo_urls",
    default: () => "'[]'",
    comment: "a list of photos of the pet",
  })
  photoUrlsJSON?: string;

  public get photoUrls() {
    if (this.photoUrlsJSON) return JSON.parse(this.photoUrlsJSON);
    else return null;
  }

  public set photoUrls(data: any) {
    if (data) this.photoUrlsJSON = JSON.stringify(data);
    else this.photoUrlsJSON = undefined;
  }

  @ManyToOne(() => Category, (category) => category.pets)
  @JoinColumn({ name: "category_id" })
  public category?: Category;

  @ManyToMany(() => Tag, (tag) => tag.pets)
  @JoinTable({
    name: "pets_tags",
    joinColumn: { name: "pet_id" },
    inverseJoinColumn: { name: "tag_id" },
  })
  public tags?: Tag[];

  @CreateDateColumn({ name: "created_at" })
  public createdAt?: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt?: Date;

  constructor(init?: Partial<Pet>) {
    Object.assign(this, init);
  }
}

export default Pet;
