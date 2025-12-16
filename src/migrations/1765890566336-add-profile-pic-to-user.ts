import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfilePicToUser1765890566336 implements MigrationInterface {
    name = 'AddProfilePicToUser1765890566336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profile_pic" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "projects"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "projects" character varying array`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "positions"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "positions" character varying array`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "positions"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "positions" text array`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "projects"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "projects" text array`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_pic"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean DEFAULT true`);
    }

}
