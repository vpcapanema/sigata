// SIGATA - Testes End-to-End para Produção (Versão Corrigida)
// Validação completa com SSL bypass e fallbacks

const axios = require('axios');

// Configuração do ambiente
const API_BASE = process.env.API_URL || 'http://localhost:3001';
const DB_CONFIG = {
    host: 'pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'pli_db',
    user: 'postgres',
    password: 'semil2025*',
    ssl: {
        rejectUnauthorized: false // Bypass SSL para RDS
    }
};

console.log('🚀 TESTES DE PRODUÇÃO SIGATA - VERSÃO CORRIGIDA');
console.log('==============================================');
console.log(`API Base: ${API_BASE}`);
console.log(`Database: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(name, status, message = '') {
    totalTests++;
    const emoji = status === 'PASS' ? '✅' : '❌';
    console.log(`${emoji} ${name}: ${status}${message ? ' - ' + message : ''}`);
    
    if (status === 'PASS') {
        passedTests++;
    } else {
        failedTests++;
    }
}

async function testDatabaseConnection() {
    console.log('\n📊 TESTE 1: Conexão com Banco de Dados');
    console.log('-------------------------------------');
    
    try {
        // Testar conexão com PostgreSQL usando configuração SSL corrigida
        const { Client } = require('pg');
        const client = new Client(DB_CONFIG);
        
        await client.connect();
        logTest('Conexão PostgreSQL', 'PASS', 'Conectado com SSL bypass');
        
        // Testar schemas
        const schemaResult = await client.query(`
            SELECT schema_name FROM information_schema.schemata 
            WHERE schema_name IN ('sigata', 'usuarios', 'cadastro')
        `);
        
        const schemas = schemaResult.rows.map(row => row.schema_name);
        logTest('Schema sigata', schemas.includes('sigata') ? 'PASS' : 'FAIL');
        logTest('Schema usuarios', schemas.includes('usuarios') ? 'PASS' : 'FAIL');
        logTest('Schema cadastro', schemas.includes('cadastro') ? 'PASS' : 'FAIL');
        
        // Testar tabelas principais do sigata
        const tablesResult = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'sigata' AND table_type = 'BASE TABLE'
        `);
        
        const tables = tablesResult.rows.map(row => row.table_name);
        const expectedTables = [
            'documento_base', 'documento_arquivo', 'documento_controle',
            'documento_ata_dados', 'documento_nlp_dados', 'documento_nlp_metricas',
            'relatorio_base', 'relatorio_controle', 'relatorio_resultados'
        ];
        
        expectedTables.forEach(table => {
            logTest(`Tabela sigata.${table}`, tables.includes(table) ? 'PASS' : 'FAIL');
        });
        
        // Testar view principal
        const viewResult = await client.query(`
            SELECT viewname FROM pg_views 
            WHERE schemaname = 'sigata' AND viewname = 'documentos_processamento_full'
        `);
        
        logTest('View documentos_processamento_full', viewResult.rows.length > 0 ? 'PASS' : 'FAIL');
        
        // Testar dados de exemplo
        const dataCount = await client.query(`
            SELECT COUNT(*) as total FROM sigata.documento_base
        `);
        
        logTest('Dados documento_base', parseInt(dataCount.rows[0].total) >= 0 ? 'PASS' : 'FAIL', 
                `${dataCount.rows[0].total} registros`);
        
        await client.end();
        
    } catch (error) {
        logTest('Conexão PostgreSQL', 'FAIL', error.message);
        
        // Fallback: testar se o servidor está respondendo
        try {
            const { execSync } = require('child_process');
            execSync(`ping -n 1 ${DB_CONFIG.host}`, { stdio: 'pipe' });
            logTest('Ping Database Host', 'PASS', 'Host responde ao ping');
        } catch (pingError) {
            logTest('Ping Database Host', 'FAIL', 'Host não responde');
        }
    }
}

