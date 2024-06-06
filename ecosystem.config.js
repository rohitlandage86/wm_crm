module.exports = {
  apps: [{
    name: 'server',
    script: './server.js',
    instances: 'max',  // Or a specific number like 4
    exec_mode: 'cluster',
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
