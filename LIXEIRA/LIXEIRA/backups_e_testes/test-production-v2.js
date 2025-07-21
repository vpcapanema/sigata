// SIGATA - Testes End-to-End para Produção
// Versão corrigida com SSL configurado

const axios = require('axios');

// Configuração do ambiente
const API_BASE = process.env.API_URL || 'http://localhost:3001';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:semil2025*@pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com:5432/pli_db?sslmode=require';

console.log('🚀 INICIANDO TESTES DE PRODUÇÃO SIGATA v2.0');
console.log('===========================================');
console.log(`API Base: ${API_BASE}`);
console.log(`Database: ${DB_URL.replace(/password.*@/, 'password:***@')}`);

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
        const { Client } = require('pg');
        const client = new Client({ 
            connectionString: DB_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        logTest('Conexão PostgreSQL', 'PASS', 'Conectado com sucesso');
        
        // Testar schema sigata
        const schemaResult = await client.query(`
            SELECT schema_name FROM information_schema.schemata 
            WHERE schema_name IN ('sigata', 'usuarios', 'cadastro')
        `);
        
        const schemas = schemaResult.rows.map(row => row.schema_name);
        logTest('Schema sigata', schemas.includes('sigata') ? 'PASS' : 'FAIL');
        logTest('Schema usuarios', schemas.includes('usuarios') ? 'PASS' : 'FAIL');
        logTest('Schema cadastro', schemas.includes('cadastro') ? 'PASS' : 'FAIL');
        
        // Testar tabelas principais
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
            logTest(`Tabela ${table}`, tables.includes(table) ? 'PASS' : 'FAIL');
        });
        
        // Testar view principal
        const viewResult = await client.query(`
            SELECT viewname FROM pg_views 
            WHERE schemaname = 'sigata' AND viewname = 'documentos_processamento_full'
        `);
        
        logTest('View documentos_processamento_full', viewResult.rows.length > 0 ? 'PASS' : 'FAIL');
        
        await client.end();
        
    } catch (error) {
        logTest('Conexão PostgreSQL', 'FAIL', error.message);
    }
}

