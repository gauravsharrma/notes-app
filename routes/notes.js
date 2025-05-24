const express = require('express');
const router = express.Router();
const notesService = require('../services/notes-service');

// Get all notes
router.get('/', async (req, res) => {
    try {
        const tag = req.query.tag;
        const notes = tag 
            ? await notesService.getNotesByTag(tag)
            : await notesService.getAllNotes();
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all tags
router.get('/tags', async (req, res) => {
    try {
        const tags = await notesService.getAllTags();
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific note
router.get('/:id', async (req, res) => {
    try {
        const note = await notesService.getNoteById(req.params.id);
        res.json(note);
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Create a new note
router.post('/', async (req, res) => {
    try {
        const result = await notesService.createNote(req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error.message.includes('required')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Update a note
router.put('/:id', async (req, res) => {
    try {
        const result = await notesService.updateNote(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('required')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete a note
router.delete('/:id', async (req, res) => {
    try {
        await notesService.deleteNote(req.params.id);
        res.status(204).send();
    } catch (error) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

module.exports = router; 