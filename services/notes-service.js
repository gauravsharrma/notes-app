const storageService = require('./storage-service');

class NotesService {
    async getAllNotes() {
        try {
            return await storageService.getAllNotes();
        } catch (error) {
            throw new Error('Failed to fetch notes: ' + error.message);
        }
    }

    async getNotesByTag(tag) {
        try {
            return await storageService.getNotesByTag(tag);
        } catch (error) {
            throw new Error('Failed to fetch notes by tag: ' + error.message);
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

    async getAllTags() {
        try {
            return await storageService.getAllTags();
        } catch (error) {
            throw new Error('Failed to fetch tags: ' + error.message);
        }
    }

    async createNote(noteData) {
        try {
            this.validateNoteData(noteData);
            const { title, content, tags } = noteData;
            const processedTags = this.processTags(tags);
            return await storageService.createNote(title, content, processedTags);
        } catch (error) {
            throw new Error('Failed to create note: ' + error.message);
        }
    }

    async updateNote(id, noteData) {
        try {
            this.validateNoteData(noteData);
            const { title, content, tags } = noteData;
            const processedTags = this.processTags(tags);
            
            // Check if note exists
            const existingNote = await storageService.getNoteById(id);
            if (!existingNote) {
                throw new Error('Note not found');
            }

            return await storageService.updateNote(id, title, content, processedTags);
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
        const { title, content, tags } = noteData;

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

        if (tags !== undefined && !Array.isArray(tags) && typeof tags !== 'string') {
            throw new Error('Tags must be an array or a comma-separated string');
        }
    }

    processTags(tags) {
        if (!tags) return [];
        
        // If tags is a string, split it by commas
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        
        // Process each tag: trim whitespace and convert to lowercase
        return tagArray
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0) // Remove empty tags
            .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
    }
}

module.exports = new NotesService(); 