import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      reports: [],
      total: 0,
      message: 'Nenhum relatório encontrado'
    }
  });
});

router.post('/generate', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Geração de relatórios em desenvolvimento',
      reportId: `report_${Date.now()}`
    }
  });
});

export default router;
