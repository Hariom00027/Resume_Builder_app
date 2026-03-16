/**
 * Add SaarthiX Special 2 template to MongoDB
 * 
 * Usage:
 *   node scripts/addSaarthiXTemplate2.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

const templateHTML = `<!DOCTYPE html>

<html>
<head>
<meta charset="UTF-8">
<title>Saarthi Resume Template</title>

<style>

body{
margin:0;
background:#e6e6e6;
font-family:Calibri, Arial, sans-serif;
}

.resume{
width:794px;
margin:auto;
background:white;
padding:40px;
border:1px solid #cfcfcf;
box-shadow:0 0 6px rgba(0,0,0,0.15);
}

/* NAME */

.name{
font-size:32px;
font-weight:700;
margin-bottom:5px;
}

/* CONTACT */

.contact{
font-size:14px;
margin-bottom:25px;
color:#333;
}

/* SECTION TITLE WITH GREY BOX */

.section-title{
background:#efefef;
padding:6px 10px;
font-size:16px;
font-weight:700;
margin-top:25px;
border-left:4px solid #555;
}

/* TEXT */

p{
font-size:14px;
line-height:1.5;
margin-top:8px;
}

ul{
padding-left:20px;
margin-top:8px;
}

li{
font-size:14px;
margin-bottom:6px;
}

/* EXPERIENCE */

.exp{
margin-top:15px;
margin-bottom:15px;
}

.exp-header{
font-weight:700;
font-size:15px;
}

.date{
float:right;
font-size:13px;
color:#555;
}

.clear{
clear:both;
}

/* EDUCATION BLOCK */

.edu-title{
font-weight:700;
margin-top:10px;
}

</style>

</head>

<body>

<div class="resume layout-saarthix-2">

<div class="name">Richard Hendricks</div>

<div class="contact">
Email: richard@piedpiper.com | Phone: +91-1234567890 | LinkedIn: https://www.linkedin.com/in/richardhendricks | Palo Alto, CA
</div>

<div class="section-title" data-section="summary">PROFESSIONAL SYNOPSIS</div>

<div id="container-summary">
<p>
Entrepreneur and software engineer best known as the founder of Pied Piper, a Silicon Valley startup focused on revolutionary data compression technology. Richard specializes in algorithm design, distributed systems, and scalable cloud-based platforms.
</p>
<p>
Creator of the groundbreaking middle-out compression algorithm that achieved record-breaking Weisman Scores and pushed lossless compression close to theoretical limits. Proven leader capable of building innovative engineering teams and turning cutting-edge research into real-world technology products.
</p>
</div>

<div class="section-title" data-section="dna">MY DNA</div>

<ul id="container-dna">

<li><b>Entrepreneurial Leadership</b> – Founded Pied Piper and built a startup from concept to funded technology company.</li>

<li><b>Algorithm Innovation</b> – Invented the middle-out compression algorithm that revolutionized data compression techniques.</li>

<li><b>Technical Excellence</b> – Deep expertise in information theory, distributed systems, and performance optimization.</li>

<li><b>Startup Execution</b> – Successfully led team through the TechCrunch Disrupt competition and early funding stages.</li>

<li><b>Problem Solving</b> – Applies advanced mathematics and engineering principles to solve complex real-world data challenges.</li>

<li><b>Visionary Thinking</b> – Constantly explores new technologies and innovative approaches to computing problems.</li>

</ul>

<div class="section-title" data-section="experience">EXPERIENCE</div>