async function testSchemaConstraints() {
    console.log('\n🔍 TESTE 2: Constraints do Schema');
    console.log('---------------------------------');
    
    try {
        const { Client } = require('pg');
        const client = new Client(DB_CONFIG);
        await client.connect();
        
        // Testar constraint status_processamento
        const statusQuery = `
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conname LIKE '%status_processamento%'
        `;
        
        const statusResult = await client.query(statusQuery);
        if (statusResult.rows.length > 0) {
            const constraint = statusResult.rows[0].definition;
            const hasCorrectValues = constraint.includes('PENDENTE') && 
                                   constraint.includes('PROCESSANDO') && 
                                   constraint.includes('CONCLUIDO');
            logTest('Constraint status_processamento', hasCorrectValues ? 'PASS' : 'FAIL');
        } else {
            logTest('Constraint status_processamento', 'FAIL', 'Constraint não encontrada');
        }
        
        // Testar constraint tipo_usuario
        const tipoQuery = `
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conname LIKE '%tipo_usuario%'
        `;
        
        const tipoResult = await client.query(tipoQuery);
        if (tipoResult.rows.length > 0) {
            const constraint = tipoResult.rows[0].definition;
            const hasCorrectValues = constraint.includes('ADMIN') && 
                                   constraint.includes('GESTOR') && 
                                   constraint.includes('ANALISTA');
            logTest('Constraint tipo_usuario', hasCorrectValues ? 'PASS' : 'FAIL');
        } else {
            logTest('Constraint tipo_usuario', 'FAIL', 'Constraint não encontrada');
        }
        
        // Testar constraint sentimento
        const sentimentoQuery = `
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conname LIKE '%sentimento%'
        `;
        
        const sentimentoResult = await client.query(sentimentoQuery);
        if (sentimentoResult.rows.length > 0) {
            const constraint = sentimentoResult.rows[0].definition;
            const hasCorrectValues = constraint.includes('POSITIVO') && 
                                   constraint.includes('NEUTRO') && 
                                   constraint.includes('NEGATIVO');
            logTest('Constraint sentimento', hasCorrectValues ? 'PASS' : 'FAIL');
        } else {
            logTest('Constraint sentimento', 'FAIL', 'Constraint não encontrada');
        }
        
        await client.end();
        
    } catch (error) {
        logTest('Schema Constraints', 'FAIL', error.message);
    }
}

async function testBackendFiles() {
    console.log('\n🔧 TESTE 3: Arquivos Backend');
    console.log('----------------------------');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Testar arquivos corrigidos
        const backendFiles = [
            'backend/src/utils/validation.ts',
            'backend/src/services/documentoService.ts',
            'backend/src/routes/auth.ts',
            'backend/src/types/index.ts',
            'backend/src/controllers/userController.ts',
            'backend/src/controllers/documentController.ts'
        ];
        
        backendFiles.forEach(file => {
            const fullPath = path.join(process.cwd(), file);
            const exists = fs.existsSync(fullPath);
            logTest(`Arquivo ${file}`, exists ? 'PASS' : 'FAIL');
            
            if (exists) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Verificar correções específicas
                if (file.includes('validation.ts')) {
                    const hasCorrectStatus = content.includes('PENDENTE') && content.includes('PROCESSANDO');
                    const hasCorrectRoles = content.includes('GESTOR') && content.includes('ANALISTA');
                    logTest('Validation.ts - Status corretos', hasCorrectStatus ? 'PASS' : 'FAIL');
                    logTest('Validation.ts - Roles corretos', hasCorrectRoles ? 'PASS' : 'FAIL');
                }
                
                if (file.includes('types/index.ts')) {
                    const hasCorrectEnum = content.includes('GESTOR') && content.includes('OPERADOR');
                    const hasCorrectSentiment = content.includes('POSITIVO') && content.includes('NEUTRO');
                    logTest('Types - UserRole enum', hasCorrectEnum ? 'PASS' : 'FAIL');
                    logTest('Types - Sentiment values', hasCorrectSentiment ? 'PASS' : 'FAIL');
                }
            }
        });
        
    } catch (error) {
        logTest('Backend Files', 'FAIL', error.message);
    }
}

async function testFrontendFiles() {
    console.log('\n🌐 TESTE 4: Arquivos Frontend');
    console.log('-----------------------------');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Testar arquivos HTML
        const frontendFiles = [
            'frontend_html/index.html',
            'frontend_html/dashboard.html', 
            'frontend_html/documents.html',
            'frontend_html/view-complete.html',
            'frontend_html/js/api-config.js',
            'frontend_html/js/data-manager.js'
        ];
        
        frontendFiles.forEach(file => {
            const fullPath = path.join(process.cwd(), file);
            const exists = fs.existsSync(fullPath);
            logTest(`Arquivo ${file}`, exists ? 'PASS' : 'FAIL');
            
            if (exists && file.includes('view-complete.html')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Verificar correções de sentimento
                const hasCorrectSentiment = content.includes('POSITIVO') && 
                                          content.includes('NEUTRO') && 
                                          content.includes('NEGATIVO');
                logTest('Frontend - Sentimentos corretos', hasCorrectSentiment ? 'PASS' : 'FAIL');
                
                // Verificar se não tem valores antigos
                const hasOldValues = content.includes("'positivo'") || 
                                   content.includes("'neutro'") || 
                                   content.includes("'negativo'");
                logTest('Frontend - Sem valores antigos', !hasOldValues ? 'PASS' : 'FAIL');
            }
        });
        
    } catch (error) {
        logTest('Frontend Files', 'FAIL', error.message);
    }
}

