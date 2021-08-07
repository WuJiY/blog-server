module.exports = {
  apps: [
    {
      name: 'blog-api',
      script: './dist/app.js',
      stop_exit_codes: [1],
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'prod',
        PORT: 3000
      },
      wait_ready: true,
      time: true
    },
    {
      name: 'blog-api-dev',
      script: './dist/app.js',
      stop_exit_codes: [1],
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'dev',
        PORT: 4000
      },
      wait_ready: true,
      time: true
    }
  ]
}
