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

// Add content length validation
noteContentInput.addEventListener('input', handleContentInput);

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
        notes = Array.isArray(data) ? data : [];  // Ensure notes is always an array
        renderNotes();
    } catch (error) {
        console.error('Error loading notes:', error);
        notes = [];  // Reset notes to empty array on error
        showError('Failed to load notes: ' + error.message);
        renderNotes();  // Still call renderNotes to show empty state
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
        tags = Array.isArray(data) ? data : [];  // Ensure tags is always an array
        updateTagFilter();
    } catch (error) {
        console.error('Error loading tags:', error);
        tags = [];  // Reset tags to empty array on error
        showError('Failed to load tags: ' + error.message);
        updateTagFilter();  // Still update the filter to show empty state
    }
}

// Content length validation
function handleContentInput(e) {
    const content = e.target.value.trim();
    const charCounter = document.getElementById('charCounter') || createCharCounter(e.target);
    charCounter.textContent = `${content.length} characters`;
    charCounter.className = 'text-sm mt-1 text-gray-500';
}

function createCharCounter(targetElement) {
    const charCounter = document.createElement('div');
    charCounter.id = 'charCounter';
    charCounter.className = 'text-sm mt-1 text-gray-500';
    targetElement.parentNode.appendChild(charCounter);
    return charCounter;
}

// Handle form submission
async function handleNoteSubmit(e) {
    e.preventDefault();
    
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const tags = noteTagsInput.value.trim();
    
    if (!title) {
        showError('Title is required');
        noteTitleInput.focus();
        return;
    }

    if (!content) {
        showError('Content is required');
        noteContentInput.focus();
        return;
    }

    if (content.length >= 1000) {
        showError(`Content must be less than 1000 characters (current: ${content.length})`);
        noteContentInput.focus();
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to save note (${response.status})`);
        }

        const result = await response.json();
        
        if (!result || !result.id) {
            throw new Error('Invalid response from server');
        }

        await Promise.all([loadNotes(), loadTags()]);
        resetForm();
        showSuccess('Note saved successfully!');
    } catch (error) {
        console.error('Error saving note:', error);
        showError(error.message || 'Failed to save note');
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
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center p-8 text-gray-500';
        emptyMessage.textContent = 'No notes found. Create your first note!';
        notesList.appendChild(emptyMessage);
        return;
    }
    
    notes.forEach(note => {
        const noteElement = noteTemplate.content.cloneNode(true);
        const noteCard = noteElement.querySelector('.note-card');
        
        // Set title
        noteCard.querySelector('h3').textContent = note.title || 'Untitled';
        
        // Set preview of content
        const contentPreview = note.content.length > 200 
            ? note.content.substring(0, 200) + '...'
            : note.content;
        noteCard.querySelector('p').textContent = contentPreview;
        
        // Add tags
        const tagsContainer = noteCard.querySelector('.tags-container');
        if (note.tags && Array.isArray(note.tags)) {
            note.tags.forEach(tag => {
                tagsContainer.appendChild(createTagElement(tag, true));
            });
        }
        
        // Add timestamps
        const createdAt = noteCard.querySelector('.created-at');
        const updatedAt = noteCard.querySelector('.updated-at');
        createdAt.textContent = `Created: ${formatDate(note.created_at)}`;
        updatedAt.textContent = `Updated: ${formatDate(note.updated_at)}`;
        
        // Update buttons container
        const buttonsContainer = noteCard.querySelector('.buttons-container');
        
        // View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn text-blue-500 hover:text-blue-700';
        viewBtn.textContent = 'View';
        viewBtn.onclick = () => window.open(`/view.html?id=${note.id}`, '_blank');
        
        // Edit button
        const editBtn = noteCard.querySelector('.edit-btn');
        editBtn.onclick = () => editNote(note);
        
        // Delete button
        const deleteBtn = noteCard.querySelector('.delete-btn');
        deleteBtn.onclick = () => deleteNote(note.id);
        
        // Add buttons in order
        buttonsContainer.appendChild(viewBtn);
        buttonsContainer.appendChild(editBtn);
        buttonsContainer.appendChild(deleteBtn);
        
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

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message bg-green-100 text-green-700 p-4 rounded mb-4';
    successDiv.textContent = message;
    noteForm.insertAdjacentElement('beforebegin', successDiv);
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
} 