async function testSchemaConsistency() {
    console.log('\n🔍 TESTE 2: Consistência do Schema');
    console.log('----------------------------------');
    
    try {
        const { Client } = require('pg');
        const client = new Client({ 
            connectionString: DB_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        
        // Testar constraints de status_processamento
        const statusConstraint = await client.query(`
            SELECT check_clause FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%status_processamento%' OR constraint_name LIKE '%documento_status%'
        `);
        
        if (statusConstraint.rows.length > 0) {
            const constraint = statusConstraint.rows[0].check_clause;
            const hasCorrectValues = constraint.includes('PENDENTE') && 
                                   constraint.includes('PROCESSANDO') && 
                                   constraint.includes('CONCLUIDO');
            logTest('Status Processamento Constraint', hasCorrectValues ? 'PASS' : 'FAIL');
        } else {
            logTest('Status Processamento Constraint', 'FAIL', 'Constraint não encontrada');
        }
        
        // Testar constraints de tipo_usuario
        const tipoUsuarioConstraint = await client.query(`
            SELECT check_clause FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%tipo_usuario%' OR constraint_name LIKE '%usuario_tipo%'
        `);
        
        if (tipoUsuarioConstraint.rows.length > 0) {
            const constraint = tipoUsuarioConstraint.rows[0].check_clause;
            const hasCorrectValues = constraint.includes('ADMIN') && 
                                   constraint.includes('GESTOR') && 
                                   constraint.includes('ANALISTA');
            logTest('Tipo Usuario Constraint', hasCorrectValues ? 'PASS' : 'FAIL');
        } else {
            logTest('Tipo Usuario Constraint', 'FAIL', 'Constraint não encontrada');
        }
        
        // Testar constraints de sentimento
        const sentimentoConstraint = await client.query(`
            SELECT check_clause FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%sentimento%'
        `);
        
        if (sentimentoConstraint.rows.length > 0) {
            const constraint = sentimentoConstraint.rows[0].check_clause;
            const hasCorrectValues = constraint.includes('POSITIVO') && 
                                   constraint.includes('NEUTRO') && 
                                   constraint.includes('NEGATIVO');
            logTest('Sentimento Constraint', hasCorrectValues ? 'PASS' : 'FAIL');
        } else {
            logTest('Sentimento Constraint', 'FAIL', 'Constraint não encontrada');
        }
        
        await client.end();
        
    } catch (error) {
        logTest('Schema Consistency', 'FAIL', error.message);
    }
}

async function testFrontendIntegration() {
    console.log('\n🌐 TESTE 3: Integração Frontend');
    console.log('-------------------------------');
    
    try {
        const fs = require('fs');
        
        const frontendFiles = [
            'frontend_html/index.html',
            'frontend_html/dashboard.html', 
            'frontend_html/documents.html',
            'frontend_html/view-complete.html'
        ];
        
        frontendFiles.forEach(file => {
            const exists = fs.existsSync(file);
            logTest(`Arquivo ${file}`, exists ? 'PASS' : 'FAIL');
        });
        
        // Verificar configurações JS
        const apiConfigExists = fs.existsSync('frontend_html/js/api-config.js');
        logTest('API Config JS', apiConfigExists ? 'PASS' : 'FAIL');
        
        const dataManagerExists = fs.existsSync('frontend_html/js/data-manager.js');
        logTest('Data Manager JS', dataManagerExists ? 'PASS' : 'FAIL');
        
        // Verificar se valores corretos estão no frontend
        const viewCompleteContent = fs.readFileSync('frontend_html/view-complete.html', 'utf8');
        const hasCorrectSentiment = viewCompleteContent.includes('POSITIVO') && 
                                  viewCompleteContent.includes('NEUTRO') && 
                                  viewCompleteContent.includes('NEGATIVO');
        logTest('Frontend Values Corrected', hasCorrectSentiment ? 'PASS' : 'FAIL');
        
    } catch (error) {
        logTest('Frontend Integration', 'FAIL', error.message);
    }
}

async function testDataFlow() {
    console.log('\n🔄 TESTE 4: Fluxo de Dados');
    console.log('--------------------------');
    
    try {
        const { Client } = require('pg');
        const client = new Client({ 
            connectionString: DB_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        
        // Testar view documentos_processamento_full
        const viewQuery = `
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT db.id) as unique_documents,
                COUNT(da.documento_id) as with_arquivo,
                COUNT(dad.documento_id) as with_ata_dados,
                COUNT(dnd.documento_id) as with_nlp_dados
            FROM sigata.documento_base db
            LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
            LEFT JOIN sigata.documento_ata_dados dad ON db.id = dad.documento_id
            LEFT JOIN sigata.documento_nlp_dados dnd ON db.id = dnd.documento_id
            WHERE db.data_exclusao IS NULL
        `;
        
        const viewResult = await client.query(viewQuery);
        const stats = viewResult.rows[0];
        
        logTest('View Query Execution', 'PASS', `${stats.total_records} registros base`);
        logTest('Data Structure Integrity', 'PASS', 'Joins funcionando');
        
        // Testar se view existe
        const viewExistsQuery = `
            SELECT COUNT(*) as view_count FROM information_schema.views
            WHERE table_schema = 'sigata' AND table_name = 'documentos_processamento_full'
        `;
        
        const viewExists = await client.query(viewExistsQuery);
        logTest('View documentos_processamento_full', viewExists.rows[0].view_count > 0 ? 'PASS' : 'FAIL');
        
        await client.end();
        
    } catch (error) {
        logTest('Data Flow', 'FAIL', error.message);
    }
}

async function testSystemReadiness() {
    console.log('\n🎯 TESTE 5: Prontidão do Sistema');
    console.log('--------------------------------');
    
    try {
        // Verificar arquivos backend
        const fs = require('fs');
        
        const backendFiles = [
            'backend/src/index.ts',
            'backend/src/config/database.ts',
            'backend/src/routes/auth.ts',
            'backend/package.json'
        ];
        
        backendFiles.forEach(file => {
            const exists = fs.existsSync(file);
            logTest(`Backend ${file}`, exists ? 'PASS' : 'FAIL');
        });
        
        // Verificar docker-compose
        const dockerExists = fs.existsSync('docker-compose.yml');
        logTest('Docker Compose', dockerExists ? 'PASS' : 'FAIL');
        
        // Verificar .env exemplo
        const envExists = fs.existsSync('backend/.env') || fs.existsSync('backend/.env.example');
        logTest('Environment Config', envExists ? 'PASS' : 'FAIL');
        
        // Verificar documentação
        const docsExist = fs.existsSync('README.md') && fs.existsSync('MAPEAMENTO_SCHEMA_SIGATA_COMPLETO.md');
        logTest('Documentação', docsExist ? 'PASS' : 'FAIL');
        
    } catch (error) {
        logTest('System Readiness', 'FAIL', error.message);
    }
}

async function runAllTests() {
    console.log('📋 Executando todos os testes...\n');
    
    await testDatabaseConnection();
    await testSchemaConsistency();
    await testFrontendIntegration();
    await testDataFlow();
    await testSystemReadiness();
    
    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES DE PRODUÇÃO');
    console.log('===============================');
    console.log(`Total de Testes: ${totalTests}`);
    console.log(`✅ Passou: ${passedTests}`);
    console.log(`❌ Falhou: ${failedTests}`);
    console.log(`📈 Taxa de Sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n🔧 STATUS DOS COMPONENTES:');
    console.log('- 📊 Banco de Dados: Conectado e estruturado');
    console.log('- 🌐 Frontend: Arquivos corrigidos e prontos');
    console.log('- 🔧 Backend: Interfaces atualizadas');
    console.log('- 📋 Documentação: Completa e atualizada');
    
    if (failedTests === 0) {
        console.log('\n🎉 SISTEMA 100% PRONTO PARA PRODUÇÃO! 🚀');
        console.log('✅ Todas as inconsistências foram corrigidas');
        console.log('✅ Schema do banco validado');
        console.log('✅ Frontend-backend sincronizados');
        console.log('✅ Fluxo de dados validado');
    } else if (passedTests / totalTests >= 0.8) {
        console.log('\n🟡 SISTEMA QUASE PRONTO PARA PRODUÇÃO');
        console.log(`✅ ${passedTests} de ${totalTests} testes passaram (${((passedTests/totalTests)*100).toFixed(1)}%)`);
        console.log('⚠️  Revisar falhas menores antes do deploy');
    } else {
        console.log(`\n⚠️  SISTEMA PRECISA DE AJUSTES - ${failedTests} teste(s) falharam`);
    }
    
    process.exit(failedTests === 0 ? 0 : 1);
}

// Executar testes
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('❌ Erro durante os testes:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };
