/**
 * Script para executar a migração de UUIDs para IDs inteiros
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Iniciando migração de UUIDs para IDs inteiros...');

// Executar o script de migração
const runMigration = () => {
  return new Promise((resolve, reject) => {
    const nodeProcess = spawn('node', [path.join(__dirname, 'src', 'database', 'run_migration.js')]);
    
    nodeProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    nodeProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    nodeProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Migração concluída com sucesso!');
        resolve();
      } else {
        console.error(`❌ Erro na migração. Código de saída: ${code}`);
        reject(new Error(`Processo encerrado com código ${code}`));
      }
    });
  });
};

// Executar a migração
runMigration()
  .then(() => {
    console.log('🚀 Sistema pronto para usar IDs inteiros!');
  })
  .catch((error) => {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  });