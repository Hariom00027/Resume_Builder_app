const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

class DOCXService {
  /**
   * Generate DOCX from resume
   */
  async generateDOCX(resume, template) {
    try {
      const sections = [];

      // Header with name
      if (resume.personalInfo?.fullName) {
        sections.push(
          new Paragraph({
            text: resume.personalInfo.fullName,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER
          })
        );
      }

      // Contact information
      const contactInfo = [];
      if (resume.personalInfo?.email) contactInfo.push(resume.personalInfo.email);
      if (resume.personalInfo?.phone) contactInfo.push(resume.personalInfo.phone);
      if (resume.personalInfo?.location) contactInfo.push(resume.personalInfo.location);
      
      if (contactInfo.length > 0) {
        sections.push(
          new Paragraph({
            text: contactInfo.join(' | '),
            alignment: AlignmentType.CENTER
          })
        );
      }

      // Summary
      if (resume.summary) {
        sections.push(
          new Paragraph({
            text: 'Professional Summary',
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            text: resume.summary
          })
        );
      }

      // Experience
      if (resume.experience && resume.experience.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Experience',
            heading: HeadingLevel.HEADING_1
          })
        );

        resume.experience.forEach(exp => {
          sections.push(
            new Paragraph({
              text: `${exp.role} - ${exp.company}`,
              heading: HeadingLevel.HEADING_2
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`
            })
          );

          if (exp.achievements && exp.achievements.length > 0) {
            exp.achievements.forEach(achievement => {
              sections.push(
                new Paragraph({
                  text: `• ${achievement}`,
                  bullet: {
                    level: 0
                  }
                })
              );
            });
          }
        });
      }

      // Education
      if (resume.education && resume.education.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Education',
            heading: HeadingLevel.HEADING_1
          })
        );

        resume.education.forEach(edu => {
          sections.push(
            new Paragraph({
              text: `${edu.degree} - ${edu.institution}`,
              heading: HeadingLevel.HEADING_2
            })
          );
          if (edu.gpa) {
            sections.push(new Paragraph({ text: `GPA: ${edu.gpa}` }));
          }
          if (edu.startDate && edu.endDate) {
            sections.push(new Paragraph({ text: `${edu.startDate} - ${edu.endDate}` }));
          }
        });
      }

      // Skills
      if (resume.skills && resume.skills.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Skills',
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            text: resume.skills.join(', ')
          })
        );
      }

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: sections
        }]
      });

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      console.error('Error generating DOCX:', error);
      throw new Error('Failed to generate DOCX');
    }
  }
}

module.exports = new DOCXService();
