require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const notesRoutes = require('./routes/notes');
const storageService = require('./services/storage-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Check required environment variables
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/notes', notesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Connect to database
        await storageService.connect();
        console.log('Connected to PostgreSQL database successfully');

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await storageService.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    await storageService.close();
    process.exit(0);
});

startServer(); 