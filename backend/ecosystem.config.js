// PM2 Ecosystem Configuration for Production Node.js Server
module.exports = {
  apps: [
    {
      name: 'mini-erp-backend',
      script: './dist/index.js',
      instances: 'max', // Cluster mode utilizing all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      combine_logs: true,
      restart_delay: 4000,
    },
  ],
};
