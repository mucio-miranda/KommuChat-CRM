export const config = {
  port: process.env.PORT || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  whatsapp: {
    sessionName: 'CRM_KOMMUCHAT',
    browserName: 'CRM KOMMUCHAT',
    browserVersion: '1.0.0'
  },
  logLevel: 'silent'
};

