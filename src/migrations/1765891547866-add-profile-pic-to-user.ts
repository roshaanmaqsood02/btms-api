import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfilePicToUser1765891547866 implements MigrationInterface {
    name = 'AddProfilePicToUser1765891547866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profile_pic" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "projects"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "projects" text`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "positions"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "positions" text`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "uuid" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_951b8f1dfc94ac1d0301a14b7e1"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_951b8f1dfc94ac1d0301a14b7e1" UNIQUE ("uuid")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "uuid" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "positions"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "positions" text array`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "projects"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "projects" text array`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_pic"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean DEFAULT true`);
    }

}
