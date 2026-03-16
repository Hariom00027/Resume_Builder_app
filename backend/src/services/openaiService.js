const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI only if API key is available
let openai = null;
const apiKey = process.env.OPENAI_API_KEY?.trim();
if (apiKey && apiKey !== 'your-openai-api-key' && apiKey.length > 10) {
  try {
    openai = new OpenAI({
      apiKey: apiKey
    });
    console.log('OpenAI initialized successfully');
  } catch (error) {
    console.error('OpenAI initialization failed:', error.message);
  }
} else {
  console.warn('OpenAI API key not configured or invalid. AI features will be disabled.');
  console.warn('API key length:', apiKey?.length || 0);
}

class OpenAIService {
  /**
   * Generate professional summary from work history
   */
  async generateSummary(experience, education, skills) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const prompt = `Based on the following information, generate a professional, compelling resume summary (2-3 sentences, 100-150 words):

Work Experience:
${experience.map(exp => `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate})`).join('\n')}

Education:
${education.map(edu => `- ${edu.degree} from ${edu.institution}`).join('\n')}

Skills:
${skills.join(', ')}

Generate a professional summary that highlights key achievements, skills, and career objectives. Make it compelling and tailored for job applications.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional resume writer. Create compelling, professional resume summaries.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Optimize bullet points for work experience
   */
  async optimizeBullets(achievements, role, company) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const prompt = `Optimize the following work experience bullet points to be more impactful and achievement-oriented. Use action verbs and quantify results where possible.

