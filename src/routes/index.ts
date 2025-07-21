import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import diagnosticRoutes from './diagnostic.routes';

const router = Router();

// Agregação de todas as rotas
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/api', analyticsRoutes);
router.use('/api', adminRoutes);
router.use('/diagnostics', diagnosticRoutes);

// Export default para usar no index.ts
export default router;
