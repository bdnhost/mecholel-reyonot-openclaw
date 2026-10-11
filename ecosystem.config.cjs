module.exports = { apps: [{
  name: 'mecholel-reyonot', cwd: '/opt/apps/mecholel-reyonot-openclaw',
  script: 'node_modules/.bin/tsx', args: 'server.ts',
  env: { NODE_ENV: 'production', PORT: '3031', HOST: '127.0.0.1',
         OPENCLAW_STATE_FILE: '/opt/apps/mecholel-reyonot-openclaw/data/state.json',
         APP_URL: 'https://ideas.bdnhost.net' },
  max_memory_restart: '400M'
}]};