Role: ${role} at ${company}
Current bullets:
${achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Return optimized bullet points (one per line) that:
- Start with strong action verbs
- Quantify achievements with numbers/percentages
- Highlight impact and results
- Are concise and professional`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional resume writer specializing in optimizing work experience descriptions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const optimized = response.choices[0].message.content.trim();
      return optimized.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('Error optimizing bullets:', error);
      throw new Error('Failed to optimize bullet points');
    }
  }

  /**
   * Generate bullet points for work experience from scratch
   */
  async generateExperienceBullets(role, company, keywords = '') {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      let prompt = `Generate 5 to 7 high-impact, professional resume bullet points for the following position:
Role: ${role}
Company: ${company}`;

      if (keywords && keywords.trim()) {
        prompt += `\nPlease incorporate these specific keywords/focus areas: ${keywords}`;
      }

      prompt += `\n
Return the generated bullet points as a JSON object with a single "bullets" array containing the strings. Do not include introductory text or markdown formatting outside of the JSON.
Requirements for each bullet point:
- Start with a strong action verb.
- Focus on achievements and impact, not just responsibilities.
- Incorporate realistic placeholder metrics (e.g., "[X]%") if specific numbers aren't provided.
- Keep them concise and tailored to industry standards for this role.

Example format:
{
  "bullets": [
    "Engineered a scalable data pipeline using Python, reducing processing time by 30%.",
    "Led a cross-functional team of 5 developers to deliver the MVP ahead of schedule."
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert resume writer and career coach specializing in ATS-optimized bullet points. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      if (parsed.bullets && Array.isArray(parsed.bullets)) {
        return parsed.bullets;
      } else {
        throw new Error('AI response did not contain a bullets array');
      }
      
    } catch (error) {
      console.error('Error generating bullets:', error);
      throw new Error('Failed to generate bullet points');
    }
  }

  /**
   * Generate section-specific content for resume sections
   * Supports: summary, experience, education, projects, certifications, skills, achievements
   */
  async generateSectionContent(sectionType, sectionData = {}, keywords = '') {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      let systemPrompt = '';
      let userPrompt = '';
      let responseFormat = { type: 'json_object' };
      let maxTokens = 800;
      let temperature = 0.7;

      // Section-specific configurations
      switch (sectionType.toLowerCase()) {
        case 'summary':
        case 'about':
        case 'profile':
          systemPrompt = 'You are an expert resume writer specializing in professional summaries. Create compelling, concise summaries that highlight key achievements, skills, and career objectives.';
          userPrompt = `Generate a professional resume summary (2-3 sentences, 100-150 words) based on the following information:

${sectionData.experience ? `Work Experience:\n${Array.isArray(sectionData.experience) ? sectionData.experience.map(exp => `- ${exp.role || exp.position || exp.title || 'Role'} at ${exp.company || 'Company'}`).join('\n') : sectionData.experience}` : ''}

${sectionData.education ? `Education:\n${Array.isArray(sectionData.education) ? sectionData.education.map(edu => `- ${edu.degree || edu.qualification || 'Degree'} from ${edu.institution || edu.school || 'Institution'}`).join('\n') : sectionData.education}` : ''}

${sectionData.skills ? `Skills: ${Array.isArray(sectionData.skills) ? sectionData.skills.join(', ') : sectionData.skills}` : ''}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Generate a professional summary that:
- Highlights key achievements and skills
- Is tailored for job applications
- Is compelling and professional
- Incorporates relevant keywords naturally

Return a JSON object with a "content" field containing the summary text.`;
          maxTokens = 200;
          break;

        case 'experience':
        case 'work':
        case 'employment':
          systemPrompt = 'You are an expert resume writer specializing in work experience bullet points. Create achievement-oriented, impactful descriptions.';
          userPrompt = `Generate 5 to 7 high-impact, professional resume bullet points for the following position:
Role: ${sectionData.role || sectionData.position || sectionData.title || 'Role'}
Company: ${sectionData.company || sectionData.organization || 'Company'}

${sectionData.startDate || sectionData.endDate ? `Duration: ${sectionData.startDate || ''} - ${sectionData.endDate || 'Present'}` : ''}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Requirements:
- Start each bullet with a strong action verb (Led, Built, Developed, Scaled, etc.)
- Focus on achievements and impact, not just responsibilities
- Incorporate realistic metrics where possible (e.g., "[X]%", "[X] users", "[X] team members")
- Keep them concise and tailored to industry standards
- Use ATS-friendly language

Return a JSON object with a "bullets" array containing the bullet point strings.`;
          break;

        case 'education':
        case 'qualifications':
          systemPrompt = 'You are an expert resume writer specializing in education sections. Create clear, professional education descriptions.';
          userPrompt = `Generate professional education description content for:

Degree: ${sectionData.degree || sectionData.qualification || 'Degree'}
Institution: ${sectionData.institution || sectionData.school || sectionData.university || 'Institution'}
${sectionData.fieldOfStudy ? `Field of Study: ${sectionData.fieldOfStudy}` : ''}
${sectionData.gpa || sectionData.grade ? `GPA/Grade: ${sectionData.gpa || sectionData.grade}` : ''}
${sectionData.startDate || sectionData.endDate ? `Duration: ${sectionData.startDate || ''} - ${sectionData.endDate || ''}` : ''}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Generate:
1. A concise description highlighting key coursework, achievements, or relevant details (2-3 sentences)
2. 2-3 bullet points highlighting academic achievements, relevant coursework, honors, or projects

Return a JSON object with:
- "description": string (main description)
- "bullets": array of strings (achievement bullets)`;
          break;

        case 'projects':
        case 'project':
          systemPrompt = 'You are an expert resume writer specializing in project descriptions. Create compelling project showcases.';
          userPrompt = `Generate professional project description content for:

Project Name: ${sectionData.name || sectionData.title || 'Project'}
${sectionData.technologies ? `Technologies: ${Array.isArray(sectionData.technologies) ? sectionData.technologies.join(', ') : sectionData.technologies}` : ''}
${sectionData.url ? `URL: ${sectionData.url}` : ''}
${sectionData.startDate || sectionData.endDate ? `Duration: ${sectionData.startDate || ''} - ${sectionData.endDate || ''}` : ''}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Generate:
1. A brief project overview (1-2 sentences)
2. 3-5 bullet points describing:
   - Technologies used and technical challenges solved
   - Key features and functionality
   - Impact or results achieved
   - Your specific contributions

Return a JSON object with:
- "description": string (project overview)
- "bullets": array of strings (detailed bullet points)`;
          break;

        case 'certifications':
        case 'certification':
        case 'certificates':
          systemPrompt = 'You are an expert resume writer specializing in certification descriptions. Create professional certification entries.';
          userPrompt = `Generate professional certification description content for:

Certification Name: ${sectionData.name || sectionData.title || 'Certification'}
Issuer: ${sectionData.issuer || sectionData.organization || 'Issuer'}
${sectionData.date ? `Date: ${sectionData.date}` : ''}
${sectionData.url ? `URL: ${sectionData.url}` : ''}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Generate:
1. A brief description of what this certification demonstrates (1-2 sentences)
2. 2-3 bullet points highlighting:
   - Key skills or knowledge areas covered
   - Relevance to the target role
   - Any notable achievements or scores

Return a JSON object with:
- "description": string (certification overview)
- "bullets": array of strings (key points)`;
          break;

        case 'skills':
        case 'skill':
          systemPrompt = 'You are an expert resume writer specializing in skills sections. Create well-organized, relevant skill descriptions.';
          userPrompt = `Generate professional skills section content.

${sectionData.existingSkills ? `Current Skills: ${Array.isArray(sectionData.existingSkills) ? sectionData.existingSkills.join(', ') : sectionData.existingSkills}` : ''}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Generate:
1. A categorized list of skills organized by:
   - Technical Skills (programming languages, tools, frameworks)
   - Soft Skills (leadership, communication, etc.)
   - Domain Expertise (if applicable)
2. For each category, provide 3-5 relevant skills
3. Ensure skills are relevant and ATS-friendly

Return a JSON object with:
- "categories": object with category names as keys and arrays of skill strings as values
- "bullets": array of strings (formatted as "Category: skill1, skill2, skill3")`;
          break;

        case 'achievements':
        case 'achievement':
        case 'awards':
        case 'award':
          systemPrompt = 'You are an expert resume writer specializing in achievements and awards. Create impactful achievement descriptions.';
          userPrompt = `Generate professional achievement/award description content.

${sectionData.name || sectionData.title ? `Achievement Name: ${sectionData.name || sectionData.title}` : ''}
${sectionData.issuer || sectionData.organization ? `Issuer: ${sectionData.issuer || sectionData.organization}` : ''}
${sectionData.date ? `Date: ${sectionData.date}` : ''}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Generate 3-5 bullet points describing:
- What the achievement represents
- The impact or significance
- Any metrics or recognition received
- Relevance to professional goals

Return a JSON object with a "bullets" array containing the achievement bullet point strings.`;
          break;

        default:
          // Generic fallback for unknown sections
          systemPrompt = 'You are an expert resume writer. Create professional, well-structured content.';
          userPrompt = `Generate professional resume content for section type: ${sectionType}

${JSON.stringify(sectionData, null, 2)}

${keywords ? `Target Keywords/Focus Areas: ${keywords}` : ''}

Generate relevant, professional content appropriate for this resume section.

Return a JSON object with:
- "content": string (main content)
- "bullets": array of strings (if applicable)`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt + ' Always return valid JSON only, no markdown formatting.' },
          { role: 'user', content: userPrompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        response_format: responseFormat
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      // Normalize response format
      if (parsed.bullets && Array.isArray(parsed.bullets)) {
        return parsed.bullets;
      } else if (parsed.content) {
        return [parsed.content];
      } else if (typeof parsed === 'string') {
        return [parsed];
      } else {
        // Try to extract any array from the response
        const arrayKeys = Object.keys(parsed).filter(key => Array.isArray(parsed[key]));
        if (arrayKeys.length > 0) {
          return parsed[arrayKeys[0]];
        }
        throw new Error('AI response did not contain expected format');
      }
      
    } catch (error) {
      console.error(`Error generating content for section ${sectionType}:`, error);
      throw new Error(`Failed to generate content for ${sectionType} section`);
    }
  }

  /**
   * Match a resume's keywords against a job description
   * Returns matched keywords, missing keywords, and a match score
   */
  async matchJobDescription(resumeText, jobDescriptionText) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const prompt = `You are an ATS (Applicant Tracking System) and career analyst expert.

Analyze the following RESUME and JOB DESCRIPTION and identify keyword matching.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescriptionText}

Extract the most important keywords and phrases from the JOB DESCRIPTION (hard skills, soft skills, tools, technologies, qualifications, certifications). Then check which of those keywords appear in the RESUME.

Return a strict JSON object with:
- "matchedKeywords": array of keywords/phrases found in BOTH the resume and job description
- "missingKeywords": array of important keywords from the job description NOT found in the resume
- "matchScore": a number from 0 to 100 representing how well the resume matches the job description
- "topRecommendations": array of 3 concise, actionable tips to improve the resume for this specific job

Example format:
{
  "matchedKeywords": ["React", "Node.js", "Team Leadership"],
  "missingKeywords": ["GraphQL", "AWS", "Agile methodology"],
  "matchScore": 62,
  "topRecommendations": [
    "Add AWS certifications or projects to your experience section.",
    "Mention experience with Agile sprints or Scrum methodology.",
    "Highlight any GraphQL API work in your projects."
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an ATS expert. Always return valid, parseable JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);
      return result;
    } catch (error) {
      console.error('Error matching job description:', error);
      throw new Error('Failed to match job description');
    }
  }


  async tailorResume(resumeData, jobDescription) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const prompt = `Analyze this resume and job description, then provide tailored suggestions to optimize the resume for this specific role.

RESUME SUMMARY:
${resumeData.summary}

WORK EXPERIENCE:
${resumeData.experience.map(exp => 
  `${exp.role} at ${exp.company}:\n${exp.achievements.join('\n')}`
).join('\n\n')}

SKILLS:
${resumeData.skills.join(', ')}

JOB DESCRIPTION:
${jobDescription}

Provide specific, actionable suggestions to:
1. Optimize the professional summary to match the job
2. Highlight relevant experience and achievements
3. Add or emphasize relevant skills
4. Adjust keywords to match the job description
5. Improve ATS compatibility

Format as a structured list of recommendations.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional resume optimization expert specializing in ATS optimization and job matching.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error tailoring resume:', error);
      throw new Error('Failed to tailor resume');
    }
  }

  /**
   * Auto-tailor: Rewrites the resume's summary and bullets to match a job description.
   * Returns structured JSON with rewritten content ready to apply directly.
   */
  async autoTailorResume(resume, jobDescriptionText) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const experienceBlock = (resume.experience || []).map((exp, i) => {
        const bullets = exp.achievements?.join('\n') || exp.description || '';
        return `Experience [${i}] — ${exp.position || exp.role || exp.title || 'Role'} at ${exp.company || ''}:\n${bullets}`;
      }).join('\n\n');

      const prompt = `You are a professional resume writer and ATS expert. Your task is to rewrite a candidate's resume content— specifically the professional summary and experience bullet points— to better match a target job description without adding false information.

CURRENT RESUME SUMMARY:
${resume.summary || '(no summary)'}

CURRENT WORK EXPERIENCE:
${experienceBlock || '(no experience)'}

CURRENT SKILLS:
${Array.isArray(resume.skills) ? resume.skills.join(', ') : (resume.skills || '(none)')}

TARGET JOB DESCRIPTION:
${jobDescriptionText}

INSTRUCTIONS:
1. Rewrite the professional summary to target this specific role (2-4 sentences, not over 80 words).
2. For each experience entry listed, rewrite/improve the bullet points to incorporate relevant keywords from the job description — do NOT invent fake companies, roles, or dates.
3. Keep all rewrites honest and based on what is described in the original bullets.
4. Use strong action verbs (Led, Built, Developed, Scaled, etc.) and include metrics where plausible.

Return a JSON object ONLY, matching this exact structure:
{
  "summary": "Rewritten summary text...",
  "experience": [
    {
      "index": 0,
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert resume writer. Always return valid JSON only, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);
      return result;
    } catch (error) {
      console.error('Error auto-tailoring resume:', error);
      throw new Error('Failed to auto-tailor resume');
    }
  }

  /**
   * Suggest improvements for resume
   */

  async suggestImprovements(resumeData) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const prompt = `Review this resume and provide specific improvement suggestions:

