const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const port = 3001;

// Load OpenAPI spec
const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));

// Serve Swagger UI at /swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "Matcha API - Swagger UI",
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Simple HTML page with links to both documentation types
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Matcha API Documentation</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 800px; 
          margin: 50px auto; 
          padding: 20px;
          background: #f5f5f5;
        }
        .card {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin: 20px 0;
        }
        h1 { color: #333; text-align: center; }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 10px 10px 10px 0;
          transition: background 0.3s;
        }
        .btn:hover { background: #0056b3; }
        .btn.redoc { background: #e74c3c; }
        .btn.redoc:hover { background: #c0392b; }
        .description { color: #666; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🎯 Matcha Dating App API</h1>
        <p class="description">Choose your preferred documentation format:</p>
        
        <div>
          <a href="/swagger" class="btn">📋 Swagger UI</a>
          <span class="description">Interactive API explorer - test endpoints directly</span>
        </div>
        
        <div>
          <a href="http://localhost:8080" class="btn redoc" target="_blank">📖 Redoc</a>
          <span class="description">Beautiful, clean documentation (run 'npm run docs' first)</span>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <h3>🛠 Available Commands:</h3>
          <ul style="color: #666;">
            <li><code>npm run docs</code> - Start Redoc server on port 8080</li>
            <li><code>npm run preview</code> - Start Redocly preview on port 8081</li>
            <li><code>npm run validate</code> - Validate OpenAPI schema</li>
            <li><code>npm run generate:frontend</code> - Generate TypeScript types</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`🚀 Matcha API Documentation Hub`);
  console.log(`📋 Swagger UI: http://localhost:${port}/swagger`);
  console.log(`🏠 Home page: http://localhost:${port}`);
  console.log(`\n💡 To start Redoc: npm run docs (port 8080)`);
});
