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
   * Inject unstructured JSON data into an HTML template using AI
   */
  async injectTemplateData(templateHtml, formData, mode = 'edit') {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
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
3. If an array (like Experience or Education) has multiple items, you may duplicate the existing HTML row/item structure to fit all items perfectly.
4. ${modeInstructions}
5. Return ONLY the final raw HTML code. Do not include markdown formatting like \`\`\`html.

USER DATA:
${JSON.stringify(formData, null, 2)}

ORIGINAL HTML TEMPLATE:
${templateHtml}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an intelligent HTML template binder. Your only output is raw, strictly valid HTML.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 16000
      });

      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      let injectedHtml = response.choices[0].message.content.trim();
      
      // Remove markdown blocks if AI ignored instructions
      if (injectedHtml.startsWith('```')) {
        injectedHtml = injectedHtml.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '');
      }

      return injectedHtml;
    } catch (error) {
      console.error('Error injecting template data:', error);
      if (error.response) {
        console.error('OpenAI API error:', error.response.status, error.response.data);
        throw new Error(`OpenAI API error: ${error.response.status}`);
      }
      throw new Error('Failed to inject template data: ' + (error.message || 'Unknown error'));
    }
  }
}

module.exports = new OpenAIService();
