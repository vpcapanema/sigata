// SIGATA - Testes End-to-End para Produção
// Validação completa do sistema após correções

const { execSync } = require('child_process');
const axios = require('axios');

// Configuração do ambiente
const API_BASE = process.env.API_URL || 'http://localhost:3001';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:semil2025*@pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com:5432/pli_db?sslmode=require';

console.log('🚀 INICIANDO TESTES DE PRODUÇÃO SIGATA');
console.log('=====================================');
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
        // Testar conexão com PostgreSQL
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

async function testBackendAPI() {
    console.log('\n🔧 TESTE 2: API Backend');
    console.log('----------------------');
    
    try {
        // Testar health check
        const healthResponse = await axios.get(`${API_BASE}/health`);
        logTest('Health Check', healthResponse.status === 200 ? 'PASS' : 'FAIL');
        
        // Testar autenticação
        const authResponse = await axios.post(`${API_BASE}/api/auth/login`, {
            email: 'admin@pli.sp.gov.br',
            password: 'admin123'
        });
        
        logTest('Autenticação Admin', authResponse.status === 200 ? 'PASS' : 'FAIL');
        
        if (authResponse.status === 200) {
            const token = authResponse.data.token;
            const headers = { Authorization: `Bearer ${token}` };
            
            // Testar endpoints principais
            const documentosResponse = await axios.get(`${API_BASE}/api/documents`, { headers });
            logTest('Endpoint /api/documents', documentosResponse.status === 200 ? 'PASS' : 'FAIL');
            
            const usuariosResponse = await axios.get(`${API_BASE}/api/usuarios/estatisticas`, { headers });
            logTest('Endpoint /api/usuarios/estatisticas', usuariosResponse.status === 200 ? 'PASS' : 'FAIL');
            
            const metricsResponse = await axios.get(`${API_BASE}/api/metrics`, { headers });
            logTest('Endpoint /api/metrics', metricsResponse.status === 200 ? 'PASS' : 'FAIL');
        }
        
    } catch (error) {
        logTest('API Backend', 'FAIL', error.message);
    }
}

async function testSchemaConsistency() {
    console.log('\n🔍 TESTE 3: Consistência do Schema');
    console.log('----------------------------------');
    
    try {
        const { Client } = require('pg');
        const client = new Client({ connectionString: DB_URL });
        await client.connect();
        
        // Testar constraints de status_processamento
        const statusConstraint = await client.query(`
            SELECT check_clause FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%status_processamento%'
        `);
        
        if (statusConstraint.rows.length > 0) {
            const constraint = statusConstraint.rows[0].check_clause;
            const hasCorrectValues = constraint.includes('PENDENTE') && 
                                   constraint.includes('PROCESSANDO') && 
                                   constraint.includes('CONCLUIDO');
            logTest('Status Processamento Constraint', hasCorrectValues ? 'PASS' : 'FAIL');
        }
        
        // Testar constraints de tipo_usuario
        const tipoUsuarioConstraint = await client.query(`
            SELECT check_clause FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%tipo_usuario%'
        `);
        
        if (tipoUsuarioConstraint.rows.length > 0) {
            const constraint = tipoUsuarioConstraint.rows[0].check_clause;
            const hasCorrectValues = constraint.includes('ADMIN') && 
                                   constraint.includes('GESTOR') && 
                                   constraint.includes('ANALISTA');
            logTest('Tipo Usuario Constraint', hasCorrectValues ? 'PASS' : 'FAIL');
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
        }
        
        await client.end();
        
    } catch (error) {
        logTest('Schema Consistency', 'FAIL', error.message);
    }
}

async function testFrontendIntegration() {
    console.log('\n🌐 TESTE 4: Integração Frontend');
    console.log('-------------------------------');
    
    try {
        // Verificar se arquivos HTML existem
        const fs = require('fs');
        const path = require('path');
        
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
        
    } catch (error) {
        logTest('Frontend Integration', 'FAIL', error.message);
    }
}

async function testDataFlow() {
    console.log('\n🔄 TESTE 5: Fluxo de Dados');
    console.log('--------------------------');
    
    try {
        const { Client } = require('pg');
        const client = new Client({ connectionString: DB_URL });
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
        
        logTest('View Query Execution', 'PASS', `${stats.total_records} registros`);
        logTest('Unique Documents', stats.unique_documents > 0 ? 'PASS' : 'FAIL');
        
        // Testar foreign keys
        const fkQuery = `
            SELECT COUNT(*) as broken_fks FROM sigata.documento_base db
            LEFT JOIN usuarios.usuario_sistema us ON db.usuario_upload_id = us.id
            WHERE db.usuario_upload_id IS NOT NULL AND us.id IS NULL
        `;
        
        const fkResult = await client.query(fkQuery);
        logTest('Foreign Key Integrity', fkResult.rows[0].broken_fks == 0 ? 'PASS' : 'FAIL');
        
        await client.end();
        
    } catch (error) {
        logTest('Data Flow', 'FAIL', error.message);
    }
}

async function runAllTests() {
    console.log('📋 Executando todos os testes...\n');
    
    await testDatabaseConnection();
    await testBackendAPI();
    await testSchemaConsistency();
    await testFrontendIntegration();
    await testDataFlow();
    
    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES');
    console.log('===================');
    console.log(`Total de Testes: ${totalTests}`);
    console.log(`✅ Passou: ${passedTests}`);
    console.log(`❌ Falhou: ${failedTests}`);
    console.log(`📈 Taxa de Sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
        console.log('\n🎉 SISTEMA PRONTO PARA PRODUÇÃO! 🚀');
    } else {
        console.log(`\n⚠️  ${failedTests} teste(s) falharam. Revisar antes da produção.`);
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

module.exports = {
    runAllTests,
    testDatabaseConnection,
    testBackendAPI,
    testSchemaConsistency,
    testFrontendIntegration,
    testDataFlow
};
