const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class StorageService {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/notes.db');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.initializeDatabase()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    async initializeDatabase() {
        const sql = `
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        return this.run(sql);
    }

    async getAllNotes() {
        const sql = 'SELECT * FROM notes ORDER BY updated_at DESC';
        return this.all(sql);
    }

    async getNoteById(id) {
        const sql = 'SELECT * FROM notes WHERE id = ?';
        return this.get(sql, [id]);
    }

    async createNote(title, content) {
        const sql = `
            INSERT INTO notes (title, content)
            VALUES (?, ?)
        `;
        return this.run(sql, [title, content]);
    }

    async updateNote(id, title, content) {
        const sql = `
            UPDATE notes 
            SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return this.run(sql, [title, content, id]);
    }

    async deleteNote(id) {
        const sql = 'DELETE FROM notes WHERE id = ?';
        return this.run(sql, [id]);
    }

    // Helper methods for database operations
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = new StorageService(); 