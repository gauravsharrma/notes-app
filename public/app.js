// API endpoints
const API_URL = `${window.location.origin}/api`;


// State management
let notes = [];
let tags = [];
let editingNoteId = null;

// DOM elements
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const noteTagsInput = document.getElementById('noteTags');
const tagFilter = document.getElementById('tagFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const noteTemplate = document.getElementById('noteTemplate');

// Event listeners
noteForm.addEventListener('submit', handleNoteSubmit);
tagFilter.addEventListener('change', handleTagFilter);
clearFilterBtn.addEventListener('click', clearTagFilter);

// Initialize app
loadNotes();
loadTags();

// Load all notes
async function loadNotes(filterTag = '') {
    try {
        showLoading();
        const url = filterTag ? `${API_URL}/notes?tag=${encodeURIComponent(filterTag)}` : `${API_URL}/notes`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        notes = data;
        renderNotes();
    } catch (error) {
        console.error('Error loading notes:', error);
        showError('Failed to load notes: ' + error.message);
        // Clear notes list if there's an error
        notesList.innerHTML = '<div class="text-red-500 p-4">Failed to load notes. Please try refreshing the page.</div>';
    } finally {
        hideLoading();
    }
}

// Load all tags
async function loadTags() {
    try {
        const response = await fetch(`${API_URL}/notes/tags`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        tags = data;
        updateTagFilter();
    } catch (error) {
        console.error('Error loading tags:', error);
        showError('Failed to load tags: ' + error.message);
    }
}

// Handle form submission
async function handleNoteSubmit(e) {
    e.preventDefault();
    
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const tags = noteTagsInput.value.trim();
    
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
            body: JSON.stringify({ title, content, tags })
        });

        if (!response.ok) throw new Error('Failed to save note');

        await Promise.all([loadNotes(), loadTags()]);
        resetForm();
    } catch (error) {
        showError('Failed to save note');
    }
}

// Handle tag filter change
function handleTagFilter(e) {
    const selectedTag = e.target.value;
    loadNotes(selectedTag);
}

// Clear tag filter
function clearTagFilter() {
    tagFilter.value = '';
    loadNotes();
}

// Update tag filter dropdown
function updateTagFilter() {
    // Save current selection
    const currentValue = tagFilter.value;
    
    // Clear existing options except the first one
    while (tagFilter.options.length > 1) {
        tagFilter.remove(1);
    }
    
    // Add tags as options
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (tags.includes(currentValue)) {
        tagFilter.value = currentValue;
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

        await Promise.all([loadNotes(), loadTags()]);
    } catch (error) {
        showError('Failed to delete note');
    }
}

// Edit a note
function editNote(note) {
    editingNoteId = note.id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    noteTagsInput.value = note.tags.join(', ');
    noteForm.querySelector('button').textContent = 'Update Note';
    noteTitleInput.focus();
}

// Format date for display
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create tag element
function createTagElement(tag, isButton = false) {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.textContent = tag;
    
    if (isButton) {
        tagEl.style.cursor = 'pointer';
        tagEl.addEventListener('click', () => {
            tagFilter.value = tag;
            loadNotes(tag);
        });
    }
    
    return tagEl;
}

// Render notes list
function renderNotes() {
    notesList.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = noteTemplate.content.cloneNode(true);
        const noteCard = noteElement.querySelector('.note-card');
        
        // Set title and content
        noteCard.querySelector('h3').textContent = note.title;
        noteCard.querySelector('p').textContent = note.content;
        
        // Add tags
        const tagsContainer = noteCard.querySelector('.tags-container');
        note.tags.forEach(tag => {
            tagsContainer.appendChild(createTagElement(tag, true));
        });
        
        // Add timestamps
        const createdAt = noteCard.querySelector('.created-at');
        const updatedAt = noteCard.querySelector('.updated-at');
        createdAt.textContent = `Created: ${formatDate(note.created_at)}`;
        updatedAt.textContent = `Updated: ${formatDate(note.updated_at)}`;
        
        // Add event listeners
        noteCard.querySelector('.edit-btn').onclick = () => editNote(note);
        noteCard.querySelector('.delete-btn').onclick = () => deleteNote(note.id);
        
        notesList.appendChild(noteElement);
    });
}

// Helper functions
function resetForm() {
    editingNoteId = null;
    noteForm.reset();
    noteForm.querySelector('button').textContent = 'Add Note';
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading text-center p-4 text-gray-600';
    loadingDiv.textContent = 'Loading...';
    notesList.innerHTML = '';
    notesList.appendChild(loadingDiv);
}

function hideLoading() {
    const loading = notesList.querySelector('.loading');
    if (loading) loading.remove();
}

function showError(message) {
    console.error(message); // Log error to console
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message bg-red-100 text-red-700 p-4 rounded mb-4';
    errorDiv.textContent = message;
    
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    noteForm.insertAdjacentElement('beforebegin', errorDiv);
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
} 