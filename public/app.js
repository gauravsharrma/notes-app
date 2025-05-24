// API endpoints
const API_URL = 'http://localhost:3000/api';

// State management
let notes = [];
let editingNoteId = null;

// DOM elements
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');

// Event listeners
noteForm.addEventListener('submit', handleNoteSubmit);

// Initialize app
loadNotes();

// Load all notes
async function loadNotes() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/notes`);
        const data = await response.json();
        notes = data;
        renderNotes();
    } catch (error) {
        showError('Failed to load notes');
    } finally {
        hideLoading();
    }
}

// Handle form submission
async function handleNoteSubmit(e) {
    e.preventDefault();
    
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    
    if (!title || !content) {
        showError('Title and content are required');
        return;
    }

    try {
        const method = editingNoteId ? 'PUT' : 'POST';
        const url = editingNoteId 
            ? `${API_URL}/notes/${editingNoteId}`
            : `${API_URL}/notes`;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });

        if (!response.ok) throw new Error('Failed to save note');

        await loadNotes();
        resetForm();
    } catch (error) {
        showError('Failed to save note');
    }
}

// Delete a note
async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        const response = await fetch(`${API_URL}/notes/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete note');

        await loadNotes();
    } catch (error) {
        showError('Failed to delete note');
    }
}

// Edit a note
function editNote(note) {
    editingNoteId = note.id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    noteForm.querySelector('button').textContent = 'Update Note';
}

// Render notes list
function renderNotes() {
    notesList.innerHTML = notes.map(note => `
        <div class="note-card bg-white p-4 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold mb-2">${escapeHtml(note.title)}</h3>
            <p class="text-gray-600 mb-4">${escapeHtml(note.content)}</p>
            <div class="flex justify-end space-x-2">
                <button onclick="editNote(${JSON.stringify(note)})"
                        class="text-blue-500 hover:text-blue-700">
                    Edit
                </button>
                <button onclick="deleteNote(${note.id})"
                        class="delete-btn text-red-500 hover:text-red-700">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Helper functions
function resetForm() {
    editingNoteId = null;
    noteForm.reset();
    noteForm.querySelector('button').textContent = 'Add Note';
}

function showLoading() {
    notesList.innerHTML = '<div class="loading text-center">Loading...</div>';
}

function hideLoading() {
    const loading = notesList.querySelector('.loading');
    if (loading) loading.remove();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message bg-red-100 text-red-700 p-2 rounded mb-4';
    errorDiv.textContent = message;
    noteForm.insertAdjacentElement('beforebegin', errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
} 