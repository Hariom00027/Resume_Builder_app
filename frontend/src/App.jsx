import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import Templates from './pages/Templates';
import AdminTemplateSchemas from './pages/AdminTemplateSchemas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page — no gray bg wrapper so it owns its own background */}
        <Route path="/" element={<HomePage />} />

        {/* App pages — keep gray container */}
        <Route path="/dashboard" element={<div className="min-h-screen bg-gray-50"><Dashboard /></div>} />
        <Route path="/builder" element={<div className="min-h-screen bg-gray-50"><ResumeBuilder /></div>} />
        <Route path="/builder/:id" element={<div className="min-h-screen bg-gray-50"><ResumeBuilder /></div>} />
        <Route path="/templates" element={<div className="min-h-screen bg-gray-50"><Templates /></div>} />
        <Route path="/admin/template-schemas" element={<div className="min-h-screen bg-gray-50"><AdminTemplateSchemas /></div>} />
      </Routes>
    </Router>
  );
}

export default App;
