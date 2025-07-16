import { Router, Request, Response } from 'express';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Autenticação em desenvolvimento',
    data: {
      token: 'dev-token',
      user: { id: 1, name: 'Usuário Demo', role: 'admin' }
    }
  });
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

router.get('/me', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Usuário Demo',
      email: 'demo@pli.sp.gov.br',
      role: 'admin'
    }
  });
});

export default router;
