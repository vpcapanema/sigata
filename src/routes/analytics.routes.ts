import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const analyticsController = new AnalyticsController();

// Rotas de analytics e estatísticas
router.get('/stats/basico', analyticsController.basicStats);
router.get('/dashboard/:userId', analyticsController.userDashboard);
router.get('/relatorios/resultados', analyticsController.reportResults);
router.get('/analysis', analyticsController.analysis);
router.get('/reports/advanced', analyticsController.advancedReport);

export default router;
