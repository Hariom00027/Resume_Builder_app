# Resume Builder App - Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote)
- OpenAI API key (from SomethingX project)

## Backend Setup

1. Navigate to backend directory:
```bash
cd resume-builder-app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# Copy the structure from .env.example
MONGODB_URI=mongodb://localhost:27017/resume_builder
OPENAI_API_KEY=your-openai-api-key-from-somethingx
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

4. Make sure MongoDB is running:
```bash
# If using local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 mongo
```

5. Seed templates (optional):
```bash
node scripts/seedTemplates.js
```

6. Start the backend server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd resume-builder-app/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Getting OpenAI API Key

The OpenAI API key should be taken from your SomethingX project:

1. Navigate to `saarthix/SomethingX/` directory
2. Check the `.env` file or `env.example` for `OPENAI_API_KEY`
3. Copy that key to the resume builder backend `.env` file

## Features Available

Once set up, you can:

- ✅ Create and edit resumes
- ✅ Choose from multiple templates
- ✅ Use AI to generate summaries and optimize content
- ✅ Analyze resume ATS compatibility
- ✅ Export resumes to PDF/DOCX
- ✅ Upload and parse existing resumes (coming soon)

## API Endpoints

- `GET /api/resumes` - List all resumes
- `POST /api/resumes` - Create new resume
- `GET /api/resumes/:id` - Get resume by ID
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume
- `GET /api/templates` - List all templates
- `POST /api/ai/generate-summary` - Generate summary with AI
- `POST /api/ats/analyze/:id` - Analyze ATS compatibility
- `POST /api/export/pdf/:id` - Export to PDF
- `POST /api/export/docx/:id` - Export to DOCX

## Notes

- No authentication is required - resumes are stored with simple IDs
- All features are free (no payment system)
- Templates need to be seeded before use
- The template HTML/CSS should be populated with actual resume.io template designs

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check the MONGODB_URI in `.env` file
- Verify MongoDB port (default: 27017)

### OpenAI API Error
- Verify OPENAI_API_KEY is set correctly
- Check if the API key has sufficient credits
- Ensure the key is from SomethingX project

### Port Already in Use
- Change PORT in backend `.env` file
- Or kill the process using the port
