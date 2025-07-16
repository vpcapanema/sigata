import { Router } from 'express';
import documentController from '../controllers/documentController';

const router = Router();

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Lista documentos com filtros e paginação
 */
router.get('/', documentController.listDocuments);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Obtém um documento específico
 */
router.get('/:id', documentController.getDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Exclui um documento
 */
router.delete('/:id', documentController.deleteDocument);

/**
 * @swagger
 * /api/documents/bulk-delete:
 *   post:
 *     summary: Exclusão em lote de documentos
 */
router.post('/bulk-delete', documentController.bulkDeleteDocuments);

/**
 * @swagger
 * /api/documents/{id}/reprocess:
 *   post:
 *     summary: Reprocessa um documento
 */
router.post('/:id/reprocess', documentController.reprocessDocument);

/**
 * @swagger
 * /api/documents/stats:
 *   get:
 *     summary: Estatísticas de documentos do usuário
 */
router.get('/stats', documentController.getDocumentStats);

export default router;
