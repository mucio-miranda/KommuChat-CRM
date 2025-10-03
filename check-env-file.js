// Verificar o arquivo .env diretamente
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando arquivo .env...\n');

try {
  const envPath = path.join(__dirname, '.env');
  console.log('📁 Caminho do arquivo:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Arquivo .env existe');
    
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('📏 Tamanho do arquivo:', content.length, 'bytes');
    
    const lines = content.split('\n');
    console.log('📝 Número de linhas:', lines.length);
    
    console.log('\n📋 Conteúdo do arquivo:');
    lines.forEach((line, index) => {
      console.log(`${index + 1}: ${line.length > 100 ? line.substring(0, 100) + '...' : line}`);
    });
    
    // Verificar se as variáveis essenciais estão presentes
    const requiredVars = [
      'VITE_CRM_SUPABASE_URL',
      'VITE_CRM_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    console.log('\n🔍 Verificando variáveis essenciais:');
    requiredVars.forEach(varName => {
      const hasVar = content.includes(varName);
      console.log(`${varName}: ${hasVar ? '✅ Presente' : '❌ Ausente'}`);
    });
    
    // Verificar se há problemas de formatação
    const hasLongLines = lines.some(line => line.length > 200);
    console.log(`\n⚠️  Linhas muito longas (>200 chars): ${hasLongLines ? 'Sim' : 'Não'}`);
    
    if (hasLongLines) {
      console.log('💡 Isso pode causar problemas no carregamento pelo Vite');
    }
    
  } else {
    console.log('❌ Arquivo .env não existe');
  }
} catch (error) {
  console.log('❌ Erro ao ler arquivo .env:', error.message);
}