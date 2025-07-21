# Migração de UUIDs para IDs Inteiros

Este documento descreve o processo de migração do banco de dados SIGATA de UUIDs para IDs inteiros.

## Visão Geral

A migração converte todas as chaves primárias e estrangeiras de UUID para inteiros auto-incrementais, o que resolve problemas de compatibilidade e melhora o desempenho do sistema.

## Pré-requisitos

- Backup completo do banco de dados antes de iniciar
- Servidor PostgreSQL acessível
- Variáveis de ambiente configuradas no arquivo `.env`

## Passos para Migração

### 1. Parar o sistema

```bash
# Encerre todas as instâncias do backend
```

### 2. Executar o script de migração

```bash
npm run migrate
```

Este comando executa:
- Criação de sequências para auto-incremento
- Backup das tabelas existentes (tabelas _old)
- Conversão de todas as colunas ID de UUID para integer
- Recriação das chaves estrangeiras
- Atualização das sequências para o próximo valor disponível

### 3. Verificar a migração

Após a migração, verifique se:

- Todos os dados foram preservados
- As relações entre tabelas estão funcionando
- As sequências estão configuradas corretamente

### 4. Iniciar o sistema

```bash
npm run dev
```

## Resolução de Problemas

Se encontrar problemas durante a migração:

1. Restaure o backup do banco de dados
2. Verifique os logs de erro
3. Ajuste o script de migração conforme necessário
4. Tente novamente

## Alterações no Código

O código foi atualizado para:

- Aceitar tanto IDs numéricos quanto códigos de documento
- Converter automaticamente strings numéricas para números
- Usar IDs numéricos em todas as operações de banco de dados

## Tabelas Afetadas

- sigata.documento_base
- sigata.documento_arquivo
- sigata.documento_nlp_dados
- sigata.documento_nlp_metricas
- sigata.documento_ata_dados
- sigata.documento_qualidade
- sigata.documento_controle
- sigata.relatorio_base
- sigata.relatorio_resultados
- sigata.relatorio_controle
- usuarios.usuario_sistema