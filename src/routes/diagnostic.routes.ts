import { Router } from 'express';
import { diagnosticController } from '../controllers/diagnostic.controller';

const router = Router();

// Rotas de diagnóstico
router.get('/db/structure', diagnosticController.checkDocumentTableStructure);
router.get('/db/connection', diagnosticController.checkDatabaseConnection);
router.get('/document/:id/test', diagnosticController.testDocumentQuery);

export default router;