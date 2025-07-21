# Checklist de Produção SIGATA

## Checklist Técnico

1. Configuração de ambiente (.env, secrets, AWS, banco)
2. Scripts de build/deploy (npm, Docker, CI/CD)
3. Dockerfile backend/frontend, Nginx, Compose
4. Monitoramento, health-check, logs
5. Segurança (JWT, CORS, rate limit, LGPD)
6. Documentação e treinamento

## Roteiro de Validação do Fluxo

1. **Upload de Documento**
   - Enviar PDF/DOCX via frontend
   - Mensagem de sucesso e progresso
2. **Processamento NLP**
   - Backend extrai texto e processa
   - Logs: texto extraído, análise salva
3. **Persistência no Banco**
   - Documento/análise salvos nas tabelas
   - Conferir via endpoint ou dashboard
4. **Listagem e Download**
   - Documento aparece na lista
   - Download/visualização funcionam
5. **Relatórios e Analytics**
   - Gerar relatório/análise
   - Dados batem com documento enviado
6. **Autenticação e Segurança**
   - Login/logout
   - Endpoints protegidos bloqueiam sem token

Se algum passo falhar, anote o erro/mensagem e envie para diagnóstico.
