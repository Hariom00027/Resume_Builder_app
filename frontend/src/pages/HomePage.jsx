import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI, templateAPI } from '../services/api';

// ── Data ─────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  'AI Resume Builder', 'ATS Optimizer', 'Job Matcher', 'Auto-Tailor',
  'Phrase Library', 'Export to PDF', 'Export to DOCX', 'Real-time Preview',
  'AI Resume Builder', 'ATS Optimizer', 'Job Matcher', 'Auto-Tailor',
];

const FEATURES = [
  { icon: '🤖', title: 'AI Writes For You', desc: 'Stuck on wording? Click to generate professional, ATS-optimized bullet points with one click using GPT-4o.' },
  { icon: '📊', title: 'Real-time ATS Score', desc: 'See your ATS score update live as you type. Know exactly how recruiter-friendly your resume is before you apply.' },
  { icon: '🎯', title: 'Job Description Matcher', desc: 'Paste a job description to instantly see which keywords you have and which you are missing.' },
  { icon: '✨', title: 'Auto-Tailor to Any Job', desc: 'Let AI rewrite your summary and experience bullets to perfectly match any job description you target.' },
  { icon: '📚', title: 'Phrase Library', desc: '100+ pre-written, recruiter-approved bullet phrases organized by role. Pick, click, and insert instantly.' },
  { icon: '📄', title: 'Export to PDF & DOCX', desc: 'Download your polished resume as a PDF or Word doc in seconds — no formatting headaches.' },
];

const BLOG_POSTS = [
  { tag: 'Field Tested', tagColor: 'bg-blue-100 text-blue-700', title: 'How to Write a Resume: Expert Guide & Examples', desc: 'A step-by-step guide covering every section from summary to skills — with real examples that get callbacks.', readTime: '8 min read', icon: '📝' },
  { tag: 'HR Approved', tagColor: 'bg-green-100 text-green-700', title: 'How to Write a Cover Letter That Gets You Hired', desc: 'The exact formula hiring managers look for — plus templates you can adapt in under 10 minutes.', readTime: '6 min read', icon: '✉️' },
  { tag: 'Career', tagColor: 'bg-orange-100 text-orange-700', title: 'How to Ask for a Promotion (without Awkwardness)', desc: 'Real scripts, timing tips, and the data you need to walk in and make your case confidently.', readTime: '5 min read', icon: '🚀' },
];

const FAQS = [
  { q: 'How many pages should my resume be?', a: 'For most professionals with less than 10 years of experience, one page is ideal. Two pages are acceptable for senior roles. Longer CVs are standard in academic or research contexts.' },
  { q: 'What is the difference between a resume and a CV?', a: 'A resume is a concise 1-2 page document summarizing your experience for a specific job. A CV (Curriculum Vitae) is a comprehensive academic record used primarily in Europe and for research & academic positions.' },
  { q: 'Can I change my template after building my resume?', a: 'Yes! Your data is stored separately from the template. You can switch between any of our templates at any time without losing your content.' },
  { q: 'How far back should my resume go?', a: 'Generally 10-15 years of relevant experience. Older roles can be summarized or omitted unless they are highly relevant to the position you are applying for.' },
  { q: 'Is this resume builder ATS-friendly?', a: 'Absolutely. Our templates are designed with ATS compatibility in mind. We also provide a real-time ATS score and keyword analysis to help you maximize your chances.' },
  { q: 'Can I download my resume as a Word document?', a: 'Yes! You can export your resume as a PDF or DOCX (Word) file at any time from the resume builder.' },
];

