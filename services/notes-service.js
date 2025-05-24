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
            
            // Ensure title and content are strings and properly trimmed
            const title = String(noteData.title).trim();
            const content = String(noteData.content).trim();
            
            // Process tags, ensuring it's an array of strings
            const processedTags = this.processTags(noteData.tags || []);
            
            // Create the note
            const result = await storageService.createNote(title, content, processedTags);
            
            if (!result || !result.id) {
                throw new Error('Failed to create note - no ID returned');
            }
            
            return result;
        } catch (error) {
            console.error('Error in createNote:', error);
            throw new Error(`Failed to create note: ${error.message}`);
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
        if (!noteData || typeof noteData !== 'object') {
            throw new Error('Note data must be an object');
        }

        // Trim the values before validation
        const title = String(noteData.title || '').trim();
        const content = String(noteData.content || '').trim();

        if (!title) {
            throw new Error('Title is required');
        }

        if (!content) {
            throw new Error('Content is required');
        }

        if (title.length > 100) {
            throw new Error(`Title must be less than 100 characters (current: ${title.length})`);
        }

        if (content.length >= 1000) {
            throw new Error(`Content must be less than 1000 characters (current: ${content.length})`);
        }

        if (noteData.tags !== undefined) {
            if (!Array.isArray(noteData.tags) && typeof noteData.tags !== 'string') {
                throw new Error('Tags must be an array or a comma-separated string');
            }
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