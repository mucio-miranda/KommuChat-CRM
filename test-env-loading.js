// Teste para verificar se as variáveis de ambiente estão sendo carregadas
console.log('🧪 Testando carregamento das variáveis de ambiente...\n');

// Simular o que o Vite deveria carregar
const env = {
  VITE_CRM_SUPABASE_URL: import.meta.env?.VITE_CRM_SUPABASE_URL,
  VITE_CRM_SUPABASE_ANON_KEY: import.meta.env?.VITE_CRM_SUPABASE_ANON_KEY,
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY,
  VITE_GOOGLE_CLIENT_ID: import.meta.env?.VITE_GOOGLE_CLIENT_ID,
  VITE_GOOGLE_CLIENT_SECRET: import.meta.env?.VITE_GOOGLE_CLIENT_SECRET,
  VITE_GOOGLE_REDIRECT_URI: import.meta.env?.VITE_GOOGLE_REDIRECT_URI
};

console.log('📋 Variáveis de ambiente carregadas:');
console.log('VITE_CRM_SUPABASE_URL:', env.VITE_CRM_SUPABASE_URL || 'undefined');
console.log('VITE_CRM_SUPABASE_ANON_KEY:', env.VITE_CRM_SUPABASE_ANON_KEY ? 'Presente' : 'undefined');
console.log('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL || 'undefined');
console.log('VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 'Presente' : 'undefined');
console.log('VITE_GOOGLE_CLIENT_ID:', env.VITE_GOOGLE_CLIENT_ID || 'undefined');
console.log('VITE_GOOGLE_CLIENT_SECRET:', env.VITE_GOOGLE_CLIENT_SECRET ? 'Presente' : 'undefined');
console.log('VITE_GOOGLE_REDIRECT_URI:', env.VITE_GOOGLE_REDIRECT_URI || 'undefined');

console.log('\n🔍 Verificando se import.meta.env está disponível:');
console.log('import.meta.env:', typeof import.meta !== 'undefined' ? 'Disponível' : 'Indisponível');

if (typeof import.meta !== 'undefined' && import.meta.env) {
  console.log('📝 Todas as variáveis em import.meta.env:');
  Object.keys(import.meta.env).forEach(key => {
    console.log(`  ${key}: ${import.meta.env[key] ? 'Presente' : 'undefined'}`);
  });
} else {
  console.log('❌ import.meta.env não está disponível - isso pode indicar que não estamos rodando no Vite');
}