<div id="container-experience">
  <div class="exp">
  <div class="exp-header">
  Pied Piper Startup
  <span class="date">2013 – 2014</span>
  </div>

  <div class="clear"></div>

  <ul>

  <li><b>Company Name:</b> Pied Piper Inc.</li>

  <li><b>Project:</b> Development of a universal lossless compression platform capable of compressing large datasets efficiently.</li>

  <li><b>Role:</b> Founder and CEO responsible for algorithm design, technical architecture, investor presentations, and leading a small engineering team.</li>

  <li><b>Key Skill used:</b> Python, JavaScript, Distributed Systems, Data Compression Algorithms</li>

  <li><b>Achievements:</b> Won TechCrunch Disrupt and achieved the highest recorded Weisman Score.</li>

  </ul>

  </div>

  <div class="exp">

  <div class="exp-header">
  Hooli Internship
  <span class="date">2012 – 2013</span>
  </div>

  <div class="clear"></div>

  <ul>

  <li><b>Company Name:</b> Hooli</li>

  <li><b>Project:</b> Worked on distributed cloud infrastructure optimization for large-scale enterprise systems.</li>

  <li><b>Role:</b> Software engineering intern developing performance improvements for internal distributed platforms.</li>

  <li><b>Key Skill used:</b> JavaScript, Node.js, System Optimization</li>

  <li><b>Achievements:</b> Recognized internally for innovative algorithm design ideas.</li>

  </ul>

  </div>

  <div class="exp">

  <div class="exp-header">
  Freelance Software Projects
  <span class="date">2011 – 2012</span>
  </div>

  <div class="clear"></div>

  <ul>

  <li><b>Company Name:</b> Independent Projects</li>

  <li><b>Project:</b> Built compression utilities and experimental data-processing tools.</li>

  <li><b>Role:</b> Independent developer focusing on algorithm experimentation and prototype systems.</li>

  <li><b>Key Skill used:</b> Python, Data Structures, Algorithm Design</li>

  <li><b>Achievements:</b> Early prototype of the middle-out compression algorithm.</li>

  </ul>

  </div>
</div>

<div class="section-title" data-section="skills">SKILLS</div>

<ul id="container-skills">

<li><b>Technical:</b> Python, JavaScript, React, Node.js, Data Compression, Distributed Systems, Information Theory</li>

<li><b>Non-Technical:</b> Leadership, Strategic Thinking, Startup Management, Public Speaking</li>

</ul>

<div class="section-title" data-section="certifications">TRAINING PROGRAMMES & CERTIFICATIONS</div>

<ul id="container-certifications">

<li>Advanced Algorithms & Data Structures – Stanford University</li>

<li>Startup Founder Program – Silicon Valley Accelerator</li>

<li>Machine Learning Foundations Certification</li>

</ul>

<div class="section-title" data-section="achievements">ACHIEVEMENTS</div>

<ul id="container-achievements">

<li>Winner – TechCrunch Disrupt Startup Competition</li>

<li>Highest Weisman Score in compression benchmarking</li>

</ul>

<div class="section-title" data-section="education">EDUCATIONAL CREDENTIALS</div>

<div id="container-education">
  <div class="edu-title">Graduation: Computer Science</div>

  <ul>

  <li>Stanford University, Palo Alto</li>

  <li>2010 – 2013</li>

  <li>GPA: 3.8</li>

  <li>Electives / Subjects: Algorithms, Distributed Systems, Information Theory</li>

  </ul>

  <div class="edu-title">XII / Inter: Science</div>

  <ul>

  <li>Tulsa Central High School</li>

  <li>2008 – 2010</li>

  <li>Percentage: 92%</li>

  <li>Electives / Subjects: Mathematics, Physics, Computer Science</li>

  </ul>

  <div class="edu-title">X / High School: Science</div>

  <ul>

  <li>Tulsa Public School</li>

  <li>2006 – 2008</li>

  <li>Percentage: 89%</li>

  </ul>
</div>

</div>

</body>
</html>`;

async function addTemplate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB');

    const templateDoc = {
      templateId: 'saarthix-special-2',
      name: 'SaarthiX Special 2',
      category: 'saarthix-specials',
      description: 'A professional one-column resume template with clean grey section headers.',
      previewImage: '',
      thumbnailImage: '',
      templateConfig: {
        html: templateHTML,
        css: '/* CSS is embedded in HTML */',
        sections: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications', 'achievements'],
        layout: 'single-column',
        colors: { primary: '#000000', secondary: '#efefef' }
      },
      templateSchema: {
        layoutType: 'single-column',
        sections: [
          {
            title: 'Contact Info',
            selector: '.contact',
            type: 'contact',
            isArray: false,
            fields: [
              { name: 'fullName', label: 'Full Name', type: 'text', selector: '.name' },
              { name: 'email', label: 'Email', type: 'email', selector: '.contact' },
              { name: 'phone', label: 'Phone', type: 'tel', selector: '.contact' },
              { name: 'linkedin', label: 'LinkedIn', type: 'url', selector: '.contact' },
              { name: 'location', label: 'Location', type: 'text', selector: '.contact' }
            ]
          },
          {
            title: 'Summary',
            selector: '#container-summary',
            type: 'summary',
            isArray: false,
            fields: [
              { name: 'summary', label: 'Professional Synopsis', type: 'textarea', selector: '#container-summary p' }
            ]
          },
          {
            title: 'My DNA (Key Achievements)',
            selector: '#container-dna',
            type: 'awards',
            isArray: true,
            fields: [
              { name: 'description', label: 'Metric/Achievement', type: 'textarea', selector: '#container-dna li' }
            ]
          },
          {
            title: 'Experience',
            selector: '#container-experience',
            type: 'experience',
            isArray: true,
            fields: [
              { name: 'company', label: 'Company Name', type: 'text', selector: '.exp ul li:nth-child(1)' },
              { name: 'description', label: 'Project', type: 'textarea', selector: '.exp ul li:nth-child(2)' },
              { name: 'role', label: 'Role', type: 'text', selector: '.exp ul li:nth-child(3)' },
              { name: 'keySkills', label: 'Key Skill used', type: 'text', selector: '.exp ul li:nth-child(4)' },
              { name: 'achievements', label: 'Achievements', type: 'textarea', selector: '.exp ul li:nth-child(5)' },
              { name: 'startDate', label: 'Start Date', type: 'date', selector: '.date' },
              { name: 'endDate', label: 'End Date', type: 'date', selector: '.date' }
            ]
          },
          {
            title: 'Skills',
            selector: '#container-skills',
            type: 'skills',
            isArray: true,
            fields: [
              { name: 'name', label: 'Skill Set', type: 'text', selector: '#container-skills li' }
            ]
          },
          {
            title: 'Certifications',
            selector: '#container-certifications',
            type: 'certifications',
            isArray: true,
            fields: [
              { name: 'name', label: 'Certification Name', type: 'text', selector: '#container-certifications li' }
            ]
          },
          {
            title: 'Education',
            selector: '#container-education',
            type: 'education',
            isArray: true,
            fields: [
              { name: 'degree', label: 'Degree / Certificate', type: 'text', selector: '.edu-title' },
              { name: 'institution', label: 'Institution', type: 'text', selector: 'ul li:nth-child(1)' },
              { name: 'startDate', label: 'Start Year', type: 'date', selector: 'ul li:nth-child(2)' },
              { name: 'endDate', label: 'End Year', type: 'date', selector: 'ul li:nth-child(2)' },
              { name: 'gpa', label: 'Percentage / GPA', type: 'text', selector: 'ul li:nth-child(3)' },
              { name: 'description', label: 'Electives / Subjects', type: 'textarea', selector: 'ul li:nth-child(4)' }
            ]
          }
        ]
      },
      isPremium: true,
      isActive: true
    };

    const result = await ResumeTemplate.findOneAndUpdate(
      { templateId: 'saarthix-special-2' },
      templateDoc,
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`\\n✅ Successfully added/updated template: ${result.name}`);
    console.log(`   Template ID: ${result.templateId}`);
    console.log(`   Category: ${result.category}`);
    process.exit(0);
  } catch (error) {
    console.error('Error adding template:', error);
    process.exit(1);
  }
}

addTemplate();
