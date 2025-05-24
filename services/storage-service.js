const { Pool } = require('pg');

class StorageService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    async connect() {
        try {
            await this.initializeDatabase();
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async initializeDatabase() {
        const sql = `
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        return this.run(sql);
    }

    async getAllNotes() {
        const sql = 'SELECT * FROM notes ORDER BY updated_at DESC';
        const result = await this.pool.query(sql);
        return result.rows;
    }

    async getNoteById(id) {
        const sql = 'SELECT * FROM notes WHERE id = $1';
        const result = await this.pool.query(sql, [id]);
        return result.rows[0];
    }

    async createNote(title, content) {
        const sql = `
            INSERT INTO notes (title, content)
            VALUES ($1, $2)
            RETURNING id
        `;
        const result = await this.pool.query(sql, [title, content]);
        return { id: result.rows[0].id };
    }

    async updateNote(id, title, content) {
        const sql = `
            UPDATE notes 
            SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id
        `;
        const result = await this.pool.query(sql, [title, content, id]);
        return { id: result.rows[0]?.id, changes: result.rowCount };
    }

    async deleteNote(id) {
        const sql = 'DELETE FROM notes WHERE id = $1';
        const result = await this.pool.query(sql, [id]);
        return { changes: result.rowCount };
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