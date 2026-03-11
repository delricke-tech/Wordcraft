/**
 * Configuration centralisée des variables d'environnement
 * Phase 3.5 - Production & fiabilité
 * 
 * Date: 10 mars 2025
 */

interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey?: string;
  
  // OpenAI
  openaiApiKey: string;
  openaiOrgId?: string;
  openaiModel: string;
  
  // Daily.co
  dailyApiKey: string | undefined;
  dailyBaseUrl: string;
  
  // Email
  emailService: string;
  emailApiKey: string | undefined;
  fromEmail: string;
  appName: string;
  
  // Stockage
  supabaseStorageUrl: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // Paiement
  moovMoneyApiKey: string | undefined;
  moovMoneyCallbackUrl: string;
  
  // Analytics
  gaTrackingId: string | undefined;
  posthogKey: string | undefined;
  posthogHost: string | undefined;
  
  // Sentry
  sentryDsn: string | undefined;
  sentryEnvironment: string;
  
  // Développement
  debug: boolean;
  devPort: number;
  devUrl: string;
  prodUrl: string;
  
  // Sécurité
  jwtSecret: string | undefined;
  encryptionKey: string | undefined;
  
  // Performance
  apiTimeout: number;
  maxRetries: number;
  
  // Feature flags
  enableExperimentalFeatures: boolean;
  maintenanceMode: boolean;
  
  // Réseau
  apiUrl: string;
  wsUrl: string;
  
  // CDN
  cdnUrl: string | undefined;
}

// Validation des variables requises
const getRequiredEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Variable d'environnement requise manquante: ${key}`);
  }
  return value;
};

const getOptionalEnv = (key: string, defaultValue?: string): string | undefined => {
  return import.meta.env[key] || defaultValue;
};

// Configuration principale
export const env: EnvConfig = {
  // Supabase
  supabaseUrl: getRequiredEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: getRequiredEnv('VITE_SUPABASE_ANON_KEY'),
  supabaseServiceKey: getOptionalEnv('SUPABASE_SERVICE_ROLE_KEY'),
  
  // OpenAI
  openaiApiKey: getRequiredEnv('VITE_OPENAI_API_KEY'),
  openaiOrgId: getOptionalEnv('VITE_OPENAI_ORG_ID'),
  openaiModel: getOptionalEnv('VITE_OPENAI_MODEL', 'gpt-4-turbo-preview'),
  
  // Daily.co
  dailyApiKey: getOptionalEnv('VITE_DAILY_API_KEY'),
  dailyBaseUrl: getOptionalEnv('VITE_DAILY_BASE_URL', 'https://api.daily.co/v1'),
  
  // Email
  emailService: getOptionalEnv('VITE_EMAIL_SERVICE', 'brevo'),
  emailApiKey: getOptionalEnv('VITE_EMAIL_API_KEY'),
  fromEmail: getOptionalEnv('VITE_FROM_EMAIL', 'noreply@wordcraft.ai'),
  appName: getOptionalEnv('VITE_APP_NAME', 'WordCraft IA'),
  
  // Stockage
  supabaseStorageUrl: getRequiredEnv('VITE_SUPABASE_STORAGE_URL'),
  maxFileSize: parseInt(getOptionalEnv('VITE_MAX_FILE_SIZE', '52428800')),
  allowedFileTypes: getOptionalEnv('VITE_ALLOWED_FILE_TYPES', 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif').split(','),
  
  // Paiement
  moovMoneyApiKey: getOptionalEnv('VITE_MOOV_MONEY_API_KEY'),
  moovMoneyCallbackUrl: getRequiredEnv('VITE_MOOV_MONEY_CALLBACK_URL'),
  
  // Analytics
  gaTrackingId: getOptionalEnv('VITE_GA_TRACKING_ID'),
  posthogKey: getOptionalEnv('VITE_POSTHOG_KEY'),
  posthogHost: getOptionalEnv('VITE_POSTHOG_HOST'),
  
  // Sentry
  sentryDsn: getOptionalEnv('VITE_SENTRY_DSN'),
  sentryEnvironment: getOptionalEnv('VITE_SENTRY_ENVIRONMENT', 'development'),
  
  // Développement
  debug: getOptionalEnv('VITE_DEBUG', 'false') === 'true',
  devPort: parseInt(getOptionalEnv('VITE_DEV_PORT', '3000')),
  devUrl: getOptionalEnv('VITE_DEV_URL', 'http://localhost:3000'),
  prodUrl: getRequiredEnv('VITE_PROD_URL'),
  
  // Sécurité
  jwtSecret: getOptionalEnv('VITE_JWT_SECRET'),
  encryptionKey: getOptionalEnv('VITE_ENCRYPTION_KEY'),
  
  // Performance
  apiTimeout: parseInt(getOptionalEnv('VITE_API_TIMEOUT', '30000')),
  maxRetries: parseInt(getOptionalEnv('VITE_MAX_RETRIES', '3')),
  
  // Feature flags
  enableExperimentalFeatures: getOptionalEnv('VITE_ENABLE_EXPERIMENTAL_FEATURES', 'false') === 'true',
  maintenanceMode: getOptionalEnv('VITE_MAINTENANCE_MODE', 'false') === 'true',
  
  // Réseau
  apiUrl: getOptionalEnv('VITE_API_URL', 'https://api.wordcraft.ai'),
  wsUrl: getOptionalEnv('VITE_WS_URL', 'wss://api.wordcraft.ai/ws'),
  
  // CDN
  cdnUrl: getOptionalEnv('VITE_CDN_URL'),
};

// Configuration par environnement
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isTest = import.meta.env.TEST;

// URLs de l'application
export const appUrl = isDevelopment ? env.devUrl : env.prodUrl;
export const apiBaseUrl = isDevelopment ? env.devUrl : env.apiUrl;

// Validation au démarrage
if (isDevelopment) {
  console.log('🔧 Mode développement activé');
  console.log('🌐 URL de l\'app:', appUrl);
  console.log('📡 URL API:', apiBaseUrl);
  
  // Vérifier les variables critiques en développement
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_OPENAI_API_KEY',
    'VITE_SUPABASE_STORAGE_URL',
    'VITE_PROD_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missingVars);
    console.log('📝 Copiez .env.example en .env.local et configurez les variables requises');
  }
}

// Export des utilitaires
export const getApiUrl = (path: string = ''): string => {
  return `${apiBaseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

export const getStorageUrl = (path: string = ''): string => {
  return `${env.supabaseStorageUrl}${path.startsWith('/') ? path : '/' + path}`;
};

export const isFeatureEnabled = (): boolean => {
  return env.enableExperimentalFeatures;
};

export const isMaintenanceMode = (): boolean => {
  return env.maintenanceMode;
};

// Configuration pour les services tiers
export const thirdPartyConfig = {
  openai: {
    apiKey: env.openaiApiKey,
    orgId: env.openaiOrgId,
    model: env.openaiModel,
    maxTokens: 4000,
    temperature: 0.7,
  },
  supabase: {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    serviceKey: env.supabaseServiceKey,
  },
  daily: {
    apiKey: env.dailyApiKey,
    baseUrl: env.dailyBaseUrl,
  },
  analytics: {
    googleAnalytics: env.gaTrackingId,
    posthog: env.posthogKey ? {
      apiKey: env.posthogKey,
      host: env.posthogHost,
    } : undefined,
  },
  sentry: env.sentryDsn ? {
    dsn: env.sentryDsn,
    environment: env.sentryEnvironment,
  } : undefined,
};

export default env;
