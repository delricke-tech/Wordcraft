/**
 * Service de logging et monitoring
 * Phase 3.5 - Production & fiabilité
 * 
 * Date: 10 mars 2025
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export enum LogCategory {
  GENERAL = 'general',
  API = 'api',
  AUTH = 'auth',
  DATABASE = 'database',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USER_ACTION = 'user_action',
  SYSTEM = 'system'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface ErrorReport {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = import.meta.env.DEV;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Capturer les erreurs non capturées
    window.addEventListener('error', (event) => {
      this.error('Global Error', event.error, {
        category: LogCategory.SYSTEM,
        url: window.location.href,
        stack: event.error?.stack
      });
    });

    // Capturer les promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', event.reason, {
        category: LogCategory.SYSTEM,
        url: window.location.href
      });
    });
  }

  private formatMessage(level: LogLevel, category: LogCategory, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      requestId: this.getRequestId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  private getCurrentUserId(): string | undefined {
    // Récupérer l'ID utilisateur depuis le contexte d'auth
    try {
      const authData = localStorage.getItem('auth_data');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération de l\'ID utilisateur:', error);
    }
    return undefined;
  }

  private getCurrentSessionId(): string {
    // Récupérer ou générer un ID de session
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private getRequestId(): string {
    // Récupérer ou générer un ID de requête
    return Math.random().toString(36).substring(2, 15);
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    const logEntry = this.formatMessage(level, category, message, data);
    
    // Ajouter au buffer
    this.logs.push(logEntry);
    
    // Limiter la taille du buffer
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Afficher en console en développement
    if (this.isDevelopment) {
      const logMethod = level >= LogLevel.ERROR ? 'error' : 
                       level >= LogLevel.WARN ? 'warn' : 
                       level >= LogLevel.INFO ? 'info' : 'debug';
      
      console[logMethod](`[${category.toUpperCase()}] ${message}`, data);
    }

    // Envoyer au service de logging externe
    this.sendToExternalService(logEntry);
  }

  private async sendToExternalService(logEntry: LogEntry): Promise<void> {
    // En production, envoyer les logs critiques à un service externe
    if (!this.isDevelopment && logEntry.level >= LogLevel.ERROR) {
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry)
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi des logs:', error);
      }
    }
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, LogCategory.GENERAL, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, LogCategory.GENERAL, message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, LogCategory.GENERAL, message, data);
  }

  public error(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    this.log(LogLevel.ERROR, LogCategory.GENERAL, message, errorData);
  }

  public fatal(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    this.log(LogLevel.FATAL, LogCategory.GENERAL, message, errorData);
  }

  // Méthodes spécialisées par catégorie
  public api(message: string, data?: any): void {
    this.log(LogLevel.INFO, LogCategory.API, message, data);
  }

  public apiError(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    this.log(LogLevel.ERROR, LogCategory.API, message, errorData);
  }

  public auth(message: string, data?: any): void {
    this.log(LogLevel.INFO, LogCategory.AUTH, message, data);
  }

  public authError(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    this.log(LogLevel.ERROR, LogCategory.AUTH, message, errorData);
  }

  public performance(message: string, data?: any): void {
    this.log(LogLevel.INFO, LogCategory.PERFORMANCE, message, data);
  }

  public performanceError(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    this.log(LogLevel.ERROR, LogCategory.PERFORMANCE, message, errorData);
  }

  public security(message: string, data?: any): void {
    this.log(LogLevel.WARN, LogCategory.SECURITY, message, data);
  }

  public securityError(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    this.log(LogLevel.ERROR, LogCategory.SECURITY, message, errorData);
  }

  public userAction(message: string, data?: any): void {
    this.log(LogLevel.INFO, LogCategory.USER_ACTION, message, data);
  }

  public database(message: string, data?: any): void {
    this.log(LogLevel.INFO, LogCategory.DATABASE, message, data);
  }

  public databaseError(message: string, error?: Error | any, data?: any): void {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    
    this.log(LogLevel.ERROR, LogCategory.DATABASE, message, errorData);
  }

  // Méthodes utilitaires
  public getLogs(level?: LogLevel, category?: LogCategory, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }
    
    if (category !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    if (limit !== undefined) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public async reportError(error: Error, context?: Record<string, any>): Promise<void> {
    const errorReport: ErrorReport = {
      error,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      });
    } catch (reportError) {
      console.error('Erreur lors de l\'envoi du rapport d\'erreur:', reportError);
    }
  }
}

// Instance globale du logger
export const logger = Logger.getInstance();

// Hook React pour le logging
export const useLogger = () => {
  return {
    debug: (message: string, data?: any) => logger.debug(message, data),
    info: (message: string, data?: any) => logger.info(message, data),
    warn: (message: string, data?: any) => logger.warn(message, data),
    error: (message: string, error?: Error | any, data?: any) => logger.error(message, error, data),
    fatal: (message: string, error?: Error | any, data?: any) => logger.fatal(message, error, data),
    api: (message: string, data?: any) => logger.api(message, data),
    apiError: (message: string, error?: Error | any, data?: any) => logger.apiError(message, error, data),
    auth: (message: string, data?: any) => logger.auth(message, data),
    authError: (message: string, error?: Error | any, data?: any) => logger.authError(message, error, data),
    performance: (message: string, data?: any) => logger.performance(message, data),
    performanceError: (message: string, error?: Error | any, data?: any) => logger.performanceError(message, error, data),
    security: (message: string, data?: any) => logger.security(message, data),
    securityError: (message: string, error?: Error | any, data?: any) => logger.securityError(message, error, data),
    userAction: (message: string, data?: any) => logger.userAction(message, data),
    database: (message: string, data?: any) => logger.database(message, data),
    databaseError: (message: string, error?: Error | any, data?: any) => logger.databaseError(message, error, data),
    reportError: (error: Error, context?: Record<string, any>) => logger.reportError(error, context)
  };
};

export default logger;
