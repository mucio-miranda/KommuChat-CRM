// Script para corrigir tokens duplicados
console.log('🔧 Corrigindo tokens duplicados...');

async function fixDuplicateTokens() {
  try {
    const supabaseUrl = 'https://wywzdtyjzzmcehrsalvn.supabase.co';
    const supabaseKey = 'REMOVED_SUPABASE_CRM_ANON_KEY';
    
    // 1. Verificar tokens existentes
    console.log('🔍 Passo 1: Verificando tokens existentes...');
    const tokensResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (tokensResponse.ok) {
      const tokens = await tokensResponse.json();
      console.log('📊 Tokens encontrados:', tokens.length);
      
      if (tokens.length > 0) {
        // Agrupar por user_id para encontrar duplicatas
        const tokensByUser = {};
        tokens.forEach(token => {
          if (!tokensByUser[token.user_id]) {
            tokensByUser[token.user_id] = [];
          }
          tokensByUser[token.user_id].push(token);
        });
        
        console.log('📋 Tokens por usuário:');
        Object.keys(tokensByUser).forEach(userId => {
          const userTokens = tokensByUser[userId];
          console.log(`  ${userId}: ${userTokens.length} tokens`);
          
          if (userTokens.length > 1) {
            console.log(`    ⚠️ Duplicatas encontradas para ${userId}`);
            
            // Manter apenas o mais recente
            const sortedTokens = userTokens.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            const keepToken = sortedTokens[0];
            const deleteTokens = sortedTokens.slice(1);
            
            console.log(`    ✅ Manter: ${keepToken.id} (${keepToken.created_at})`);
            
            // Deletar tokens duplicados
            for (const tokenToDelete of deleteTokens) {
              console.log(`    🗑️ Deletando: ${tokenToDelete.id} (${tokenToDelete.created_at})`);
              
              const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?id=eq.${tokenToDelete.id}`, {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (deleteResponse.ok) {
                console.log(`      ✅ Token ${tokenToDelete.id} deletado`);
              } else {
                console.log(`      ❌ Erro ao deletar token ${tokenToDelete.id}:`, deleteResponse.status);
              }
            }
          }
        });
        
        // 2. Verificar resultado final
        console.log('\n🔍 Passo 2: Verificando resultado final...');
        const finalTokensResponse = await fetch(`${supabaseUrl}/rest/v1/google_calendar_tokens?select=*&order=created_at.desc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (finalTokensResponse.ok) {
          const finalTokens = await finalTokensResponse.json();
          console.log('📊 Tokens finais:', finalTokens.length);
          
          // Verificar se ainda há duplicatas
          const finalTokensByUser = {};
          finalTokens.forEach(token => {
            if (!finalTokensByUser[token.user_id]) {
              finalTokensByUser[token.user_id] = [];
            }
            finalTokensByUser[token.user_id].push(token);
          });
          
          const duplicates = Object.keys(finalTokensByUser).filter(userId => 
            finalTokensByUser[userId].length > 1
          );
          
          if (duplicates.length === 0) {
            console.log('✅ Nenhuma duplicata encontrada - problema resolvido!');
          } else {
            console.log('⚠️ Ainda há duplicatas:', duplicates);
          }
        }
        
      } else {
        console.log('ℹ️ Nenhum token encontrado');
      }
      
    } else {
      console.log('❌ Erro ao buscar tokens:', tokensResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

fixDuplicateTokens();





