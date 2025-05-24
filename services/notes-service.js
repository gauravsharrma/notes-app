const storageService = require('./storage-service');

class NotesService {
    async getAllNotes() {
        try {
            return await storageService.getAllNotes();
        } catch (error) {
            throw new Error('Failed to fetch notes: ' + error.message);
        }
    }

    async getNoteById(id) {
        try {
            const note = await storageService.getNoteById(id);
            if (!note) {
                throw new Error('Note not found');
            }
            return note;
        } catch (error) {
            throw new Error('Failed to fetch note: ' + error.message);
        }
    }

    async createNote(noteData) {
        try {
            this.validateNoteData(noteData);
            const { title, content } = noteData;
            return await storageService.createNote(title, content);
        } catch (error) {
            throw new Error('Failed to create note: ' + error.message);
        }
    }

    async updateNote(id, noteData) {
        try {
            this.validateNoteData(noteData);
            const { title, content } = noteData;
            
            // Check if note exists
            const existingNote = await storageService.getNoteById(id);
            if (!existingNote) {
                throw new Error('Note not found');
            }

            return await storageService.updateNote(id, title, content);
        } catch (error) {
            throw new Error('Failed to update note: ' + error.message);
        }
    }

    async deleteNote(id) {
        try {
            // Check if note exists
            const existingNote = await storageService.getNoteById(id);
            if (!existingNote) {
                throw new Error('Note not found');
            }

            return await storageService.deleteNote(id);
        } catch (error) {
            throw new Error('Failed to delete note: ' + error.message);
        }
    }

    validateNoteData(noteData) {
        const { title, content } = noteData;

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new Error('Title is required and must be a non-empty string');
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            throw new Error('Content is required and must be a non-empty string');
        }

        if (title.length > 100) {
            throw new Error('Title must be less than 100 characters');
        }

        if (content.length > 1000) {
            throw new Error('Content must be less than 1000 characters');
        }
    }
}

module.exports = new NotesService(); 