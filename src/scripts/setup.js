import { createMasterUser } from '../services/setupService.js';

const setup = async () => {
  console.log('\n=== Iniciando configuração do sistema ===\n');

  try {
    console.log('Criando usuário master...');
    const { data: masterUserData, error: masterUserError } = await createMasterUser();
    
    if (masterUserError) {
      if (masterUserError.code === 'auth/email-already-in-use') {
        console.log('\n✓ Usuário master já existe!');
      } else {
        throw masterUserError;
      }
    } else if (masterUserData) {
      console.log('\n✓ Usuário master criado com sucesso!');
    }

    console.log('\n=== Credenciais do usuário master ===');
    console.log('Email:', 'admin@hybex.com');
    console.log('Senha:', 'Admin@123');
    console.log('\nGuarde essas credenciais em um local seguro!');
    console.log('\n=== Configuração concluída com sucesso! ===\n');

    // Encerrar o processo após a conclusão
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    process.exit(1);
  }
};

// Executar setup
setup(); 