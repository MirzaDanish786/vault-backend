export const documentSchema = {};

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 *         publicId:
 *           type: string
 *         size:
 *           type: integer
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *
 *     UploadDocumentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Documents uploaded successfully'
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             documents:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   publicId:
 *                     type: string
 *                   size:
 *                     type: integer
 *                   uploadedAt:
 *                     type: string
 *                     format: date-time
 *             total:
 *               type: integer
 *
 *     UploadSingleDocumentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             publicId:
 *               type: string
 *             documentType:
 *               type: string
 *               enum: [GOVERNMENT_ID, TAX_CERTIFICATE, ADDRESS_PROOF, BANK_STATEMENT]
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *
 *     DeleteDocumentRequest:
 *       type: object
 *       required:
 *         - publicId
 *       properties:
 *         publicId:
 *           type: string
 *           description: The public ID of the document to delete
 *
 *     BulkDeleteDocumentRequest:
 *       type: object
 *       required:
 *         - publicIds
 *       properties:
 *         publicIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of public IDs to delete
 *
 *     DeleteDocumentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Document deleted successfully'
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             publicId:
 *               type: string
 *
 *     BulkDeleteDocumentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Documents deletion completed'
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             results:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   success:
 *                     type: boolean
 *                   error:
 *                     type: string
 *             summary:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 successful:
 *                   type: integer
 *                 failed:
 *                   type: integer
 */
export const documentSchemas = {};
