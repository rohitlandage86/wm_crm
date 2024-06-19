module.exports = {
  apps: [{
    name: 'server',
    script: './server.js',
    instances: 'max',  // Or a specific number like 4
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '4G',  // Restart if memory usage exceeds 500MB
    env: {
      NODE_ENV: 'production'
    }
  }]
};
