export interface ServiceUrls {
  catalog?: string;
  dispatch?: string;
  notifications?: string;
  auth?: string;
  payments?: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  services: ServiceUrls;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  services: {
    catalog: process.env.CATALOG_SERVICE_URL,
    dispatch: process.env.DISPATCH_SERVICE_URL,
    notifications: process.env.NOTIFICATIONS_SERVICE_URL,
    auth: process.env.AUTH_SERVICE_URL,
    payments: process.env.PAYMENTS_SERVICE_URL,
  },
});

