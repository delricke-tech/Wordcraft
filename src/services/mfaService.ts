/**
 * Service d'authentification forte (2FA/MFA)
 * 
 * Ce service gère l'authentification multi-facteurs, TOTP, backup codes,
 * clés de sécurité et la protection des comptes utilisateurs
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface MFASetup {
  id: string;
  userId: string;
  type: MFAType;
  secret: string;
  qrCode: string;
  backupCodes: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  verifiedAt?: string;
  lastUsedAt?: string;
  metadata: MFAMetadata;
}

export type MFAType = 
  | 'totp'
  | 'sms'
  | 'email'
  | 'backup_codes'
  | 'hardware_key'
  | 'biometric';

export interface MFAMetadata {
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  trustedDevices: TrustedDevice[];
  riskScore: number;
  securityLevel: SecurityLevel;
  preferences: MFAPreferences;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  browser: string;
  version: string;
  language: string;
  timezone: string;
  screenResolution: string;
  isMobile: boolean;
  isTablet: boolean;
}

export interface TrustedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  trustedAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MFAPreferences {
  rememberDevice: boolean;
  deviceExpiryDays: number;
  requireMFAOnNewDevice: boolean;
  requireMFAOnSensitiveActions: boolean;
  gracePeriodDays: number;
  notificationMethods: NotificationMethod[];
  backupCodeRegeneration: boolean;
}

export type NotificationMethod = 'sms' | 'email' | 'push';

export interface MFASession {
  id: string;
  userId: string;
  deviceId: string;
  challenge: string;
  type: MFAType;
  expiresAt: string;
  attempts: number;
  maxAttempts: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  metadata: Record<string, any>;
}

export interface MFALog {
  id: string;
  userId: string;
  type: MFALogType;
  mfaType: MFAType;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  errorMessage?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export type MFALogType = 
  | 'setup'
  | 'verification'
  | 'disable'
  | 'backup_used'
  | 'backup_generated'
  | 'device_trusted'
  | 'suspicious_activity'
  | 'rate_limit'
  | 'error';

export interface MFAStats {
  totalUsers: number;
  enabledUsers: number;
  mfaEnabledRate: number;
  methodsByType: Record<MFAType, number>;
  verificationAttempts: number;
  successRate: number;
  averageVerificationTime: number;
  suspiciousActivities: number;
  trustedDevices: number;
  backupCodesUsed: number;
  securityIncidents: number;
  trends: {
    enablementTrend: number[];
    verificationTrend: number[];
    securityTrend: number[];
  };
}

export interface TOTPConfig {
  algorithm: string;
  digits: number;
  period: number;
  secret: string;
  issuer: string;
  label: string;
}

export interface BackupCodesConfig {
  count: number;
  length: number;
  characters: string;
  expiresAfterUse: boolean;
  regenerationInterval: number; // en jours
}

export interface SecurityKeyConfig {
  requireUserVerification: boolean;
  timeout: number;
  allowedAlgorithms: string[];
  requireResidentKey: boolean;
  userVerification: 'required' | 'preferred' | 'discouraged';
}

class MFAService {
  private totpSecrets: Map<string, string> = new Map();
  private activeSessions: Map<string, MFASession> = new Map();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service MFA
   */
  private initializeService(): void {
    // Nettoyer les sessions expirées
    this.cleanupExpiredSessions();
    
    // Démarrer le monitoring
    this.startMonitoring();
    
    console.log('🔐 Service MFA initialisé');
  }

  /**
   * Génère un secret TOTP
   */
  generateTOTPSecret(userId: string): TOTPConfig {
    const secret = this.generateSecret();
    const config: TOTPConfig = {
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
      issuer: 'WordCraft',
      label: `WordCraft (${userId})`
    };

    // Stocker temporairement le secret
    this.totpSecrets.set(userId, secret);

    console.log('🔐 Secret TOTP généré pour:', userId);
    return config;
  }

  /**
   * Génère un code QR pour TOTP
   */
  generateQRCode(config: TOTPConfig): string {
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(config.label)}?secret=${config.secret}&issuer=${encodeURIComponent(config.issuer)}&algorithm=${config.algorithm}&digits=${config.digits}&period=${config.period}`;
    
    // Simuler la génération de QR code (dans un vrai projet, utiliser une librairie comme qrcode)
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }

  /**
   * Vérifie un code TOTP
   */
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    try {
      const secret = this.totpSecrets.get(userId);
      if (!secret) {
        throw new Error('Secret TOTP non trouvé');
      }

      // Simuler la vérification TOTP (dans un vrai projet, utiliser une librairie comme otplib)
      const expectedToken = this.generateTOTPCode(secret);
      const isValid = token === expectedToken;

      // Journaliser la tentative
      await this.logMFATentative(userId, 'totp', isValid);

      if (isValid) {
        console.log('🔐 Code TOTP vérifié avec succès');
      } else {
        console.warn('🔐 Code TOTP invalide');
      }

      return isValid;

    } catch (error) {
      console.error('❌ Erreur vérification TOTP:', error);
      throw error;
    }
  }

  /**
   * Génère des codes de sauvegarde
   */
  generateBackupCodes(userId: string, config: BackupCodesConfig): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < config.count; i++) {
      let code = '';
      for (let j = 0; j < config.length; j++) {
        const randomIndex = Math.floor(Math.random() * config.characters.length);
        code += config.characters[randomIndex];
      }
      codes.push(code);
    }

    // Journaliser la génération
    this.logMFATentative(userId, 'backup_codes', true);

    console.log('🔐 Codes de sauvegarde générés:', codes.length);
    return codes;
  }

  /**
   * Vérifie un code de sauvegarde
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // Récupérer les codes de sauvegarde depuis la base de données
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('backup_codes')
        .eq('id', userId)
        .single();

      if (error || !userData) {
        throw new Error('Codes de sauvegarde non trouvés');
      }

      const backupCodes = userData.backup_codes as string[];
      const isValid = backupCodes.includes(code);

      if (isValid) {
        // Supprimer le code utilisé
        const updatedCodes = backupCodes.filter(c => c !== code);
        await supabase
          .from('profiles')
          .update({ backup_codes: updatedCodes })
          .eq('id', userId);

        // Journaliser l'utilisation
        await this.logMFATentative(userId, 'backup_used', true);

        console.log('🔐 Code de sauvegarde utilisé avec succès');
      } else {
        console.warn('🔐 Code de sauvegarde invalide');
      }

      return isValid;

    } catch (error) {
      console.error('❌ Erreur vérification code de sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Crée une session MFA
   */
  async createMFASession(userId: string, type: MFAType, deviceId: string): Promise<MFASession> {
    try {
      const sessionId = this.generateId();
      const challenge = this.generateChallenge();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      const session: MFASession = {
        id: sessionId,
        userId,
        deviceId,
        challenge,
        type,
        expiresAt,
        attempts: 0,
        maxAttempts: 3,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        metadata: {}
      };

      this.activeSessions.set(sessionId, session);

      // Journaliser la création de session
      await this.logMFATentative(userId, 'verification', false, { sessionId, type });

      console.log('🔐 Session MFA créée:', sessionId);
      return session;

    } catch (error) {
      console.error('❌ Erreur création session MFA:', error);
      throw error;
    }
  }

  /**
   * Vérifie une session MFA
   */
  async verifyMFASession(sessionId: string, token: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session MFA non trouvée');
      }

      // Vérifier si la session n'est pas expirée
      if (new Date() > new Date(session.expiresAt)) {
        this.activeSessions.delete(sessionId);
        throw new Error('Session MFA expirée');
      }

      // Vérifier le nombre de tentatives
      if (session.attempts >= session.maxAttempts) {
        this.activeSessions.delete(sessionId);
        await this.logMFATentative(session.userId, 'rate_limit', false, { sessionId });
        throw new Error('Trop de tentatives');
      }

      session.attempts++;

      let isValid = false;

      // Vérifier selon le type
      switch (session.type) {
        case 'totp':
          isValid = await this.verifyTOTP(session.userId, token);
          break;
        case 'backup_codes':
          isValid = await this.verifyBackupCode(session.userId, token);
          break;
        default:
          throw new Error('Type MFA non supporté');
      }

      if (isValid) {
        session.isCompleted = true;
        session.completedAt = new Date().toISOString();
        this.activeSessions.delete(sessionId);

        // Journaliser le succès
        await this.logMFATentative(session.userId, 'verification', true, { sessionId, type: session.type });

        console.log('🔐 Session MFA vérifiée avec succès');
      } else {
        // Journaliser l'échec
        await this.logMFATentative(session.userId, 'verification', false, { 
          sessionId, 
          type: session.type, 
          attempt: session.attempts 
        });
      }

      return isValid;

    } catch (error) {
      console.error('❌ Erreur vérification session MFA:', error);
      throw error;
    }
  }

  /**
   * Configure un appareil comme fiable
   */
  async trustDevice(userId: string, deviceId: string, deviceName: string): Promise<TrustedDevice> {
    try {
      const trustedDevice: TrustedDevice = {
        id: this.generateId(),
        deviceId,
        deviceName,
        trustedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        isActive: true,
        metadata: {}
      };

      // Sauvegarder dans la base de données
      const { data, error } = await supabase
        .from('trusted_devices')
        .insert({
          id: trustedDevice.id,
          user_id: userId,
          device_id: deviceId,
          device_name: deviceName,
          trusted_at: trustedDevice.trustedAt,
          last_used_at: trustedDevice.lastUsedAt,
          expires_at: trustedDevice.expiresAt,
          is_active: trustedDevice.isActive,
          metadata: trustedDevice.metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Journaliser
      await this.logMFATentative(userId, 'device_trusted', true, { deviceId, deviceName });

      console.log('🔐 Appareil configuré comme fiable:', deviceName);
      return trustedDevice;

    } catch (error) {
      console.error('❌ Erreur configuration appareil fiable:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un appareil est fiable
   */
  async isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .single();

      if (error) return false;

      const device = data as TrustedDevice;
      const isExpired = new Date() > new Date(device.expiresAt);

      if (isExpired) {
        // Désactiver l'appareil expiré
        await supabase
          .from('trusted_devices')
          .update({ is_active: false })
          .eq('id', device.id);

        return false;
      }

      // Mettre à jour la dernière utilisation
      await supabase
        .from('trusted_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', device.id);

      return true;

    } catch (error) {
      console.error('❌ Erreur vérification appareil fiable:', error);
      return false;
    }
  }

  /**
   * Obtient les statistiques MFA
   */
  async getStats(): Promise<MFAStats> {
    try {
      const { data, error } = await supabase.rpc('get_mfa_stats');

      if (error) throw error;

      const stats = data || {
        total_users: 0,
        enabled_users: 0,
        mfa_enabled_rate: 0,
        methods_by_type: {},
        verification_attempts: 0,
        success_rate: 0,
        average_verification_time: 0,
        suspicious_activities: 0,
        trusted_devices: 0,
        backup_codes_used: 0,
        security_incidents: 0,
        trends: {
          enablement_trend: Array(7).fill(0),
          verification_trend: Array(7).fill(0),
          security_trend: Array(7).fill(0)
        }
      };

      return {
        totalUsers: stats.total_users,
        enabledUsers: stats.enabled_users,
        mfaEnabledRate: stats.mfa_enabled_rate,
        methodsByType: stats.methods_by_type,
        verificationAttempts: stats.verification_attempts,
        successRate: stats.success_rate,
        averageVerificationTime: stats.average_verification_time,
        suspiciousActivities: stats.suspicious_activities,
        trustedDevices: stats.trusted_devices,
        backupCodesUsed: stats.backup_codes_used,
        securityIncidents: stats.security_incidents,
        trends: {
          enablementTrend: stats.trends.enablement_trend,
          verificationTrend: stats.trends.verification_trend,
          securityTrend: stats.trends.security_trend
        }
      };

    } catch (error) {
      console.error('❌ Erreur statistiques MFA:', error);
      throw error;
    }
  }

  /**
   * Détecte une activité suspecte
   */
  async detectSuspiciousActivity(userId: string, deviceId: string, ipAddress: string): Promise<boolean> {
    try {
      // Vérifier le rate limiting
      const rateLimitKey = `${userId}_${ipAddress}`;
      const currentRate = this.rateLimitMap.get(rateLimitKey);
      
      if (currentRate && currentRate.count > 5 && Date.now() < currentRate.resetTime) {
        await this.logMFATentative(userId, 'suspicious_activity', false, { 
          reason: 'rate_limit',
          ipAddress,
          deviceId
        });
        return true;
      }

      // Mettre à jour le rate limiting
      if (!currentRate || Date.now() > currentRate.resetTime) {
        this.rateLimitMap.set(rateLimitKey, {
          count: 1,
          resetTime: Date.now() + 15 * 60 * 1000 // 15 minutes
        });
      } else {
        currentRate.count++;
      }

      // Vérifier les tentatives récentes
      const { data: recentAttempts, error } = await supabase
        .from('mfa_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('success', false)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) return false;

      if (recentAttempts && recentAttempts.length > 3) {
        await this.logMFATentative(userId, 'suspicious_activity', false, { 
          reason: 'multiple_failures',
          attempts: recentAttempts.length,
          ipAddress,
          deviceId
        });
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Erreur détection activité suspecte:', error);
      return false;
    }
  }

  /**
   * Génère un secret aléatoire
   */
  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Génère un challenge aléatoire
   */
  private generateChallenge(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Génère un code TOTP (simulation)
   */
  private generateTOTPCode(secret: string): string {
    // Simuler la génération de code TOTP
    // Dans un vrai projet, utiliser une librairie comme otplib
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    const hash = this.hashTOTP(secret + timeStep);
    const code = (hash % 1000000).toString().padStart(6, '0');
    return code;
  }

  /**
   * Hash pour TOTP (simulation)
   */
  private hashTOTP(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Journalise une tentative MFA
   */
  private async logMFATentative(
    userId: string, 
    type: MFALogType, 
    success: boolean, 
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const log: MFALog = {
        id: this.generateId(),
        userId,
        type,
        mfaType: this.inferMFAType(type),
        success,
        ipAddress: metadata.ipAddress || 'unknown',
        userAgent: metadata.userAgent || 'unknown',
        deviceId: metadata.deviceId,
        errorMessage: metadata.errorMessage,
        timestamp: new Date().toISOString(),
        metadata
      };

      await supabase
        .from('mfa_logs')
        .insert({
          id: log.id,
          user_id: userId,
          type: log.type,
          mfa_type: log.mfaType,
          success: log.success,
          ip_address: log.ipAddress,
          user_agent: log.userAgent,
          device_id: log.deviceId,
          error_message: log.errorMessage,
          timestamp: log.timestamp,
          metadata: log.metadata
        });

    } catch (error) {
      console.error('❌ Erreur journalisation MFA:', error);
    }
  }

  /**
   * Infère le type MFA depuis le type de log
   */
  private inferMFAType(logType: MFALogType): MFAType {
    switch (logType) {
      case 'setup':
        return 'totp';
      case 'verification':
        return 'totp';
      case 'backup_used':
        return 'backup_codes';
      case 'backup_generated':
        return 'backup_codes';
      default:
        return 'totp';
    }
  }

  /**
   * Nettoie les sessions expirées
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Démarre le monitoring
   */
  private startMonitoring(): void {
    // Nettoyer les sessions expirées toutes les minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000);

    // Nettoyer le rate limiting expiré
    setInterval(() => {
      const now = Date.now();
      for (const [key, rate] of this.rateLimitMap.entries()) {
        if (rate.resetTime < now) {
          this.rateLimitMap.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Ajoute un callback d'événement
   */
  on(event: string, callback: (event: any) => void): void {
    this.eventCallbacks.set(event, callback);
  }

  /**
   * Émet un événement
   */
  private emit(event: string, data: any): void {
    const callback = this.eventCallbacks.get(event);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erreur callback événement MFA:', error);
      }
    }
  }

  /**
   * Détruit le service MFA
   */
  destroy(): void {
    this.activeSessions.clear();
    this.totpSecrets.clear();
    this.rateLimitMap.clear();
    this.eventCallbacks.clear();
    
    console.log('🔐 Service MFA détruit');
  }
}

// Instance singleton
export const mfaService = new MFAService();

// Export des fonctions utilitaires
export const generateTOTPSecret = (userId: string) => mfaService.generateTOTPSecret(userId);
export const generateQRCode = (config: TOTPConfig) => mfaService.generateQRCode(config);
export const verifyTOTP = (userId: string, token: string) => mfaService.verifyTOTP(userId, token);
export const generateBackupCodes = (userId: string, config: BackupCodesConfig) => 
  mfaService.generateBackupCodes(userId, config);

export const verifyBackupCode = (userId: string, code: string) => mfaService.verifyBackupCode(userId, code);
export const createMFASession = (userId: string, type: MFAType, deviceId: string) => 
  mfaService.createMFASession(userId, type, deviceId);

export const verifyMFASession = (sessionId: string, token: string) => mfaService.verifyMFASession(sessionId, token);
export const trustDevice = (userId: string, deviceId: string, deviceName: string) => 
  mfaService.trustDevice(userId, deviceId, deviceName);

export const isDeviceTrusted = (userId: string, deviceId: string) => mfaService.isDeviceTrusted(userId, deviceId);
export const getMFAStats = () => mfaService.getStats();
export const detectSuspiciousActivity = (userId: string, deviceId: string, ipAddress: string) => 
  mfaService.detectSuspiciousActivity(userId, deviceId, ipAddress);
