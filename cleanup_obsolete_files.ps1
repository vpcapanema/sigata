# 🗑️ SCRIPT DE LIMPEZA - ARQUIVOS DESNECESSÁRIOS
# Execute este script para remover arquivos obsoletos da nova arquitetura modular

# ❌ Arquivo monolítico original (backup)
Remove-Item "d:\SEMIL\PLI\SIGATA\src\index_original_backup.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\app.ts" -Force

# ❌ Controllers duplicados/antigos
Remove-Item "d:\SEMIL\PLI\SIGATA\src\controllers\userController.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\controllers\documentController.ts" -Force  
Remove-Item "d:\SEMIL\PLI\SIGATA\src\controllers\reportController.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\controllers\analysisController.ts" -Force

# ❌ Rotas antigas/duplicadas  
Remove-Item "d:\SEMIL\PLI\SIGATA\src\routes\auth.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\routes\documents.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\routes\upload.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\routes\reports.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\routes\analysis.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\routes\health.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\routes\usuarios.ts" -Force

# ❌ Serviços duplicados
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\userService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\usuarioService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\documentoService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\nlpService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\advancedNLPService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\hybridNLPService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\metricsService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\activityService.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\notificationService.ts" -Force

# ❌ Middleware duplicado
Remove-Item "d:\SEMIL\PLI\SIGATA\src\middlewares\validation.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\middleware\requestLogger.ts" -Force

# ❌ Utilitários não utilizados
Remove-Item "d:\SEMIL\PLI\SIGATA\src\utils\redis.ts" -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\scripts\updateAdminPassword.ts" -Force

# ❌ Diretórios completos não utilizados
Remove-Item "d:\SEMIL\PLI\SIGATA\src\python" -Recurse -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\services\__pycache__" -Recurse -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\middlewares" -Recurse -Force
Remove-Item "d:\SEMIL\PLI\SIGATA\src\scripts" -Recurse -Force

Write-Host "🧹 Limpeza concluída! Arquivos obsoletos removidos."
Write-Host "✅ Nova arquitetura modular está limpa e otimizada."
