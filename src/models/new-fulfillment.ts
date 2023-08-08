import { SoftDeletableEntity, BaseEntity } from "@medusajs/medusa"

import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, BeforeInsert } from "typeorm"



import { generateEntityId } from "@medusajs/utils"

@Entity()
export class NewFulfillment extends BaseEntity {

    // @Index("clinic_product_id")
    // @Column({ nullable: true })
    // clinic_product_id?: string;

    // @OneToOne(() => Product, (product) => product.id)
    // @JoinColumn({ name: 'clinic_product_id', referencedColumnName: 'id' })
    // clinicProduct?: Product;

    // @Index("vendor_product_id")
    // @Column({ nullable: true })
    // vendor_product_id?: string;

    // @OneToOne(() => Product, (product) => product.id)
    // @JoinColumn({ name: 'vendor_product_id', referencedColumnName: 'id' })
    // vendorProduct?: Product;

    @Column()
    quantity?: number

    @Column()
    tax?: number

    @Column()
    payment?: string

    @Column()
    shipment_status?: string

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "new_fulfillment")
    }
}