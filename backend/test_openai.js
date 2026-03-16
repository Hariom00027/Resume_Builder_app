const openaiService = require('./src/services/openaiService');

const mockAnalysis = {
  sections: [
    {
      type: "summary",
      fields: [
        { name: "fullName", type: "text" }
      ]
    }
  ]
};

const result = openaiService.ensureCriticalFields(mockAnalysis, '<html><body><h1 class="name">John Doe</h1></body></html>');
console.log(JSON.stringify(result, null, 2));
