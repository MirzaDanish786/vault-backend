import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application, Express, Request, Response } from 'express';
import swaggerConfig from './swagger.config';
import path from 'path';

// Import all schemas to ensure they're loaded
import './schemas';

// Define TypeScript interfaces
interface OpenAPISpec {
  openapi?: string;
  info?: object;
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: Array<{ name: string; description: string }>;
}

// Swagger configuration
const options: Options = {
  definition: swaggerConfig,
  apis: [
    // Scan route files for endpoint documentation
    './src/routes/**/*.ts',
    // Scan schema files for component schemas
    './src/docs/schemas/**/*.ts',
    // Scan path files for endpoint definitions
    './src/docs/paths/**/*.ts',
  ],
};

// Generate Swagger specification
const swaggerSpec: OpenAPISpec = swaggerJSDoc(options);

/**
 * Setup and serve Swagger documentation
 * @param app Express application instance
 * @param port Server port number
 */
export function setupSwaggerDocs(app: Application, port: number): void {
  // Validate Swagger spec on startup
  validateSwaggerSpec(swaggerSpec);

  // Swagger UI options for better UX
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      persistAuthorization: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: 'Vault API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { margin: 20px 0; padding: 10px; background: #f8fafc; }
      .swagger-ui .opblock-tag { font-size: 18px; margin: 20px 0 10px 0; }
    `,
    customfavIcon: '/favicon.ico',
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve raw OpenAPI spec in JSON format
  app.get('/api-docs/json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve OpenAPI spec in YAML format
  app.get('/api-docs/yaml', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/yaml');
    // In production, you might want to convert JSON to YAML
    res.send(swaggerSpec);
  });

  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`📄 OpenAPI Spec (JSON): http://localhost:${port}/api-docs/json`);
  console.log(`⚡ OpenAPI Spec (YAML): http://localhost:${port}/api-docs/yaml`);
}

/**
 * Validate Swagger specification on startup
 * @param spec Generated Swagger specification
 */
function validateSwaggerSpec(spec: OpenAPISpec): void {
  const pathsCount = Object.keys(spec.paths || {}).length;
  const schemasCount = Object.keys(spec.components?.schemas || {}).length;

  console.log('\n🔍 Swagger Specification Validation');
  console.log('===================================');
  console.log(`📊 Total API Endpoints: ${pathsCount}`);
  console.log(`📊 Total Data Schemas: ${schemasCount}`);
  
  if (pathsCount === 0) {
    console.warn('⚠️  Warning: No API endpoints found in documentation.');
    console.log('💡 Tip: Add @swagger comments to your route files.');
  } else {
    console.log('✅ Swagger documentation loaded successfully');
  }

  if (schemasCount > 0) {
    console.log('\n📋 Available Schemas:');
    Object.keys(spec.components?.schemas || {}).forEach(schema => {
      console.log(`   • ${schema}`);
    });
  }
}

export default setupSwaggerDocs;