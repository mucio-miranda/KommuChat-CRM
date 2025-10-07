#!/usr/bin/env node

/**
 * Script para verificar se o projeto está pronto para deploy no Netlify
 * Execute com: node check-deploy-readiness.js
 */

import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const checks = [];

function checkFile(filePath, description, required = true) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : (required ? '❌' : '⚠️');
  const color = exists ? colors.green : (required ? colors.red : colors.yellow);
  
  checks.push({
    file: filePath,
    description,
    status: status,
    exists,
    required
  });
  
  console.log(`${color}${status}${colors.reset} ${description}`);
  if (exists && required) {
    console.log(`${colors.green}   ✓ Arquivo encontrado: ${filePath}${colors.reset}`);
  } else if (!exists && required) {
    console.log(`${colors.red}   ✗ Arquivo obrigatório não encontrado: ${filePath}${colors.reset}`);
  } else if (!exists && !required) {
    console.log(`${colors.yellow}   ⚠ Arquivo opcional não encontrado: ${filePath}${colors.reset}`);
  }
}

function checkPackageJson() {
  console.log(`\n${colors.bold}${colors.blue}📦 Verificando package.json...${colors.reset}`);
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Verificar scripts necessários
    const requiredScripts = ['build', 'dev'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`${colors.green}  ✓ Script '${script}' encontrado${colors.reset}`);
      } else {
        console.log(`${colors.red}  ✗ Script '${script}' não encontrado${colors.reset}`);
      }
    });
    
    // Verificar dependências importantes
    const importantDeps = ['react', 'react-dom', '@supabase/supabase-js', 'vite'];
    importantDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`${colors.green}  ✓ Dependência '${dep}' encontrada${colors.reset}`);
      } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        console.log(`${colors.green}  ✓ Dependência '${dep}' encontrada (dev)${colors.reset}`);
      } else {
        console.log(`${colors.red}  ✗ Dependência '${dep}' não encontrada${colors.reset}`);
      }
    });
  }
}

function checkEnvironmentVariables() {
  console.log(`\n${colors.bold}${colors.blue}🔧 Verificando configurações de ambiente...${colors.reset}`);
  
  const envExample = 'env.example';
  const netlifyEnvExample = 'netlify-env-example.txt';
  
  if (fs.existsSync(envExample)) {
    console.log(`${colors.green}✓ Arquivo de exemplo de variáveis encontrado${colors.reset}`);
    
    const envContent = fs.readFileSync(envExample, 'utf8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_CRM_SUPABASE_URL',
      'VITE_CRM_SUPABASE_ANON_KEY',
      'VITE_GOOGLE_CLIENT_ID',
      'VITE_ENCRYPTION_KEY'
    ];
    
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        console.log(`${colors.green}  ✓ Variável '${varName}' documentada${colors.reset}`);
      } else {
        console.log(`${colors.red}  ✗ Variável '${varName}' não documentada${colors.reset}`);
      }
    });
  } else {
    console.log(`${colors.red}✗ Arquivo de exemplo de variáveis não encontrado${colors.reset}`);
  }
  
  if (fs.existsSync(netlifyEnvExample)) {
    console.log(`${colors.green}✓ Arquivo de exemplo para Netlify encontrado${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Arquivo de exemplo para Netlify não encontrado${colors.reset}`);
  }
}

function checkBuildConfiguration() {
  console.log(`\n${colors.bold}${colors.blue}⚙️ Verificando configurações de build...${colors.reset}`);
  
  if (fs.existsSync('vite.config.ts')) {
    console.log(`${colors.green}✓ Vite config encontrado${colors.reset}`);
    
    const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    
    if (viteConfig.includes('build:')) {
      console.log(`${colors.green}  ✓ Configurações de build encontradas${colors.reset}`);
    } else {
      console.log(`${colors.yellow}  ⚠ Configurações de build não encontradas${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ Vite config não encontrado${colors.reset}`);
  }
}

function checkNetlifyConfiguration() {
  console.log(`\n${colors.bold}${colors.blue}🌐 Verificando configurações do Netlify...${colors.reset}`);
  
  checkFile('netlify.toml', 'Arquivo de configuração do Netlify', true);
  checkFile('NETLIFY_DEPLOY_GUIDE.md', 'Guia de deploy', false);
}

function checkProjectStructure() {
  console.log(`\n${colors.bold}${colors.blue}📁 Verificando estrutura do projeto...${colors.reset}`);
  
  const importantFiles = [
    'index.html',
    'src/main.tsx',
    'src/App.tsx',
    'tailwind.config.ts',
    'tsconfig.json'
  ];
  
  importantFiles.forEach(file => {
    checkFile(file, `Arquivo ${file}`, true);
  });
}

function generateReport() {
  console.log(`\n${colors.bold}${colors.blue}📊 RELATÓRIO FINAL${colors.reset}`);
  console.log('='.repeat(50));
  
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.exists && c.required).length;
  const requiredChecks = checks.filter(c => c.required).length;
  
  console.log(`Total de verificações: ${totalChecks}`);
  console.log(`Verificações obrigatórias: ${requiredChecks}`);
  console.log(`Verificações aprovadas: ${passedChecks}`);
  
  if (passedChecks === requiredChecks) {
    console.log(`\n${colors.green}${colors.bold}🎉 PROJETO PRONTO PARA DEPLOY!${colors.reset}`);
    console.log(`${colors.green}✓ Todas as verificações obrigatórias foram aprovadas${colors.reset}`);
    console.log(`\n${colors.blue}Próximos passos:${colors.reset}`);
    console.log('1. Configure as variáveis de ambiente no Netlify');
    console.log('2. Conecte seu repositório GitHub ao Netlify');
    console.log('3. Faça o deploy inicial');
    console.log('4. Teste todas as funcionalidades');
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ PROJETO NÃO ESTÁ PRONTO${colors.reset}`);
    console.log(`${colors.red}✗ ${requiredChecks - passedChecks} verificações obrigatórias falharam${colors.reset}`);
    
    const failedChecks = checks.filter(c => !c.exists && c.required);
    if (failedChecks.length > 0) {
      console.log(`\n${colors.red}Arquivos obrigatórios ausentes:${colors.reset}`);
      failedChecks.forEach(check => {
        console.log(`${colors.red}  - ${check.file}${colors.reset}`);
      });
    }
  }
}

// Executar verificações
console.log(`${colors.bold}${colors.blue}🚀 VERIFICAÇÃO DE PRONTIDÃO PARA DEPLOY - NETLIFY${colors.reset}`);
console.log('='.repeat(60));

checkProjectStructure();
checkPackageJson();
checkEnvironmentVariables();
checkBuildConfiguration();
checkNetlifyConfiguration();
generateReport();

console.log(`\n${colors.blue}Para mais informações, consulte: NETLIFY_DEPLOY_GUIDE.md${colors.reset}`);
