import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserSchema1766055957414 implements MigrationInterface {
  name = 'FixUserSchema1766055957414';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Checking and fixing users table...');

    // Check if employee_id column exists
    const employeeIdExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'employee_id'
            )
        `);

    if (employeeIdExists[0].exists) {
      console.log('employee_id column exists');
    } else {
      console.log('Adding employee_id column...');
      await queryRunner.query(`
                ALTER TABLE users ADD COLUMN employee_id VARCHAR(255)
            `);
    }

    // Check if uuid column exists
    const uuidExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'uuid'
            )
        `);

    if (uuidExists[0].exists) {
      console.log('uuid column exists');
    } else {
      console.log('Adding uuid column...');
      await queryRunner.query(`
                ALTER TABLE users ADD COLUMN uuid VARCHAR(255)
            `);
    }

    // Update existing records
    console.log('Updating existing records...');
    await queryRunner.query(`
            UPDATE users 
            SET 
                employee_id = COALESCE(employee_id, CONCAT('EMP', LPAD(id::text, 3, '0'))),
                uuid = COALESCE(uuid, gen_random_uuid()::text)
            WHERE employee_id IS NULL OR uuid IS NULL
        `);

    // Add constraints - FIXED SYNTAX
    console.log('Adding constraints...');

    // Check if employee_id constraint exists
    const employeeConstraint = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'users' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name = 'UQ_users_employee_id'
        `);

    if (employeeConstraint.length === 0) {
      await queryRunner.query(`
                ALTER TABLE users 
                ADD CONSTRAINT UQ_users_employee_id UNIQUE (employee_id)
            `);
      console.log('Added employee_id constraint');
    } else {
      console.log('employee_id constraint already exists');
    }

    // Check if uuid constraint exists
    const uuidConstraint = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'users' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name = 'UQ_users_uuid'
        `);

    if (uuidConstraint.length === 0) {
      await queryRunner.query(`
                ALTER TABLE users 
                ADD CONSTRAINT UQ_users_uuid UNIQUE (uuid)
            `);
      console.log('Added uuid constraint');
    } else {
      console.log('uuid constraint already exists');
    }

    console.log('✅ Users table fixed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove constraints
    await queryRunner.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS UQ_users_employee_id
        `);

    await queryRunner.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS UQ_users_uuid
        `);

    // Remove columns
    await queryRunner.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS employee_id
        `);

    await queryRunner.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS uuid
        `);
  }
}