const STATS = [
  { value: '40+', label: 'Resume Templates' },
  { value: '6', label: 'AI-Powered Features' },
  { value: '100%', label: 'ATS Compatible' },
  { value: '2', label: 'Export Formats (PDF & DOCX)' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Navbar({ onGetStarted }) {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SaarthiX</span>
          <span className="text-xs text-slate-400 mt-1">Resume Builder</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-600 font-medium">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#templates" className="hover:text-indigo-600 transition-colors">Templates</a>
          <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors">My Resumes</button>
          <button onClick={onGetStarted} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30">
            Create Resume →
          </button>
        </div>
      </div>
    </nav>
  );
}

function FeatureTicker() {
  return (
    <div className="overflow-hidden bg-indigo-600 py-2.5">
      <div className="flex gap-0 animate-marquee whitespace-nowrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-white text-xs font-semibold px-6">
            <span className="w-1.5 h-1.5 bg-white/60 rounded-full inline-block" />
            {item.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden cursor-pointer" onClick={() => setOpen(o => !o)}>
      <div className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-slate-800 text-sm pr-4">{q}</span>
        <span className={`text-indigo-500 font-bold text-lg flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      {open && (
        <div className="px-5 pb-5 pt-1 bg-slate-50 text-sm text-slate-600 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

// ── Template Carousel ─────────────────────────────────────────────────────────

function TemplateCarousel() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const VISIBLE = 3;

  useEffect(() => {
    templateAPI.getAll(null).then(r => {
      if (r.data && Array.isArray(r.data)) setTemplates(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const total = templates.length;
  // Infinite: wrap with modulo
  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const next = () => setCurrent(c => (c + 1) % total);
  // Build 3 visible cards with wrapping
  const getWrapped = (idx) => templates[(idx + total) % total];
  const visibleSlots = [-1, 0, 1].map(offset => ({
    template: getWrapped(current + offset),
    isCenter: offset === 0,
  }));

  if (loading) {
    return (
      <div className="flex gap-8 justify-center py-16">
        {[0, 1, 2].map(i => (
          <div key={i} className={`rounded-3xl flex-shrink-0 animate-pulse ${
            i === 1 ? 'w-72 h-[420px] bg-white/10' : 'w-60 h-[360px] bg-white/5'
          }`} />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        <p className="text-sm mb-3">No templates loaded yet.</p>
        <button onClick={() => navigate('/templates')} className="text-indigo-300 font-bold text-sm hover:text-white transition-colors">Go to Templates page →</button>
      </div>
    );
  }

  return (
    <div className="relative px-12">
      {/* Cards */}
      <div className="flex gap-6 justify-center items-center">
        {visibleSlots.map(({ template, isCenter }, idx) => {
          return (
            <div
              key={template._id}
              onClick={() => navigate(`/builder?template=${template.templateId}`)}
              className="group cursor-pointer flex-shrink-0 relative transition-all duration-500"
              style={{
                width: isCenter ? 288 : 240,
                transform: isCenter ? 'scale(1.08)' : 'scale(0.92)',
                zIndex: isCenter ? 10 : 1,
                opacity: isCenter ? 1 : 0.65,
              }}
            >
              {/* Glow ring — orange for SaarthiX Specials, indigo for others */}
              {isCenter && (
                <div className={`absolute -inset-1 rounded-3xl opacity-75 blur-sm animate-pulse ${
                  template.category === 'saarthix-specials'
                    ? 'bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400'
                    : 'bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400'
                }`} />
              )}

              {/* Card box */}
              <div className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 ${
                isCenter
                  ? (template.category === 'saarthix-specials'
                      ? 'border-orange-400/60 shadow-2xl shadow-orange-900/50'
                      : 'border-white/40 shadow-2xl shadow-indigo-900/60')
                  : (template.category === 'saarthix-specials'
                      ? 'border-orange-500/40 shadow-lg shadow-orange-900/30 hover:border-orange-400/60'
                      : 'border-white/10 shadow-lg hover:border-white/25')
              }`}>
                {/* iframe preview */}
                <div className="bg-white overflow-hidden relative" style={{ height: isCenter ? 380 : 320 }}>
                  <iframe
                    title={`${template.name} preview`}
                    srcDoc={template.templateConfig?.html || '<div style="padding:24px;color:#aaa;font-family:sans-serif;">No preview</div>'}
                    className="border-0 pointer-events-none"
                    style={{
                      width: '794px',
                      height: '1123px',
                      transform: isCenter ? 'scale(0.363)' : 'scale(0.302)',
                      transformOrigin: 'top left',
                    }}
                    sandbox="allow-same-origin"
                  />
                  {/* Hover CTA overlay */}
                  <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/40 transition-all duration-300 flex items-center justify-center backdrop-blur-0 group-hover:backdrop-blur-[1px]">
                    <span className="bg-white text-indigo-700 text-xs font-black px-5 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl transform translate-y-2 group-hover:translate-y-0">
                      Use This Template →
                    </span>
                  </div>
                  {/* Category badge */}
                  {template.category && (
                    <div className="absolute top-3 left-3">
                      <span className={`backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        template.category === 'saarthix-specials'
                          ? 'bg-orange-500/90'
                          : 'bg-indigo-600/90'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className={`p-4 ${
                  isCenter
                    ? 'bg-gradient-to-r from-indigo-900 to-purple-900'
                    : 'bg-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{template.name}</h3>
                      {template.description && (
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{template.description}</p>
                      )}
                    </div>
                    {isCenter && (
                      <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-indigo-400 flex items-center justify-center text-white text-xs font-bold transition-colors">
                        →
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrow buttons — always enabled, no disabled state */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/50 flex items-center justify-center text-white text-xl font-bold transition-all backdrop-blur-sm"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/50 flex items-center justify-center text-white text-xl font-bold transition-all backdrop-blur-sm"
          >
            ›
          </button>
        </>
      )}

      {/* Dots — one per template, infinite position wraps */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {templates.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [resumeCount, setResumeCount] = useState(0);

  useEffect(() => {
    resumeAPI.getAll().then(r => setResumeCount((r.data || []).length)).catch(() => {});
  }, []);

  const handleGetStarted = () => navigate('/templates');

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .animate-marquee { animation: marquee 30s linear infinite; min-width: 200%; }
        @keyframes float { 0%, 100% { transform: translateY(0px) } 50% { transform: translateY(-12px) } }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        .animate-fade-up { animation: fadeUp 0.7s ease-out forwards; }
        .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
      `}</style>

      <Navbar onGetStarted={handleGetStarted} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white relative overflow-hidden">
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/30 to-purple-200/20 rounded-full blur-3xl -translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-200/20 to-cyan-200/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                🤖 AI-Powered Resume Builder
              </div>
              <h1 className="text-5xl font-black text-slate-900 leading-tight mb-6">
                Only 2% of resumes win. <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Yours will.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">
                Build a professional, ATS-optimized resume in minutes — not hours. Our AI writes, optimizes, and tailors your resume to any job description.
              </p>
              <div className="flex items-center gap-3 mb-8 text-sm text-slate-500">
                <span>✅ Free to start</span>
                <span>·</span>
                <span>📄 PDF & DOCX export</span>
                <span>·</span>
                <span>⚡ 5-minute setup</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleGetStarted} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/40 hover:scale-105 active:scale-95">
                  Create My Resume →
                </button>
                {resumeCount > 0 && (
                  <button onClick={() => navigate('/dashboard')} className="bg-white text-slate-700 px-8 py-4 rounded-2xl font-bold text-base border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                    My Resumes ({resumeCount})
                  </button>
                )}
              </div>
            </div>

            {/* Right: Floating resume mockup */}
            <div className="relative flex justify-center items-center">
              <div className="animate-float relative">
                <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-10 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">R</div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Richard Hendricks</div>
                      <div className="text-xs text-slate-500">CEO, Pied Piper</div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="h-2 bg-slate-100 rounded-full w-full" />
                    <div className="h-2 bg-slate-100 rounded-full w-4/5" />
                    <div className="h-2 bg-slate-100 rounded-full w-3/4" />
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {['React', 'Node.js', 'AWS', 'Python'].map(s => (
                        <span key={s} className="bg-indigo-50 text-indigo-700 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-3 z-20 w-32">
                  <div className="text-[10px] text-slate-400 font-medium mb-1">ATS Score</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-black text-green-600">94</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-3 z-20">
                  <div className="text-[10px] text-slate-400 font-medium mb-1">🎯 Job Match</div>
                  <div className="text-sm font-bold text-indigo-700">87% match</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE TICKER ───────────────────────────────────────────────── */}
      <FeatureTicker />

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{value}</div>
              <div className="text-sm text-slate-500 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              ✨ Way Beyond a Resume Builder
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">Everything you need to<br />land the interview</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Not just a word processor. A full career toolkit, powered by AI and trusted by thousands.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group cursor-pointer">
                <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors">{icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={handleGetStarted} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30">
              Try All Features Free →
            </button>
          </div>
        </div>
      </section>

      {/* ── TEMPLATE CAROUSEL ────────────────────────────────────────────── */}
      <section id="templates" className="py-28 px-6 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
        {/* Decorative blur orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-800/10 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, white, white 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white, white 1px, transparent 1px, transparent 60px)' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-full mb-5 border border-white/20 backdrop-blur-sm">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              🎨 Premium Templates
            </div>
            <h2 className="text-5xl font-black text-white mb-5 leading-tight">
              Templates recruiters
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">actually love</span>
            </h2>
            <p className="text-white/50 text-lg max-w-lg mx-auto">ATS-optimized designs that stand out. Download to PDF or Word in one click.</p>

            {/* Mini stat pills */}
            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              {['✅ ATS Optimized', '🎨 40+ Designs', '📄 PDF & DOCX', '⚡ Instant Download'].map(pill => (
                <span key={pill} className="text-xs font-semibold text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{pill}</span>
              ))}
            </div>
          </div>

          {/* Carousel */}
          <TemplateCarousel />

          {/* CTA */}
          <div className="text-center mt-14">
            <button
              onClick={() => navigate('/templates')}
              className="bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-2xl shadow-indigo-900/50 hover:scale-105 active:scale-95"
            >
              Browse All Templates →
            </button>
            <p className="text-white/30 text-xs mt-3">Click any template to start building instantly</p>
          </div>
        </div>
      </section>

      {/* ── BLOG / EXPERT ADVICE ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                📖 Expert Advice
              </div>
              <h2 className="text-4xl font-black text-slate-900">Need some expert<br />career advice?</h2>
            </div>
            <button className="text-indigo-600 font-bold text-sm hover:text-indigo-700 hidden md:flex items-center gap-1">Read the blog →</button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {BLOG_POSTS.map(({ tag, tagColor, title, desc, readTime, icon }) => (
              <div key={title} className="group bg-white border border-slate-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer">
                <div className="text-4xl mb-4">{icon}</div>
                <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-full mb-3 ${tagColor}`}>{tag}</div>
                <h3 className="font-bold text-slate-800 mb-2 leading-snug group-hover:text-indigo-700 transition-colors">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{desc}</p>
                <span className="text-xs text-slate-400 font-medium">🕐 {readTime}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            ⭐ Trusted by Job Seekers
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">Join thousands who got<br />hired using SaarthiX</h2>
          <p className="text-slate-500 text-lg mb-12">Real results from real users</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "The ATS score feature told me exactly what was missing. After updating my resume, I got 3 interview calls within a week!", name: "Priya S.", role: "Software Engineer", stars: 5 },
              { quote: "The Auto-Tailor feature is magic. I was able to customize my resume for 10 different jobs in under an hour. Got my dream job!", name: "Rahul K.", role: "Product Manager", stars: 5 },
              { quote: "The phrase library alone saved me hours. The bullets are professional and recruiters noticed immediately. Highly recommend.", name: "Ananya M.", role: "Marketing Manager", stars: 5 },
            ].map(({ quote, name, role, stars }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-left">
                <div className="flex mb-3">{Array.from({ length: stars }).map((_, i) => <span key={i} className="text-amber-400">★</span>)}</div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{name[0]}</div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{name}</div>
                    <div className="text-xs text-slate-400">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">❓ FAQ</div>
            <h2 className="text-4xl font-black text-slate-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Start now and get hired faster.</h2>
          <p className="text-indigo-200 text-lg mb-10">Join thousands of job seekers who landed their dream role using SaarthiX.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleGetStarted} className="bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black text-base hover:bg-indigo-50 transition-all shadow-2xl hover:scale-105 active:scale-95">
              Create My Resume — It's Free →
            </button>
            {resumeCount > 0 && (
              <button onClick={() => navigate('/dashboard')} className="text-white border-2 border-white/40 px-8 py-4 rounded-2xl font-bold hover:border-white transition-all">
                View My Resumes ({resumeCount})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">SaarthiX</div>
              <p className="text-sm leading-relaxed text-slate-500">Your AI-powered career partner. Build better resumes. Land better jobs.</p>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                {['AI Resume Builder', 'ATS Scorer', 'Job Matcher', 'Phrase Library', 'Templates'].map(item => (
                  <li key={item}><button onClick={handleGetStarted} className="hover:text-white transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                {['How to Write a Resume', 'Resume Examples', 'Cover Letter Guide', 'Interview Tips', 'Career Blog'].map(item => (
                  <li key={item}><span className="hover:text-white transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {['About Us', 'Pricing', 'Contact', 'Privacy Policy', 'Terms of Service'].map(item => (
                  <li key={item}><span className="hover:text-white transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">© 2025 SaarthiX. All rights reserved.</p>
            <p className="text-xs text-slate-600">Made with ❤️ to help you land your dream job.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
