export const categorySchema = {};

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         metaTitle:
 *           type: string
 *           nullable: true
 *         metaDescription:
 *           type: string
 *           nullable: true
 *         imageUrl:
 *           type: string
 *           nullable: true
 *         parentId:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         productCount:
 *           type: integer
 * 
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 255
 *         description:
 *           type: string
 *           maxLength: 2000
 *         metaTitle:
 *           type: string
 *           maxLength: 255
 *         metaDescription:
 *           type: string
 *           maxLength: 500
 *         imageUrl:
 *           type: string
 *           format: uri
 *         parentId:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *           default: true
 *         sortOrder:
 *           type: integer
 *           minimum: 10
 * 
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: 'Updated description'
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         isActive:
 *           type: boolean
 *           example: true
 * 
 *     CategoryListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Categories retrieved successfully'
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         meta:
 *           $ref: '#/components/schemas/PaginationMeta'
 */
export const categorySchemas = {};
