const { Pool } = require('pg');

class StorageService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Add error handler for pool
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    async connect() {
        try {
            // Test the connection
            const client = await this.pool.connect();
            console.log('Successfully connected to PostgreSQL');
            client.release();
            
            await this.initializeDatabase();
            return Promise.resolve();
        } catch (error) {
            console.error('Database connection error:', error);
            return Promise.reject(error);
        }
    }

    async initializeDatabase() {
        const sql = `
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                tags TEXT[] DEFAULT ARRAY[]::TEXT[],
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        return this.run(sql);
    }

    async getAllNotes() {
        const sql = 'SELECT *, tags::text[] as tags FROM notes ORDER BY updated_at DESC';
        const result = await this.pool.query(sql);
        return result.rows;
    }

    async getNotesByTag(tag) {
        const sql = 'SELECT * FROM notes WHERE $1 = ANY(tags) ORDER BY updated_at DESC';
        const result = await this.pool.query(sql, [tag]);
        return result.rows;
    }

    async getNoteById(id) {
        const sql = 'SELECT *, tags::text[] as tags FROM notes WHERE id = $1';
        const result = await this.pool.query(sql, [id]);
        return result.rows[0];
    }

    async createNote(title, content, tags = []) {
        const sql = `
            INSERT INTO notes (title, content, tags)
            VALUES ($1, $2, $3)
            RETURNING id, created_at, updated_at
        `;
        const result = await this.pool.query(sql, [title, content, tags]);
        return {
            id: result.rows[0].id,
            created_at: result.rows[0].created_at,
            updated_at: result.rows[0].updated_at
        };
    }

    async updateNote(id, title, content, tags = []) {
        const sql = `
            UPDATE notes 
            SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, updated_at
        `;
        const result = await this.pool.query(sql, [title, content, tags, id]);
        return {
            id: result.rows[0]?.id,
            updated_at: result.rows[0]?.updated_at,
            changes: result.rowCount
        };
    }

    async deleteNote(id) {
        const sql = 'DELETE FROM notes WHERE id = $1';
        const result = await this.pool.query(sql, [id]);
        return { changes: result.rowCount };
    }

    async getAllTags() {
        const sql = 'SELECT DISTINCT unnest(tags) as tag FROM notes ORDER BY tag';
        const result = await this.pool.query(sql);
        return result.rows.map(row => row.tag);
    }

    // Helper method for running queries
    async run(sql, params = []) {
        const result = await this.pool.query(sql, params);
        return { 
            id: result.rows[0]?.id,
            changes: result.rowCount
        };
    }

    async close() {
        return this.pool.end();
    }
}

module.exports = new StorageService(); 