SUMMARY:
${resumeData.summary}

EXPERIENCE:
${resumeData.experience.map(exp => 
  `${exp.role} at ${exp.company}:\n${exp.achievements.join('\n')}`
).join('\n\n')}

EDUCATION:
${resumeData.education.map(edu => 
  `${edu.degree} from ${edu.institution}`
).join('\n')}

SKILLS:
${resumeData.skills.join(', ')}

Provide constructive feedback on:
1. Content quality and impact
2. Missing information
3. Formatting and structure
4. Keyword optimization
5. Overall effectiveness

Format as actionable recommendations.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional resume reviewer providing constructive feedback.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      throw new Error('Failed to generate suggestions');
    }
  }

  /**
   * Parse job description and extract key requirements
   */
  async parseJobDescription(jobDescription) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const prompt = `Extract key information from this job description:

${jobDescription}

Extract and return in JSON format:
{
  "jobTitle": "...",
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "requiredExperience": "...",
  "education": "...",
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "Brief summary of the role"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a job description parser. Extract structured information from job postings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing job description:', error);
      throw new Error('Failed to parse job description');
    }
  }

  /**
   * Analyze resume template HTML and extract sections with field requirements
   */
  async analyzeTemplateStructure(templateHtml, templateSchema = null) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      // If template schema is provided, use it as guidance for the AI
      let schemaContext = '';
      if (templateSchema && templateSchema.sections) {
        schemaContext = `\n\n=== TEMPLATE SCHEMA (Reference Guide) ===
The following schema shows the PRE-ANALYZED structure of this template. Use it as a reference while analyzing the HTML below.

