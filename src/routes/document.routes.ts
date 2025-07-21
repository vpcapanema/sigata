import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { uploadController } from '../controllers/upload.controller';
import { processingController } from '../controllers/processing.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();
const documentController = new DocumentController();

// === ROTAS DE UPLOAD (ARQUIVO APENAS) ===
router.post('/upload', uploadMiddleware.single('document'), uploadController.upload);
router.get('/full-view', processingController.getAllDocumentsFull); // <-- ANTES do /:id
router.get('/', uploadController.list);
router.get('/:id', uploadController.getDocument);

// === ROTAS DE PROCESSAMENTO NLP ===
router.post('/:id/process', processingController.startProcessing);
router.get('/:id/status', processingController.getProcessingStatus);
router.get('/:id/results', processingController.getAnalysisResults);

// === ROTAS DE DOWNLOAD E DETALHES ===
router.get('/:id/download', documentController.downloadDocument);
router.get('/:id/details', documentController.getDocumentDetails);
router.delete('/:id/delete', documentController.deleteDocument);

// Rota já definida acima

// === ROTAS LEGACY (PARA COMPATIBILIDADE) ===
router.get('/complete-view', documentController.completeView);
router.get('/:id/analysis', documentController.getAnalysis);

export default router;
