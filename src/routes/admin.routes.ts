import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

// Rotas administrativas
router.get('/test-db', adminController.testDatabase);
router.get('/schema/sigata', adminController.sigataSchema);
router.get('/schema/table/:schema/:table', adminController.tableStructure);
router.get('/usuarios', adminController.listUsers);

export default router;
