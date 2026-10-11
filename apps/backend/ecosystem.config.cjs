/** @type {import('pm2').StartOptions[]} */
const apps = [
  {
    name: 'parton-api',
    script: 'dist/main.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
  },
];

module.exports = { apps };
