import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendanceIdColumn1766055957414 implements MigrationInterface {
  name = 'AddAttendanceIdColumn1766055957414';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding attendance_id column...');

    // Check if column exists
    const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'attendance_id'
            )
        `);

    if (!columnExists[0].exists) {
      // Add column
      await queryRunner.query(`
                ALTER TABLE users 
                ADD COLUMN attendance_id VARCHAR(255)
            `);

      // Add unique constraint
      await queryRunner.query(`
                ALTER TABLE users 
                ADD CONSTRAINT UQ_users_attendance_id UNIQUE (attendance_id)
            `);

      // Generate attendance IDs for existing users
      await queryRunner.query(`
                UPDATE users 
                SET attendance_id = CONCAT('ATT', LPAD(id::text, 4, '0'))
                WHERE attendance_id IS NULL
            `);

      console.log('✅ attendance_id column added successfully');
    } else {
      console.log('✅ attendance_id column already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove constraint
    await queryRunner.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS UQ_users_attendance_id
        `);

    // Remove column
    await queryRunner.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS attendance_id
        `);
  }
}
