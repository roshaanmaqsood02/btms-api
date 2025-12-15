import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1765545743757 implements MigrationInterface {
  name = 'Init1765545743757';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "ayyaz" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roshaan"`);
  }
}
