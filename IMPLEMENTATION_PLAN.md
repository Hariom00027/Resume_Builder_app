# Template Schema System - Implementation Plan

## Overview
This system creates pre-analyzed template schemas that guide AI analysis, making field mapping more reliable and consistent.

## Architecture

### 1. Database Schema Update
- Added `templateSchema` field to `ResumeTemplate` model
- Schema contains:
  - Sections with selectors, types, and fields
  - Field mappings (name, email, phone, etc.)
  - Image locations
  - Array sections (experience, education)
  - Layout information

### 2. Schema Generation Script
- **File**: `backend/scripts/generateTemplateSchemas.js`
- **Usage**: 
  ```bash
  # Generate schemas for all templates
  node scripts/generateTemplateSchemas.js
  
  # Generate schema for specific template
  node scripts/generateTemplateSchemas.js saarthix-special-1
  ```
- Uses AI to analyze templates and create structured schemas
- Stores schemas in database for future use

### 3. AI Service Enhancement
- Updated `analyzeTemplateStructure()` to accept optional `templateSchema` parameter
- When schema is provided, it's included in the AI prompt as guidance
- AI uses schema as reference but still analyzes HTML thoroughly
- Schema acts as a "guide" to ensure consistent mapping

### 4. Controller Update
- `aiController.analyzeTemplateStructure()` now:
  - Accepts `templateId` in request body
  - Fetches template schema from database if available
  - Passes schema to AI service

### 5. Frontend Update
- `AITemplateEditor` now passes `templateId` when calling analyze API
- This allows backend to fetch and use the template schema

## Benefits

1. **Reliability**: Pre-analyzed schemas ensure consistent field mapping
2. **Accuracy**: AI has reference structure to match against
3. **Performance**: Can reduce AI analysis time (though still thorough)
4. **Maintainability**: Schemas can be manually curated/updated
5. **Debugging**: Easy to see what structure AI should detect

## Workflow

1. **Initial Setup** (One-time):
   ```bash
   node scripts/generateTemplateSchemas.js
   ```
   This generates schemas for all active templates.

2. **When User Selects Template**:
   - Frontend calls `/api/ai/analyze-template` with `templateHtml` and `templateId`
   - Backend fetches template schema from database
   - AI analyzes template using schema as guidance
   - Returns analysis with accurate field mappings

3. **Schema Updates**:
   - If template HTML changes, regenerate schema:
     ```bash
     node scripts/generateTemplateSchemas.js template-id
     ```
   - Or manually update schema in database if needed

## Schema Structure

```javascript
{
  sections: [
    {
      title: "Contact Information",
      selector: ".left .contact",
      type: "contact",
      isArray: false,
      fields: [
        {
          name: "fullName",
          label: "Full Name",
          type: "text",
          selector: ".first-name, .last-name",
          required: true
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          selector: "a[href^='mailto:']",
          required: true
        }
      ]
    }
  ],
  hasImage: true,
  imageSelector: ".photo img",
  layoutType: "two-column"
}
```

## Next Steps

1. Run schema generation for all templates
2. Test with a few templates to verify accuracy
3. Monitor AI analysis results - should be more consistent
4. Optionally: Create admin UI to view/edit schemas manually
