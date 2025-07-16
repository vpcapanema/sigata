import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      analyses: [],
      total: 0,
      message: 'Nenhuma análise encontrada'
    }
  });
});

router.post('/process', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Processamento NLP em desenvolvimento',
      analysisId: `analysis_${Date.now()}`
    }
  });
});

export default router;
