import type { SwaggerDefinition } from 'swagger-jsdoc';

import { env } from '@/config/env';
// import { config } from '../config/env';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vault Backend API',
    version: '1.0.0',
    description: `
# Vault Backend API Documentation

Professional E-commerce Backend API with full authentication, product management, and order processing capabilities.

## Authentication
- JWT-based authentication
- Refresh token mechanism
- Role-based access control

## Features
- User authentication & authorization
- Product catalog management
- Shopping cart
- Order processing
- Payment integration
- Admin dashboard
    `,
    termsOfService: 'https://vault.com/terms',
    contact: {
      name: 'API Support',
      email: 'support@vault.com',
      url: 'https://vault.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `${env.API_URL || 'http://localhost:3000'}/api/v1`,
      description: 'Development Server',
    },
    {
      url: 'https://api.vault.com/api/v1',
      description: 'Production Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in the format: Bearer <token>',
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
      },
      ForbiddenError: {
        description: 'User does not have permission to access this resource',
      },
      NotFoundError: {
        description: 'The requested resource was not found',
      },
      ValidationError: {
        description: 'Request validation failed',
      },
      ServerError: {
        description: 'Internal server error',
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Categories',
      description: 'Product category management',
    },
    {
      name: 'Products',
      description: 'Product catalog management',
    },
    {
      name: 'Users',
      description: 'User profile management',
    },
    {
      name: 'Health',
      description: 'API health monitoring',
    },
  ],
  externalDocs: {
    description: 'View complete API documentation',
    url: 'https://docs.vault.com',
  },
};

export default swaggerDefinition;
