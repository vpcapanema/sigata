/**
 * Script para verificar as tabelas do banco de dados
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Verificando tabelas do banco de dados...');

// Executar o script de verificação
const nodeProcess = spawn('node', [path.join(__dirname, 'src', 'database', 'check_tables.js')]);

nodeProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

nodeProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

nodeProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Verificação concluída!');
  } else {
    console.error(`❌ Erro na verificação. Código de saída: ${code}`);
  }
});