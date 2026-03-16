# Resume Builder Backend API

Backend API for the Resume Builder application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- MongoDB URI
- OpenAI API Key (from SomethingX project)
- Port and other settings

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Resumes
- `GET /api/resumes` - Get all resumes
- `GET /api/resumes/:id` - Get resume by ID
- `POST /api/resumes` - Create new resume
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume
- `POST /api/resumes/:id/duplicate` - Duplicate resume

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates?category=ats` - Get templates by category
- `GET /api/templates/:id` - Get template by ID

### AI Features
- `POST /api/ai/generate-summary` - Generate professional summary
- `POST /api/ai/optimize-bullets` - Optimize bullet points
- `POST /api/ai/tailor-resume` - Tailor resume for job description
- `POST /api/ai/suggest-improvements` - Get improvement suggestions
- `POST /api/ai/parse-job-description` - Parse job description

### ATS
- `POST /api/ats/analyze/:id` - Analyze resume ATS compatibility
- `POST /api/ats/match` - Match resume to job description

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS
