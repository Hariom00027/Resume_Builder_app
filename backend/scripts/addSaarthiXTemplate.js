/**
 * Add SaarthiX Special 1 template to MongoDB
 * 
 * Usage:
 *   node scripts/addSaarthiXTemplate.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

const templateHTML = `<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<title>Resume Template</title>

<style>

body{
margin:0;
background:#e6e6e6;
font-family: Calibri, Arial, Helvetica, sans-serif;
}

/* PAGE */

.resume{
width:794px;
min-height:1123px;
margin:40px auto;
display:flex;
background:white;
box-shadow:0 0 8px rgba(0,0,0,0.12);
}

/* LEFT SIDEBAR */

.left{
width:36%;
background:#f2f2f2;
padding:28px 24px;
box-sizing:border-box;
}

.photo img{
width:105px;
height:105px;
border-radius:50%;
object-fit:cover;
margin-bottom:18px;
}

.left h2{
font-size:15px;
font-weight:700;
margin-top:22px;
margin-bottom:6px;
border-bottom:2px solid #000;
padding-bottom:3px;
}

.left p{
font-size:12.5px;
line-height:1.45;
margin:6px 0;
}

.left ul{
padding-left:18px;
margin:6px 0;
}

.left li{
font-size:12.5px;
margin-bottom:4px;
}

.contact p{
margin:4px 0;
word-wrap:break-word;
overflow-wrap:break-word;
}

.contact p b{
display:inline-block;
min-width:60px;
}

/* RIGHT PANEL */

.right{
width:64%;
padding:32px 34px;
box-sizing:border-box;
}

/* NAME HEADER */

.header{
margin-bottom:22px;
}

.first-name{
font-size:32px !important;
font-weight:700 !important;
line-height:1.1 !important;
text-transform:uppercase !important;
letter-spacing:1px !important;
}

.last-name{
font-size:32px !important;
font-weight:700 !important;
line-height:1.1 !important;
text-transform:uppercase !important;
letter-spacing:1px !important;
}

.tagline{
font-size:13px;
color:#555;
margin-top:4px;
}

/* SECTION TITLES */

.right h2{
font-size:16px;
font-weight:700;
border-bottom:2px solid #000;
padding-bottom:3px;
margin-top:22px;
margin-bottom:6px;
}

.right h3{
font-size:14px;
margin-top:10px;
margin-bottom:4px;
}

/* TEXT */

.right p{
font-size:12.5px;
line-height:1.45;
margin:5px 0;
}

.right ul{
padding-left:20px;
margin:5px 0;
}

.right li{
font-size:12.5px;
margin-bottom:4px;
}

.section{
margin-bottom:18px;
}

.date{
font-size:12px;
color:#666;
}

</style>

</head>

<body>

<div class="resume">

<!-- LEFT SIDEBAR -->

<div class="left">

<div class="photo">
<img src="https://via.placeholder.com/110">
</div>

<h2>Profile</h2>
<p>Richard hails from Tulsa. He has earned degrees from the University of Oklahoma and Stanford. As a graduate student, he founded Pied Piper, a startup company that uses a data compression algorithm.</p>

<h2>Key Recognitions</h2>

<ul>
<li>Digital Compression Pioneer Award - Techcrunch, 2014</li>
<li>Techcrunch Disrupt Winner, 2014</li>
<li>Weisman Score Record Holder</li>
</ul>

<h2>Contact</h2>

<div class="contact">
<p><b>PHONE:</b> (123) 456-7890</p>
<p><b>City:</b> Palo Alto, CA</p>
<p><b>LinkedIn:</b> <a href="https://www.linkedin.com/in/richardhendricks" style="word-break: break-all; display: inline-block; max-width: 100%; overflow-wrap: break-word;">linkedin.com/in/richardhendricks</a></p>
<p><b>Email:</b> richard@piedpiper.com</p>
</div>

<h2>Key Accomplishments & Achievements & Certifications</h2>

<p>Founded Pied Piper and led it through initial funding rounds</p>
<p>Developed innovative compression technology approaching theoretical limits</p>
<p>Successfully won Techcrunch Disrupt competition</p>

</div>

<!-- RIGHT PANEL -->

<div class="right">

<div class="header">

<div class="first-name">RICHARD</div>
<div class="last-name">HENDRICKS</div>

<p class="tagline">
CEO/President at Pied Piper
</p>

</div>

<div class="section">

<h2>Profile</h2>

<h3>Entrepreneurial Mindset</h3>

<ul>
<li>Founded and scaled Pied Piper from concept to funded startup</li>
<li>Led team through Techcrunch Disrupt competition victory</li>
</ul>

<h3>Technical Leadership</h3>

<ul>
<li>Developed proprietary universal compression algorithm</li>
<li>Optimized lossless compression schema achieving record Weisman Scores</li>
<li>Applied information theory to solve real-world data challenges</li>
</ul>

<h3>Innovation</h3>

<ul>
<li>Created middle-out compression algorithm revolutionizing data storage</li>
<li>Built algorithm for copyright infringement detection in music</li>
<li>Approached theoretical limits of lossless compression</li>
</ul>

</div>

<div class="section">

<h2>Skills</h2>

<ul>
<li><b>Technical:</b> JavaScript, Python, React, Node.js, Data Compression, Information Theory</li>
<li><b>Non-Technical:</b> Leadership, Strategic Planning, Team Management, Public Speaking</li>
</ul>

</div>

<div class="section">

<h2>Experience</h2>

<h3>CEO/President – Pied Piper, Palo Alto, CA</h3>

<p>Role – CEO/President</p>

<p class="date">2013 – 2014</p>

<ul>
<li>Founded Pied Piper, a multi-platform technology company based on proprietary universal compression algorithm</li>
<li>Led the company through initial funding rounds and strategic partnerships</li>
<li>Developed compression technology that consistently fielded high Weisman Scores approaching theoretical limits</li>
<li>Successfully won Techcrunch Disrupt competition, establishing company credibility</li>
</ul>

</div>

<div class="section">

<h2>Education</h2>

<h3>B.tech</h3>

<p>Bundelkhand University</p>

<p>2022 – 2023</p>

<p>3.8</p>

</div>

</div>

</div>

</body>
</html>`;

async function addTemplate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB');

    const templateDoc = {
      templateId: 'saarthix-special-1',
      name: 'SaarthiX Special 1',
      category: 'saarthix-specials',
      description: 'A professional two-column resume template with sidebar, perfect for students and professionals.',
      previewImage: '',
      thumbnailImage: '',
      templateConfig: {
        html: templateHTML,
        css: '/* CSS is embedded in HTML */',
        sections: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications', 'achievements'],
        layout: 'two-column',
        colors: { primary: '#000000', secondary: '#666666' }
      },
      isPremium: false,
      isActive: true
    };

    const result = await ResumeTemplate.findOneAndUpdate(
      { templateId: 'saarthix-special-1' },
      templateDoc,
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`\n✅ Successfully added/updated template: ${result.name}`);
    console.log(`   Template ID: ${result.templateId}`);
    console.log(`   Category: ${result.category}`);
    process.exit(0);
  } catch (error) {
    console.error('Error adding template:', error);
    process.exit(1);
  }
}

addTemplate();
