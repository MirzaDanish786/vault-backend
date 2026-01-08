/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           readOnly: true
 *           example: '123e4567-e89b-12d3-a456-426614174000'
 *         email:
 *           type: string
 *           format: email
 *           example: 'user@example.com'
 *         name:
 *           type: string
 *           example: 'John Doe'
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *           default: 'USER'
 *         isEmailVerified:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 * 
 *     SignUpRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: 'user@example.com'
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: 'password123'
 *         name:
 *           type: string
 *           example: 'John Doe'
 * 
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: 'user@example.com'
 *         password:
 *           type: string
 *           format: password
 *           example: 'password123'
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Authentication successful'
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *               example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *             refreshToken:
 *               type: string
 *               example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * 
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */
export const authSchema = {};