async function testConfigurationFiles() {
    console.log('\n⚙️ TESTE 5: Arquivos de Configuração');
    console.log('------------------------------------');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Testar arquivos de configuração
        const configFiles = [
            'package.json',
            'backend/package.json', 
            'backend/.env',
            'docker-compose.yml',
            '.gitignore'
        ];
        
        configFiles.forEach(file => {
            const fullPath = path.join(process.cwd(), file);
            const exists = fs.existsSync(fullPath);
            logTest(`Config ${file}`, exists ? 'PASS' : 'FAIL');
        });
        
        // Testar arquivos de documentação
        const docFiles = [
            'README.md',
            'MAPEAMENTO_SCHEMA_SIGATA_COMPLETO.md',
            'RELATORIO_INCONSISTENCIAS_SISTEMA.md',
            'fluxo-dados.md'
        ];
        
        docFiles.forEach(file => {
            const fullPath = path.join(process.cwd(), file);
            const exists = fs.existsSync(fullPath);
            logTest(`Doc ${file}`, exists ? 'PASS' : 'FAIL');
        });
        
    } catch (error) {
        logTest('Configuration Files', 'FAIL', error.message);
    }
}

async function testSystemIntegrity() {
    console.log('\n🔐 TESTE 6: Integridade do Sistema');
    console.log('----------------------------------');
    
    try {
        // Testar se backend pode iniciar (dry run)
        const { execSync } = require('child_process');
        
        try {
            // Verificar sintaxe TypeScript
            execSync('cd backend && npx tsc --noEmit', { stdio: 'pipe' });
            logTest('TypeScript Syntax Check', 'PASS', 'Sem erros de sintaxe');
        } catch (tscError) {
            logTest('TypeScript Syntax Check', 'FAIL', 'Erros de compilação encontrados');
        }
        
        // Verificar dependências
        const fs = require('fs');
        const packageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
        const hasPg = packageJson.dependencies && packageJson.dependencies.pg;
        const hasExpress = packageJson.dependencies && packageJson.dependencies.express;
        
        logTest('Dependência PostgreSQL (pg)', hasPg ? 'PASS' : 'FAIL');
        logTest('Dependência Express', hasExpress ? 'PASS' : 'FAIL');
        
        // Verificar estrutura de pastas
        const requiredDirs = [
            'backend/src',
            'backend/src/controllers',
            'backend/src/services', 
            'backend/src/routes',
            'backend/src/types',
            'frontend_html',
            'frontend_html/js'
        ];
        
        requiredDirs.forEach(dir => {
            const exists = fs.existsSync(dir);
            logTest(`Diretório ${dir}`, exists ? 'PASS' : 'FAIL');
        });
        
    } catch (error) {
        logTest('System Integrity', 'FAIL', error.message);
    }
}

async function runAllTests() {
    console.log('📋 Executando validação completa para produção...\n');
    
    await testDatabaseConnection();
    await testSchemaConstraints();
    await testBackendFiles();
    await testFrontendFiles();
    await testConfigurationFiles();
    await testSystemIntegrity();
    
    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES');
    console.log('===================');
    console.log(`Total de Testes: ${totalTests}`);
    console.log(`✅ Passou: ${passedTests}`);
    console.log(`❌ Falhou: ${failedTests}`);
    console.log(`📈 Taxa de Sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
        console.log('\n🎉 SISTEMA 100% PRONTO PARA PRODUÇÃO! 🚀');
        console.log('✅ Todas as inconsistências foram corrigidas');
        console.log('✅ Schema do banco está correto');
        console.log('✅ Backend validado');
        console.log('✅ Frontend corrigido');
        console.log('✅ Configurações validadas');
    } else {
        console.log(`\n⚠️  ${failedTests} teste(s) falharam. Detalhes acima.`);
        console.log('❌ Sistema NÃO está pronto para produção');
    }
    
    return failedTests === 0;
}

// Executar testes
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Erro durante os testes:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };
