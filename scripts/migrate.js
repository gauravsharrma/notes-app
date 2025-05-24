require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Create migrations table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Read migration files
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

        // Run each migration in a transaction
        for (const file of sqlFiles) {
            const migrationName = path.basename(file);
            
            // Check if migration was already executed
            const { rows } = await pool.query(
                'SELECT id FROM migrations WHERE name = $1',
                [migrationName]
            );

            if (rows.length === 0) {
                console.log(`Running migration: ${migrationName}`);
                const sqlContent = await fs.readFile(
                    path.join(migrationsDir, file),
                    'utf8'
                );

                await pool.query('BEGIN');
                try {
                    await pool.query(sqlContent);
                    await pool.query(
                        'INSERT INTO migrations (name) VALUES ($1)',
                        [migrationName]
                    );
                    await pool.query('COMMIT');
                    console.log(`Migration completed: ${migrationName}`);
                } catch (error) {
                    await pool.query('ROLLBACK');
                    throw error;
                }
            } else {
                console.log(`Skipping migration: ${migrationName} (already executed)`);
            }
        }

        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration(); 