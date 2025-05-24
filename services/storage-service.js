const { Pool } = require('pg');

class StorageService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            console.log('Successfully connected to PostgreSQL');
            client.release();
            await this.initializeDatabase();
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    }

    async initializeDatabase() {
        const sql = `
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                tags TEXT[] DEFAULT ARRAY[]::TEXT[],
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Add index for faster tag searches
            CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN (tags);

            -- Add index for timestamp sorting
            CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes (updated_at DESC);
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
        try {
            const sql = `
                INSERT INTO notes (title, content, tags)
                VALUES ($1, $2, $3)
                RETURNING id, title, content, tags, created_at, updated_at
            `;
            
            // Ensure tags is an array
            const processedTags = Array.isArray(tags) ? tags : [];
            
            const result = await this.pool.query(sql, [title, content, processedTags]);
            
            if (!result.rows || result.rows.length === 0) {
                throw new Error('No data returned after creating note');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Database error in createNote:', error);
            throw new Error(`Database error: ${error.message}`);
        }
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

    async run(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return { 
                id: result.rows[0]?.id,
                changes: result.rowCount
            };
        } catch (error) {
            console.error('Database error in run:', error);
            throw new Error(`Database error: ${error.message}`);
        }
    }

    async close() {
        return this.pool.end();
    }
}

module.exports = new StorageService();