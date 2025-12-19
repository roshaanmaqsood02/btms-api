import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserDetailsColums1766062712800 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Checking existing columns...');

    // Helper function to check if column exists
    const columnExists = async (
      tableName: string,
      columnName: string,
    ): Promise<boolean> => {
      const result = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = '${tableName}' 
                    AND column_name = '${columnName}'
                )
            `);
      return result[0].exists;
    };

    // Check and add date_of_birth if it doesn't exist
    if (!(await columnExists('users', 'date_of_birth'))) {
      console.log('Adding date_of_birth column...');
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'date_of_birth',
          type: 'date',
          isNullable: true,
        }),
      );
    } else {
      console.log('date_of_birth column already exists');
    }

    // Check and add blood_group if it doesn't exist
    if (!(await columnExists('users', 'blood_group'))) {
      console.log('Adding blood_group column...');
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'blood_group',
          type: 'varchar',
          length: '5',
          isNullable: true,
        }),
      );
    } else {
      console.log('blood_group column already exists');
    }

    // Check and add cnic if it doesn't exist
    if (!(await columnExists('users', 'cnic'))) {
      console.log('Adding cnic column...');
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'cnic',
          type: 'varchar',
          length: '15',
          isNullable: true,
        }),
      );
    } else {
      console.log('cnic column already exists');
    }

    // Check and add marital_status if it doesn't exist
    if (!(await columnExists('users', 'marital_status'))) {
      console.log('Adding marital_status column...');
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'marital_status',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
    } else {
      console.log('marital_status column already exists');
    }

    // Check and add system_role if it doesn't exist
    if (!(await columnExists('users', 'system_role'))) {
      console.log('Adding system_role column...');

      // First check if the enum type exists
      const enumTypeExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'system_role_enum'
                )
            `);

      if (!enumTypeExists[0].exists) {
        // Create the enum type
        await queryRunner.query(`
                    CREATE TYPE system_role_enum AS ENUM (
                        'EMPLOYEE', 
                        'PROJECT_MANAGER', 
                        'OPERATION_MANAGER', 
                        'HRM'
                    )
                `);
        console.log('Created system_role_enum type');
      }

      // Add column with enum type
      await queryRunner.query(`
                ALTER TABLE users 
                ADD COLUMN system_role system_role_enum DEFAULT 'EMPLOYEE'
            `);
      console.log('Added system_role column');
    } else {
      console.log('system_role column already exists');
    }

    // Check and add indexes if they don't exist
    const indexExists = async (indexName: string): Promise<boolean> => {
      const result = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = '${indexName}'
                )
            `);
      return result[0].exists;
    };

    // Add CNIC unique index if it doesn't exist
    if (!(await indexExists('IDX_USERS_CNIC_UNIQUE'))) {
      console.log('Adding CNIC unique index...');
      await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "IDX_USERS_CNIC_UNIQUE" 
                ON "users" ("cnic") 
                WHERE "cnic" IS NOT NULL
            `);
    }

    // Add date_of_birth index if it doesn't exist
    if (!(await indexExists('IDX_USERS_DATE_OF_BIRTH'))) {
      console.log('Adding date_of_birth index...');
      await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_USERS_DATE_OF_BIRTH" 
                ON "users" ("date_of_birth")
            `);
    }

    // Add system_role index if it doesn't exist
    if (!(await indexExists('IDX_USERS_SYSTEM_ROLE'))) {
      console.log('Adding system_role index...');
      await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_USERS_SYSTEM_ROLE" 
                ON "users" ("system_role")
            `);
    }

    // Update existing records to have default system_role
    console.log('Updating existing records...');
    await queryRunner.query(`
            UPDATE users 
            SET system_role = 'EMPLOYEE' 
            WHERE system_role IS NULL
        `);

    console.log('✅ Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Reverting migration...');

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USERS_SYSTEM_ROLE"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USERS_DATE_OF_BIRTH"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USERS_CNIC_UNIQUE"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS system_role`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS marital_status`,
    );
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS cnic`);
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS blood_group`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS date_of_birth`,
    );

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS system_role_enum`);

    console.log('✅ Migration reverted successfully');
  }
}
