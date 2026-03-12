// PM2 ecosystem config for production deployment
module.exports = {
  apps: [{
    name: 'abm',
    script: 'server/index.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      AWS_REGION: 'us-east-1',
      BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-20250514-v1:0'
    },
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
