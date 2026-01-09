/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           readOnly: true
 *           example: '123e4567-e89b-12d3-a456-426614174000'
 *         name:
 *           type: string
 *           example: 'Electronics'
 *         slug:
 *           type: string
 *           example: 'electronics'
 *         description:
 *           type: string
 *           example: 'Electronic devices and accessories'
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         isActive:
 *           type: boolean
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 * 
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         name:
 *           type: string
 *           example: 'Electronics'
 *         slug:
 *           type: string
 *           example: 'electronics'
 *         description:
 *           type: string
 *           example: 'Electronic devices and accessories'
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 * 
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: 'Updated Electronics'
 *         slug:
 *           type: string
 *           example: 'updated-electronics'
 *         description:
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
