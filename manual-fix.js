// manual-fix.js
const { Client } = require('pg');
require('dotenv').config();

async function fixDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.DATABASE_PORT || 5432,
    user: process.env.DB_USER || process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '[p.b.u.h]',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'BTMS',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Check current structure
    console.log('\nChecking current table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });

    // 2. Add missing columns
    console.log('\nAdding missing columns...');
    
    const columnsToAdd = ['employee_id', 'uuid', 'profile_pic', 'postal_code', 'department'];
    for (const column of columnsToAdd) {
      const exists = result.rows.find(r => r.column_name === column);
      if (!exists) {
        await client.query(`ALTER TABLE users ADD COLUMN ${column} VARCHAR(255)`);
        console.log(`✓ Added ${column}`);
      } else {
        console.log(`✓ ${column} already exists`);
      }
    }

    // Add array columns
    const arrayColumns = ['projects', 'positions'];
    for (const column of arrayColumns) {
      const exists = result.rows.find(r => r.column_name === column);
      if (!exists) {
        await client.query(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
        console.log(`✓ Added ${column}`);
      } else {
        console.log(`✓ ${column} already exists`);
      }
    }

    // 3. Update existing records
    console.log('\nUpdating existing records...');
    await client.query(`
      UPDATE users 
      SET 
        employee_id = COALESCE(employee_id, CONCAT('EMP', LPAD(id::text, 3, '0'))),
        uuid = COALESCE(uuid, gen_random_uuid()::text)
      WHERE employee_id IS NULL OR uuid IS NULL
    `);
    console.log('✓ Updated existing records');

    // 4. Add constraints
    console.log('\nAdding constraints...');
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD CONSTRAINT IF NOT EXISTS UQ_users_employee_id UNIQUE (employee_id)
      `);
      console.log('✓ Added employee_id unique constraint');
    } catch (e) {
      console.log('⚠ Employee ID constraint may already exist');
    }

    try {
      await client.query(`
        ALTER TABLE users 
        ADD CONSTRAINT IF NOT EXISTS UQ_users_uuid UNIQUE (uuid)
      `);
      console.log('✓ Added uuid unique constraint');
    } catch (e) {
      console.log('⚠ UUID constraint may already exist');
    }

    console.log('\n✅ Database fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixDatabase();