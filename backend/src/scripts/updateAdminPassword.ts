import bcrypt from 'bcrypt';
import { database } from '../config/database';

async function atualizarSenhaAdmin() {
  try {
    const senhaHash = await bcrypt.hash('admin123', 12);
    console.log('Hash gerado:', senhaHash);
    
    const query = 'UPDATE usuarios.usuario_sistema SET senha_hash = $1 WHERE username = $2';
    await database.query(query, [senhaHash, 'admin']);
    
    console.log('✅ Senha do admin atualizada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
  }
}

atualizarSenhaAdmin();
