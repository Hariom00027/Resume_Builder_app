# Resume Builder App - Quick Start Guide

## ✅ Setup Complete!

The app has been set up with 5 resume templates and is ready to run.

## 🎯 5 Templates Added

1. **Traditional (Santiago)** - Classic single-column design
2. **Professional (Dublin)** - Clean professional style
3. **Prime ATS (Helsinki)** - ATS-optimized format
4. **Modern (Tokyo)** - Contemporary design
5. **Two Column ATS (Brussels)** - Two-column ATS layout

## 🚀 Running the App

### Backend Server
The backend server should be running in a PowerShell window at:
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Frontend Server
The frontend server should be running in a PowerShell window at:
- **URL**: http://localhost:3000

## ⚙️ Configuration

### Update OpenAI API Key

1. Open `backend/.env` file
2. Replace `your-openai-api-key` with your actual OpenAI API key from SomethingX project
3. The key should be in: `saarthix/SomethingX/.env` or `saarthix/SomethingX/env.example`

### MongoDB

Make sure MongoDB is running:
- Local MongoDB: Should be running on `mongodb://localhost:27017`
- If using Docker: `docker run -d -p 27017:27017 mongo`

## 📝 Using the App

1. **Open Browser**: Navigate to http://localhost:3000
2. **Create Resume**: Click "Create New Resume"
3. **Choose Template**: Select from 5 available templates
4. **Fill Information**: Add your personal info, experience, education, etc.
5. **Save**: Click "Save" to store your resume
6. **Export**: Click "Export PDF" to download your resume

## 🎨 Available Templates

- **Traditional**: Perfect for conservative industries
- **Professional**: Ideal for corporate roles
- **Prime ATS**: Maximum ATS compatibility
- **Modern**: Great for creative and tech roles
- **Two Column ATS**: Visual appeal with ATS compatibility

## 🔧 Troubleshooting

### Backend Not Starting
- Check if MongoDB is running
- Verify `.env` file exists in `backend/` directory
- Check if port 5000 is available

### Frontend Not Starting
- Check if port 3000 is available
- Verify `node_modules` are installed (`npm install`)

### Templates Not Showing
- Templates are already seeded in the database
- If needed, run: `cd backend && node scripts/seedTemplates.js`

## 📚 API Endpoints

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

## ✨ Next Steps

1. Update OpenAI API key in `backend/.env`
2. Open http://localhost:3000 in your browser
3. Start creating resumes!

---

**Note**: Make sure both backend and frontend PowerShell windows are open and running.
