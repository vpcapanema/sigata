const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    console.log('🧪 Testando upload de arquivo...');
    
    // Criar um PDF de teste simples
    const testContent = 'Este é um arquivo de teste para upload no SIGATA.\nTeste de funcionalidade de upload realizado em ' + new Date().toISOString();
    const testFilePath = './test-upload.txt';
    
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Arquivo de teste criado');
    
    // Preparar FormData
    const form = new FormData();
    form.append('document', fs.createReadStream(testFilePath));
    form.append('titulo', 'Teste de Upload SIGATA');
    form.append('descricao', 'Arquivo de teste para validar funcionalidade de upload');
    
    // Fazer upload
    const response = await fetch('http://localhost:3001/api/documents/upload', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer test-token-' + Date.now()
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('🎉 UPLOAD FUNCIONOU!');
      console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Erro no upload:', result);
    }
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    console.log('🧹 Arquivo de teste removido');
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

// Aguardar um pouco para o servidor subir
setTimeout(testUpload, 3000);
