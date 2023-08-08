import { MigrationInterface, QueryRunner } from "typeorm";

export class NewFulfillmentcreate1691426253180 implements MigrationInterface {
    name = 'NewFulfillmentcreate1691426253180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "new_fulfillment" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "quantity" integer NOT NULL, "tax" integer NOT NULL, "payment" character varying NOT NULL, "shipment_status" character varying NOT NULL, CONSTRAINT "PK_cba450d38d300e16744ddf6feff" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "new_fulfillment"`);
    }

}
