import { MigrationInterface, QueryRunner } from "typeorm";

export class NewFulfillmentcreate1691499201751 implements MigrationInterface {
    name = 'NewFulfillmentcreate1691499201751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "new_fulfillment" ADD "clinic_product_id" character varying`);
        await queryRunner.query(`ALTER TABLE "new_fulfillment" ADD "vendor_product_id" character varying`);
        await queryRunner.query(`CREATE INDEX "clinic_product_id" ON "new_fulfillment" ("clinic_product_id") `);
        await queryRunner.query(`CREATE INDEX "vendor_product_id" ON "new_fulfillment" ("vendor_product_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."vendor_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."clinic_product_id"`);
        await queryRunner.query(`ALTER TABLE "new_fulfillment" DROP COLUMN "vendor_product_id"`);
        await queryRunner.query(`ALTER TABLE "new_fulfillment" DROP COLUMN "clinic_product_id"`);
    }

}
