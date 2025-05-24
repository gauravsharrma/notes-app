# Notes App

A cloud-native, microservices-based note-taking application built with Node.js, Express.js, and SQLite.

## Features

- Create, read, update, and delete notes
- Clean and responsive UI with Tailwind CSS
- Microservices architecture
- SQLite database for data persistence
- RESTful API endpoints
- Error handling and input validation
- Graceful shutdown handling

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Project Structure

```
notes-app/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── services/
│   ├── notes-service.js
│   └── storage-service.js
├── routes/
│   └── notes.js
├── data/
│   └── notes.db
├── server.js
├── package.json
└── README.md
```

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd notes-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=3000
   DB_PATH=./data/notes.db
   ```

4. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

## Development

The application follows a microservices architecture:

- **Notes Service**: Handles business logic and validation
- **Storage Service**: Manages database operations
- **API Routes**: RESTful endpoints for CRUD operations
- **Frontend**: Responsive UI with Tailwind CSS

## Deployment

The application can be deployed to platforms like Render, Vercel, or Railway:

1. Fork/clone the repository
2. Configure environment variables on your hosting platform
3. Deploy using the platform's deployment process

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 