const fs=require('fs');
function envFrom(f,k){try{const m=fs.readFileSync(f,'utf8').match(new RegExp('^'+k+'=(.*)$','m'));return m?m[1].trim().replace(/^"|"$/g,''):'';}catch(e){return '';}}
module.exports = { apps: [{
  name: 'mecholel-reyonot', cwd: '/opt/apps/mecholel-reyonot-openclaw',
  script: 'node_modules/.bin/tsx', args: 'server.ts',
  env: { NODE_ENV: 'production', PORT: '3031', HOST: '127.0.0.1',
         OPENCLAW_STATE_FILE: '/opt/apps/mecholel-reyonot-openclaw/data/state.json',
         APP_URL: 'https://ideas.bdnhost.net',
         DEEPSEEK_API_KEY: envFrom('/root/.config/openclaw.env','DEEPSEEK_API_KEY'),
         DEEPSEEK_MODEL: 'deepseek-flash' },
  max_memory_restart: '400M'
}]};