${JSON.stringify(templateSchema, null, 2)}

IMPORTANT INSTRUCTIONS FOR USING THE SCHEMA:
1. The schema above shows the EXACT structure that was previously identified in this template
2. You MUST analyze the HTML code below thoroughly - do NOT rely solely on the schema
3. Use the schema to:
   - Verify your analysis matches known structure
   - Use exact selectors from schema when they match HTML
   - Ensure all fields listed in schema are detected in HTML
   - Match field names and types to schema
4. If you find fields/sections in HTML that are NOT in the schema, include them too
5. If schema selectors don't match HTML structure, use what you find in HTML
6. The schema is a GUIDE to help you, but HTML analysis is PRIMARY

Now analyze the HTML code below and return the structure. Use the schema as a reference but analyze the actual HTML.\n\n`;
      }
      
      // Use full HTML, but if too long, use a smarter truncation (keep structure intact)
      let htmlPreview = templateHtml;
      const MAX_HTML_LENGTH = 50000; // Increased limit
      if (templateHtml.length > MAX_HTML_LENGTH) {
        // Keep first 25000 and last 25000 chars to preserve structure
        htmlPreview = templateHtml.substring(0, 25000) + '\n\n... [middle section truncated for length] ...\n\n' + templateHtml.substring(templateHtml.length - 25000);
        console.log(`HTML truncated from ${templateHtml.length} to ${htmlPreview.length} characters`);
      }

      const prompt = `${schemaContext}You are an expert HTML/CSS analyzer. Analyze this resume template HTML IN DEPTH and identify EVERY editable section with their exact structure and required fields.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. Read the ENTIRE HTML structure carefully - look for ALL sections including:
   - **HEADER/CONTACT INFORMATION (MANDATORY CHECK):**
     * **NAME/FULL NAME** - This is CRITICAL! Look for: h1, h2, .name, .full-name, .first-name, .last-name, #name, title tags, or any element containing the person's name
     * Email address (mailto: links, .email, #email, [href*="mailto"])
     * Phone number (tel: links, .phone, #phone, [href*="tel"])
     * Address/Location (.location, .address, #location)
     * LinkedIn (.linkedin, [href*="linkedin"])
     * Portfolio/Website (.portfolio, .website, [href*="http"])
     * Social media links (Twitter, GitHub, etc.)
   - **PROFILE IMAGE/PHOTO (MANDATORY CHECK):**
     * Look for: img tags, .photo, .profile-pic, .avatar, .image, [class*="photo"], [class*="image"], [class*="avatar"]
     * Common selectors: .photo img, .profile-pic img, .avatar img, img[src*="placeholder"], img[src*="photo"]
     * If found, include as a field with type "image"
   - Professional Summary/Objective/About
   - Work Experience/Employment/Professional Experience (may have multiple entries)
   - Education (may have multiple entries)
   - Skills (Technical Skills, Core Skills, etc.)
   - Projects/Portfolio
   - Certifications/Licenses
   - Awards/Achievements
   - Languages
   - Hobbies/Interests
   - References
   - Volunteer Work
   - Publications
   - Any other sections present

2. **MANDATORY NAME DETECTION:**
   - ALWAYS look for name fields in the header/top section of the resume
   - Common selectors: h1, h2, .name, .full-name, .first-name, .last-name, #name, title, .profile-name, .header-name
   - If you find ANY element that appears to contain a name (even if it's just text in a div), include it as a field
   - Name fields can be split (first-name, last-name) or combined (fullName, name)
   - If name appears in multiple places, include ALL instances

3. For EACH section found:
   - Identify the EXACT CSS selector (use IDs, classes, or element hierarchy)
   - Extract ALL fields/data points within that section
   - Preserve the original HTML structure and classes
   - **DO NOT SKIP ANY VISIBLE TEXT FIELDS**
   - **CRITICAL SUBHEADING INSTRUCTION (MUST READ)**: Many sections (like right-rail Profile sections, Skills, or Highlights) contain subheadings (e.g., \`h3\`, \`h4\`, \`.subtitle\`, or bolded text like "Entrepreneurial Mindset", "Technical Leadership", "Innovation") that sit directly above lists or paragraphs. 
     * You **MUST** extract THESE SUBHEADINGS as their own distinct \`"type": "text"\` fields so the user can change the subheading word itself.
     * Example: If the HTML has \`<h3>Entrepreneurial Mindset</h3><ul><li>...</li></ul>\`, you MUST create a field for the h3 text (e.g., \`"name": "mindsetHeading", "type": "text", "selector": "h3"\`) AND a field for the list (e.g., \`"name": "mindsetList", "type": "list", "selector": "ul"\`). DO NOT treat the subheading as just a 'label' for the list; it must be its own editable field.

4. For Experience/Education sections that have multiple entries:
   - Identify if it's a list/array structure
   - Extract fields for EACH entry (role, company, dates, description, achievements, etc.)

5. Look for nested structures, lists, tables, divs with specific classes
6. **VERIFICATION CHECKLIST:**
   - [ ] Name/Full Name field detected in contact/header section
   - [ ] Email field detected
   - [ ] Phone field detected (if present)
   - [ ] Profile image/photo section detected (if present in template)
   - [ ] All visible text elements are accounted for
   - [ ] All input fields or editable areas are included

HTML:
${htmlPreview}

Return a JSON object with this EXACT structure:
{
  "sections": [
    {
      "title": "Section display name (e.g., 'Contact Information', 'Professional Experience')",
      "selector": "EXACT CSS selector (e.g., '#contact', '.summary-section .summary', '#employment .employment', '.sidebar-wrapper .contact-container')",
      "type": "section type: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'awards' | 'languages' | 'hobbies' | 'references' | 'volunteer' | 'publications' | 'other'",
      "fields": [
        {
          "name": "field identifier (e.g., 'fullName', 'email', 'phone', 'role', 'company', 'startDate', 'endDate', 'achievements')",
          "label": "Human-readable label (e.g., 'Full Name', 'Email Address', 'Job Title')",
          "type": "field type: 'text' | 'email' | 'tel' | 'textarea' | 'date' | 'list' | 'url' | 'image'",
          "required": true/false,
          "placeholder": "Example placeholder text",
          "description": "Brief description",
          "selector": "CSS selector to target this specific field within the section (e.g., '.name', 'a[href^=\"mailto:\"]', '.job-title')"
        }
      ],
      "description": "Brief description of what this section contains",
      "isArray": true/false,
      "originalHTML": "Original HTML structure of this section (preserve for reference)"
    }
  ]
}

IMPORTANT:
- DO NOT MISS ANY SECTIONS - scan thoroughly
- Use precise CSS selectors that match the actual HTML structure
- For arrays (experience, education entries), set "isArray": true
- Include "originalHTML" field to preserve structure
- Extract ALL visible text fields, links, dates, lists

Return ONLY valid JSON, no markdown or extra text.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert HTML/CSS analyzer specializing in resume templates. You meticulously analyze HTML structure to extract ALL editable sections and fields. CRITICAL: You MUST always detect the name/full name field in the header/contact section. You are thorough and never miss sections. CRITICAL: You MUST extract subheadings (h3, h4, .subtitle etc. like "Entrepreneurial Mindset") as editable text input fields alongside the list fields beneath them. IMPORTANT: Always return valid JSON. Escape all quotes and special characters in strings properly. Never truncate strings in the middle.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 8000, // Increased to handle larger responses
        response_format: { type: 'json_object' }
      });

      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      let result;
      try {
        // Try to fix common JSON issues before parsing
        let cleanedContent = content.trim();
        
        // Remove any markdown code blocks if present
        if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        }
        
        // Try to fix unterminated strings by finding the last valid position
        try {
          result = JSON.parse(cleanedContent);
        } catch (firstParseError) {
          // If parsing fails, try to extract valid JSON from the response
          console.warn('First parse attempt failed, trying to extract valid JSON...');
          
          // Look for the start of the JSON object
          const jsonStart = cleanedContent.indexOf('{');
          if (jsonStart !== -1) {
            // Try to find a valid closing brace
            let braceCount = 0;
            let lastValidPos = jsonStart;
            for (let i = jsonStart; i < cleanedContent.length; i++) {
              if (cleanedContent[i] === '{') braceCount++;
              if (cleanedContent[i] === '}') braceCount--;
              if (braceCount === 0 && i > jsonStart) {
                lastValidPos = i + 1;
                break;
              }
            }
            
            if (lastValidPos > jsonStart) {
              const truncated = cleanedContent.substring(0, lastValidPos);
              console.log('Attempting to parse truncated JSON (length:', truncated.length, ')');
              result = JSON.parse(truncated);
              console.warn('Successfully parsed truncated JSON. Some data may be missing.');
            } else {
              throw firstParseError;
            }
          } else {
            throw firstParseError;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response. Content length:', content.length);
        console.error('Content preview (first 500 chars):', content.substring(0, 500));
        console.error('Content preview (last 500 chars):', content.substring(Math.max(0, content.length - 500)));
        console.error('Parse error:', parseError.message);
        throw new Error('Invalid JSON response from AI: ' + parseError.message + '. Response may be truncated.');
      }
      
      // Validate and clean the result
      if (!result.sections || !Array.isArray(result.sections)) {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response format from AI - missing sections array');
      }

      // Post-process to ensure critical fields are detected
      result = this.ensureCriticalFields(result, templateHtml);

      return result;
    } catch (error) {
      console.error('Error analyzing template structure:', error);
      if (error.response) {
        console.error('OpenAI API error response:', error.response.status, error.response.data);
        throw new Error(`OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to analyze template structure: ' + (error.message || 'Unknown error'));
    }
  }

  /**
   * Post-process analysis to ensure critical fields like name are always detected
   */
  ensureCriticalFields(analysis, templateHtml) {
    if (!analysis.sections || !Array.isArray(analysis.sections)) {
      return analysis;
    }

    // Find contact/header section
    let contactSection = analysis.sections.find(s => 
      s.type === 'contact' || 
      s.title?.toLowerCase().includes('contact') ||
      s.title?.toLowerCase().includes('header') ||
      s.selector?.includes('contact') ||
      s.selector?.includes('header') ||
      s.selector?.includes('profile')
    );

    // If no contact section found, check if any section has contact-like fields
    if (!contactSection) {
      contactSection = analysis.sections.find(s => 
        s.fields?.some(f => 
          f.name?.toLowerCase().includes('email') || 
          f.name?.toLowerCase().includes('phone')
        )
      );
    }

    // If still no contact section, create one
    if (!contactSection && templateHtml) {
      try {
        // Try to find name in HTML using common patterns
        const namePatterns = [
          /<h1[^>]*>([^<]+)<\/h1>/i,
          /<h2[^>]*>([^<]+)<\/h2>/i,
          /class=["'][^"']*name[^"']*["'][^>]*>([^<]+)</i,
          /id=["']name["'][^>]*>([^<]+)</i,
          /class=["'][^"']*full-name[^"']*["'][^>]*>([^<]+)</i,
          /class=["'][^"']*first-name[^"']*["'][^>]*>([^<]+)</i
        ];

        let nameFound = false;
        for (const pattern of namePatterns) {
          const match = templateHtml.match(pattern);
          if (match && match[1] && match[1].trim().length > 0) {
            nameFound = true;
            break;
          }
        }

        if (nameFound) {
          // Create a contact section
          contactSection = {
            title: 'Contact Information',
            selector: 'body',
            type: 'contact',
            fields: [],
            description: 'Contact information including name, email, and phone',
            isArray: false
          };
          analysis.sections.unshift(contactSection);
        }
      } catch (e) {
        console.warn('Error checking for name in HTML:', e);
      }
    }

      // Check for image fields in any section
      const hasImageField = analysis.sections.some(s => 
        s.fields?.some(f => f.type === 'image')
      );

      // If no image field found but template has image elements, add one
      if (!hasImageField && templateHtml) {
        const imagePatterns = [
          /<img[^>]*class=["'][^"']*photo[^"']*["'][^>]*>/i,
          /<img[^>]*class=["'][^"']*profile-pic[^"']*["'][^>]*>/i,
          /<img[^>]*class=["'][^"']*avatar[^"']*["'][^>]*>/i,
          /<img[^>]*class=["'][^"']*image[^"']*["'][^>]*>/i,
          /<div[^>]*class=["'][^"']*photo[^"']*["'][^>]*>[\s\S]*?<img/i,
          /\.photo\s+img/i
        ];

        let imageFound = false;
        for (const pattern of imagePatterns) {
          if (pattern.test(templateHtml)) {
            imageFound = true;
            break;
          }
        }

        if (imageFound) {
          // Find or create a section for the image
          let imageSection = analysis.sections.find(s => 
            s.selector?.includes('photo') || 
            s.selector?.includes('profile') ||
            s.title?.toLowerCase().includes('profile') ||
            s.title?.toLowerCase().includes('photo')
          );

          if (!imageSection && contactSection) {
            imageSection = contactSection;
          }

          if (imageSection) {
            const hasImageFieldInSection = imageSection.fields?.some(f => f.type === 'image');
            if (!hasImageFieldInSection) {
              if (!imageSection.fields) {
                imageSection.fields = [];
              }
              // Try to find image selector
              let imageSelector = '.photo img';
              if (templateHtml.includes('.profile-pic')) imageSelector = '.profile-pic img';
              else if (templateHtml.includes('.avatar')) imageSelector = '.avatar img';
              else if (templateHtml.includes('.image')) imageSelector = '.image img';

              imageSection.fields.push({
                name: 'profileImage',
                label: 'Profile Image',
                type: 'image',
                required: false,
                placeholder: 'Upload profile photo',
                description: 'Upload your profile photo',
                selector: imageSelector
              });
            }
          }
        }
      }

    // Ensure name field exists in contact section
    if (contactSection) {
      // First check if ANY section has a name field to avoid duplicates
      const hasNameFieldAnywhere = analysis.sections.some(s => 
        s.fields?.some(f => 
          f.name?.toLowerCase().includes('name') ||
          f.name === 'fullName' ||
          f.name === 'name' ||
          f.name === 'firstName' ||
          f.name === 'lastName'
        )
      );

      if (!hasNameFieldAnywhere) {
        // Try to find name selector in HTML
        let nameSelector = null;
        const nameSelectors = [
          'h1', 'h2', '.name', '#name', '.full-name', '.first-name', 
          '.profile-name', '.header-name', 'title'
        ];

        for (const selector of nameSelectors) {
          try {
            // Simple check if selector exists in HTML
            if (templateHtml.includes(selector) || 
                templateHtml.includes(`class="${selector.replace('.', '')}"`) ||
                templateHtml.includes(`id="${selector.replace('#', '')}"`)) {
              nameSelector = selector;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        // Add name field
        if (!contactSection.fields) {
          contactSection.fields = [];
        }

        contactSection.fields.unshift({
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Your full name',
          description: 'Your complete name as it should appear on the resume',
          selector: nameSelector || 'h1, h2, .name, #name'
        });

        console.log('Added missing name field to contact section');
      }
    }

    return analysis;
  }

  /**
   * Parse unstructured resume text and extract structured data
   */
  async parseResumeText(resumeText) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Limit text length to avoid token limits
      const maxLength = 15000;
      const textToParse = resumeText.length > maxLength 
        ? resumeText.substring(0, maxLength) + '\n\n[... content truncated ...]'
        : resumeText;

      const prompt = `Parse this resume text and extract structured information. Return ONLY valid JSON with this exact structure:
{
  "personalInfo": {
    "fullName": "string or empty",
    "email": "string or empty",
    "phone": "string or empty",
    "location": "string or empty",
    "linkedin": "string or empty",
    "portfolio": "string or empty"
  },
  "summary": "string or empty",
  "experience": [
    {
      "role": "string",
      "company": "string",
      "startDate": "string (MM/YYYY or YYYY)",
      "endDate": "string (MM/YYYY or YYYY or 'Present')",
      "current": false,
      "achievements": ["string", "string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "startDate": "string (MM/YYYY or YYYY)",
      "endDate": "string (MM/YYYY or YYYY)",
      "gpa": "string or empty",
      "honors": "string or empty"
    }
  ],
  "skills": ["string", "string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or empty",
      "startDate": "string or empty",
      "endDate": "string or empty"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "url": "string or empty"
    }
  ],
  "languages": [
    {
      "name": "string",
      "proficiency": "string"
    }
  ]
}

Resume Text:
${textToParse}

IMPORTANT: 
- Extract ALL available information
- If a field is not found, use empty string or empty array
- Dates should be in MM/YYYY or YYYY format
- Return ONLY valid JSON, no markdown or extra text`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at parsing resumes and extracting structured data. Always return valid JSON. Extract all available information accurately.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      // Parse JSON response
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Response content:', content.substring(0, 500));
        throw new Error('Invalid JSON response from AI: ' + parseError.message);
      }

      // Validate and ensure all required fields exist
      const structuredResume = {
        personalInfo: {
          fullName: parsedData.personalInfo?.fullName || '',
          email: parsedData.personalInfo?.email || '',
          phone: parsedData.personalInfo?.phone || '',
          location: parsedData.personalInfo?.location || '',
          linkedin: parsedData.personalInfo?.linkedin || '',
          portfolio: parsedData.personalInfo?.portfolio || ''
        },
        summary: parsedData.summary || '',
        experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
        education: Array.isArray(parsedData.education) ? parsedData.education : [],
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
        projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
        certifications: Array.isArray(parsedData.certifications) ? parsedData.certifications : [],
        languages: Array.isArray(parsedData.languages) ? parsedData.languages : []
      };

      console.log('Successfully parsed resume:', {
        hasPersonalInfo: !!structuredResume.personalInfo.fullName,
        experienceCount: structuredResume.experience.length,
        educationCount: structuredResume.education.length,
        skillsCount: structuredResume.skills.length
      });

      return structuredResume;
    } catch (error) {
      console.error('Error parsing resume text:', error);
      if (error.response) {
        console.error('OpenAI API error:', error.response.status, error.response.data);
        throw new Error(`OpenAI API error: ${error.response.status}`);
      }
      throw new Error('Failed to parse resume text: ' + (error.message || 'Unknown error'));
    }
  }

  /**
   * Extract image data from formData and return both images and non-image data separately
   */
  separateImageData(formData) {
    const images = {};
    const nonImageData = {};
    
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (!value || value.toString().trim() === '') return;
      
      // Check if this is an image field (by field name or if value is a data URI)
      const isImageField = key.toLowerCase().includes('image') || 
                          key.toLowerCase().includes('photo') || 
                          key.toLowerCase().includes('avatar') ||
                          (typeof value === 'string' && value.startsWith('data:image/'));
      
      if (isImageField) {
        images[key] = value;
      } else {
        nonImageData[key] = value;
      }
    });
    
    return { images, nonImageData };
  }

  /**
   * Transform flat formData structure (sectionSelector__fieldName__index) into a more structured format
   */
  transformFormDataForAI(formData) {
    const structured = {};
    
    // Group data by section selector
    Object.keys(formData).forEach(key => {
      if (!formData[key] || formData[key].toString().trim() === '') return;
      
      const parts = key.split('__');
      if (parts.length < 2) {
        // Simple key-value pair
        structured[key] = formData[key];
        return;
      }
      
      const selector = parts[0];
      const fieldName = parts[1];
      const index = parts.length > 2 ? parseInt(parts[2]) : null;
      
      if (!structured[selector]) {
        structured[selector] = {};
      }
      
      if (index !== null && !isNaN(index)) {
        // Array entry
        if (!structured[selector].entries) {
          structured[selector].entries = [];
        }
        if (!structured[selector].entries[index]) {
          structured[selector].entries[index] = {};
        }
        structured[selector].entries[index][fieldName] = formData[key];
      } else {
        // Single field
        structured[selector][fieldName] = formData[key];
      }
    });
    
    return structured;
  }

  /**
   * Directly inject images into HTML template without AI processing
   * Images are placed as-is using their data URIs
   */
  injectImagesDirectly(templateHtml, images) {
    if (!images || Object.keys(images).length === 0) {
      return templateHtml;
    }
    
    let html = templateHtml;
    let replacedCount = 0;
    
    // Process each image
    Object.keys(images).forEach(key => {
      const imageData = images[key];
      if (!imageData || typeof imageData !== 'string') {
        console.warn(`[OpenAI Service] Skipping invalid image data for key: ${key}`);
        return;
      }
      
      // Validate it's a data URI
      if (!imageData.startsWith('data:image/')) {
        console.warn(`[OpenAI Service] Image data is not a valid data URI for key: ${key}`);
        return;
      }
      
      // Extract selector and field name from key (format: selector__fieldName or selector__fieldName__index)
      const parts = key.split('__');
      if (parts.length < 2) {
        console.warn(`[OpenAI Service] Invalid image key format: ${key}`);
        return;
      }
      
      const sectionSelector = parts[0];
      const fieldName = parts[1].toLowerCase();
      
      console.log(`[OpenAI Service] Injecting image for section: ${sectionSelector}, field: ${fieldName}`);
      
      // Strategy 1: Use field selector if available (from template analysis)
      // The field selector is typically stored in the formData key structure
      // We'll try to find img tags that match common image patterns
      
      // Strategy 2: Find img tags within the section selector
      // Escape special regex characters
      const escapedSelector = sectionSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Pattern to find the section containing the selector
      const sectionPattern = new RegExp(`(<[^>]*(?:class|id)=["'][^"']*${escapedSelector}[^"']*["'][^>]*>)([\\s\\S]*?)(</[^>]+>)`, 'i');
      
      let sectionFound = false;
      html = html.replace(sectionPattern, (match, openingTag, content, closingTag) => {
        sectionFound = true;
        
        // Look for img tags within this section
        const imgPattern = /<img([^>]*src=["'])([^"']*)(["'][^>]*)>/gi;
        const updatedContent = content.replace(imgPattern, (imgMatch, before, src, after) => {
          // Replace if it's a placeholder, default, or not already a data URI
          if (src && (!src.startsWith('data:') || src.includes('placeholder') || src.includes('default'))) {
            console.log(`[OpenAI Service] Replacing image src in section ${sectionSelector}`);
            replacedCount++;
            return `<img${before}${imageData}${after}>`;
          }
          return imgMatch;
        });
        
        return openingTag + updatedContent + closingTag;
      });
      
      // Strategy 3: If section not found, try direct img tag replacement by common image class/id patterns
      if (!sectionFound) {
        const imageClassPatterns = [
          // img with image-related classes
          /<img([^>]*class=["'][^"']*(?:photo|profile-image|avatar|image|profile-pic|profile-picture)[^"']*["'][^>]*src=["'])([^"']*)(["'][^>]*>)/gi,
          // img with image-related id
          /<img([^>]*id=["'][^"']*(?:photo|profile-image|avatar|image|profile-pic|profile-picture)[^"']*["'][^>]*src=["'])([^"']*)(["'][^>]*>)/gi,
          // img with src first, then image-related class/id
          /<img([^>]*src=["'])([^"']*)(["'][^>]*(?:class|id)=["'][^"']*(?:photo|profile-image|avatar|image|profile-pic|profile-picture)[^"']*["'][^>]*>)/gi
        ];
        
        imageClassPatterns.forEach(pattern => {
          html = html.replace(pattern, (match, before, src, after) => {
            // Only replace if not already a data URI or if it's a placeholder
            if (src && (!src.startsWith('data:') || src.includes('placeholder') || src.includes('default'))) {
              console.log(`[OpenAI Service] Replacing image src by class/id pattern`);
              replacedCount++;
              return `${before}${imageData}${after}`;
            }
            return match;
          });
        });
      }
      
      // Strategy 4: Last resort - replace first img tag found (if no better match)
      if (replacedCount === 0) {
        const firstImgPattern = /<img([^>]*src=["'])([^"']*)(["'][^>]*)>/i;
        html = html.replace(firstImgPattern, (match, before, src, after) => {
          if (src && (!src.startsWith('data:') || src.includes('placeholder'))) {
            console.log(`[OpenAI Service] Replacing first img tag found (fallback)`);
            replacedCount++;
            return `<img${before}${imageData}${after}>`;
          }
          return match;
        });
      }
    });
    
    console.log(`[OpenAI Service] Successfully injected ${replacedCount} image(s) directly into HTML`);
    return html;
  }

  /**
   * Inject unstructured JSON data into an HTML template using AI
   */
  async injectTemplateData(templateHtml, formData, mode = 'edit') {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Validate inputs
      if (!templateHtml || typeof templateHtml !== 'string') {
        throw new Error('templateHtml must be a non-empty string');
      }
      if (!formData || typeof formData !== 'object') {
        throw new Error('formData must be an object');
      }

      // Separate images from other data - images will be injected directly, NOT through AI
      // All text fields (summary, experience, education, skills, etc.) will be processed by AI
      const { images, nonImageData } = this.separateImageData(formData);
      
      console.log(`[OpenAI Service] Separated ${Object.keys(images).length} image(s) from ${Object.keys(nonImageData).length} text field(s)`);
      console.log(`[OpenAI Service] Images will bypass AI and be injected directly. Text fields will be processed by AI.`);

      // Transform non-image formData into a more structured format for better AI understanding
      // Only text data goes to AI - images are excluded
      const structuredData = this.transformFormDataForAI(nonImageData);
      
      // Limit template HTML size to avoid token limits (keep structure intact)
      let htmlToUse = templateHtml;
      const MAX_HTML_LENGTH = 50000;
      if (templateHtml.length > MAX_HTML_LENGTH) {
        // Keep first and last portions to preserve structure
        const firstPart = templateHtml.substring(0, 25000);
        const lastPart = templateHtml.substring(templateHtml.length - 25000);
        htmlToUse = firstPart + '\n\n... [middle section truncated for length] ...\n\n' + lastPart;
        console.log(`[OpenAI Service] HTML truncated from ${templateHtml.length} to ${htmlToUse.length} characters`);
      }

      let modeInstructions = '';
      if (mode === 'print') {
        modeInstructions = `PRINT MODE: If any section or element in the template (like Experience rows, Education blocks, or entire containers) has no corresponding real data in the USER DATA, YOU MUST COMPLETELY REMOVE that element from the HTML, INCLUDING any associated headers or titles for that section. The final output must be a clean resume with zero dummy/placeholder data and zero empty section headers.`;
      } else {
        modeInstructions = `EDIT MODE: If some sections in the template have no corresponding data in USER DATA yet, DO NOT remove them. Keep the original placeholder/dummy data so the user can see the layout while they are still editing.`;
      }

      const prompt = `You are an expert web developer and data mapping tool. Your objective is to inject the user's data precisely into an existing HTML resume template.

CRITICAL INSTRUCTIONS:
1. Preserve 100% of the original CSS classes, IDs, styles, and HTML layout. DO NOT change the structure or CSS.
2. Only replace the visible text content (like names, roles, dates, descriptions) with the data provided below.
3. The USER DATA is structured by CSS selector. Each selector corresponds to a section in the HTML template.
4. For array sections (entries array), duplicate the HTML structure for each entry.
5. Match fields by their names (e.g., "fullName", "email", "role", "company", "achievements", etc.) to the corresponding elements in the HTML.
6. IMPORTANT: Do NOT modify or replace any image tags (<img>). Images are handled separately and will be injected directly. Only process text content.
7. ${modeInstructions}
8. Return ONLY the final raw HTML code. Do not include markdown formatting like \`\`\`html or any explanatory text.

USER DATA (structured by CSS selector):
${JSON.stringify(structuredData, null, 2)}

ORIGINAL HTML TEMPLATE:
${htmlToUse}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an intelligent HTML template binder. Your only output is raw, strictly valid HTML. Never include markdown code blocks or explanatory text.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 16000
      });

      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response from OpenAI API: Missing response structure');
      }

      let injectedHtml = response.choices[0].message.content.trim();
      
      // Remove markdown blocks if AI ignored instructions
      if (injectedHtml.startsWith('```')) {
        injectedHtml = injectedHtml.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '');
      }
      
      // Remove any leading/trailing whitespace and newlines
      injectedHtml = injectedHtml.trim();

      // Validate that we got HTML back
      if (!injectedHtml || injectedHtml.length < 100) {
        throw new Error('AI returned invalid or empty HTML response');
      }

      // Inject images directly into the HTML (bypassing AI)
      if (Object.keys(images).length > 0) {
        console.log(`[OpenAI Service] Injecting ${Object.keys(images).length} image(s) directly into HTML`);
        injectedHtml = this.injectImagesDirectly(injectedHtml, images);
      }

      console.log(`[OpenAI Service] Successfully injected data. Output HTML length: ${injectedHtml.length}`);
      return injectedHtml;
    } catch (error) {
      console.error('[OpenAI Service] Error injecting template data:', error);
      console.error('[OpenAI Service] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.response) {
        console.error('[OpenAI Service] OpenAI API error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        throw new Error(`OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      
      // Re-throw with more context
      throw new Error(`Failed to inject template data: ${error.message || 'Unknown error'}`);
    }
  }
}

module.exports = new OpenAIService();
