# Resume Builder App

A focused resume builder application that replicates resume.io's core resume building features.

## Features

✅ Resume Builder (step-by-step creation)
✅ Real-time preview
✅ 30+ Templates (exact copies from resume.io)
✅ AI-powered content generation (Recruiter-AI)
✅ Resume upload and parsing
✅ ATS Scorer
✅ Export to PDF/DOCX
✅ Template customization
✅ Resume examples
✅ Cover letter builder

## Project Structure

```
resume-builder-app/
├── backend/          # Node.js/Express API
├── frontend/         # React.js frontend
└── README.md
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
# Copy from .env.example and update with your values
MONGODB_URI=mongodb://localhost:27017/resume_builder
OPENAI_API_KEY=your-openai-api-key-from-somethingx
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Technology Stack

- **Backend**: Node.js, Express, MongoDB, OpenAI API
- **Frontend**: React.js, Tailwind CSS
- **PDF Generation**: Puppeteer
- **DOCX Generation**: docx.js

## API Documentation

See `backend/README.md` for detailed API documentation.

## Notes

- No authentication required - resumes are stored with simple IDs
- No payment system - all features are free
- Uses OpenAI API key from SomethingX project
- MongoDB database for data storage
