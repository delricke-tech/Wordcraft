/**
 * Service OAuth providers (Google, Facebook, Microsoft)
 * 
 * Ce service gère l'authentification via OAuth2 avec plusieurs providers,
 * la gestion des tokens, le refresh et la synchronisation des profils
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  type: OAuthProviderType;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  redirectUri: string;
  isActive: boolean;
  isDefault: boolean;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  metadata: OAuthProviderMetadata;
}

export type OAuthProviderType = 'google' | 'facebook' | 'microsoft' | 'github' | 'linkedin' | 'apple';

export interface OAuthProviderMetadata {
  version: string;
  documentation?: string;
  supportedFeatures: OAuthFeature[];
  rateLimits?: RateLimit;
  tokenRefreshBuffer: number; // en secondes
  maxTokenAge: number; // en secondes
  requiresApproval: boolean;
  customParameters?: Record<string, string>;
}

export interface OAuthFeature {
  name: string;
  supported: boolean;
  description?: string;
}

export interface RateLimit {
  requestsPerHour: number;
  requestsPerMinute: number;
  burstLimit: number;
}

export interface OAuthToken {
  id: string;
  userId: string;
  providerId: string;
  providerType: OAuthProviderType;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt: string;
  scope: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata: TokenMetadata;
}

export interface TokenMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  sessionDuration?: number;
  securityFlags: SecurityFlag[];
}

export interface SecurityFlag {
  type: 'suspicious_location' | 'new_device' | 'short_session' | 'multiple_attempts';
  detectedAt: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface OAuthUserProfile {
  id: string;
  providerId: string;
  providerType: OAuthProviderType;
  providerUserId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  profileUrl?: string;
  locale?: string;
  timezone?: string;
  verified: boolean;
  metadata: ProfileMetadata;
  syncedAt: string;
  updatedAt: string;
}

export interface ProfileMetadata {
  rawResponse: any;
  additionalFields: Record<string, any>;
  syncErrors: string[];
  lastSyncStatus: 'success' | 'partial' | 'error';
  syncFrequency: number; // en heures
}

export interface OAuthSession {
  id: string;
  state: string;
  providerId: string;
  providerType: OAuthProviderType;
  redirectUri: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  userId?: string;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  originalRequest: any;
  userContext: any;
  securityContext: SecurityContext;
  flowType: 'login' | 'link' | 'refresh';
}

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  timestamp: string;
  riskScore: number;
  factors: SecurityFactor[];
}

export interface SecurityFactor {
  type: 'known_device' | 'known_location' | 'consistent_behavior' | 'suspicious_pattern';
  score: number;
  description: string;
}

export interface OAuthStats {
  totalProviders: number;
  activeProviders: number;
  totalUsers: number;
  usersWithOAuth: number;
  providerDistribution: Record<OAuthProviderType, number>;
  loginTrends: Array<{ date: string; provider: OAuthProviderType; count: number }>;
  activeTokens: number;
  expiredTokens: number;
  securityEvents: Array<{ type: string; count: number; lastEvent: string }>;
  syncErrors: Array<{ provider: OAuthProviderType; errorCount: number; lastError: string }>;
}

class OAuthService {

  /**
   * Crée un nouveau provider OAuth
   */
  async createProvider(provider: Omit<OAuthProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<OAuthProvider> {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .insert({
          name: provider.name,
          display_name: provider.displayName,
          type: provider.type,
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          authorization_url: provider.authorizationUrl,
          token_url: provider.tokenUrl,
          user_info_url: provider.userInfoUrl,
          scopes: provider.scopes,
          redirect_uri: provider.redirectUri,
          is_active: provider.isActive,
          is_default: provider.isDefault,
          icon: provider.icon,
          color: provider.color,
          metadata: provider.metadata
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de créer le provider OAuth');

      console.log('✅ Provider OAuth créé:', data.name);
      return this.mapProviderFromDB(data);

    } catch (error) {
      console.error('❌ Erreur création provider OAuth:', error);
      throw new Error(`Échec de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère tous les providers OAuth actifs
   */
  async getActiveProviders(): Promise<OAuthProvider[]> {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(this.mapProviderFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération providers OAuth:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère l'URL d'autorisation OAuth
   */
  generateAuthorizationUrl(provider: OAuthProvider, options: {
    state?: string;
    scopes?: string[];
    redirectUri?: string;
    extraParams?: Record<string, string>;
  } = {}): string {
    const state = options.state || this.generateState();
    const scopes = options.scopes || provider.scopes;
    const redirectUri = options.redirectUri || provider.redirectUri;

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: state,
      ...provider.metadata.customParameters,
      ...options.extraParams
    });

    // Ajouter des paramètres spécifiques au provider
    switch (provider.type) {
      case 'google':
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
        break;
      case 'microsoft':
        params.set('response_mode', 'query');
        break;
      case 'facebook':
        params.set('display', 'popup');
        break;
    }

    return `${provider.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresIn: number;
    scope: string;
  }> {
    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          code: code,
          redirect_uri: redirectUri
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur d'échange de token: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Erreur OAuth: ${data.error_description || data.error}`);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in,
        scope: data.scope
      };

    } catch (error) {
      console.error('❌ Erreur échange code tokens:', error);
      throw new Error(`Échec de l'échange: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les informations utilisateur depuis le provider
   */
  async getUserInfo(provider: OAuthProvider, accessToken: string): Promise<any> {
    try {
      const response = await fetch(provider.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur récupération infos utilisateur: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Erreur récupération infos utilisateur:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Sauvegarde les tokens OAuth pour un utilisateur
   */
  async saveOAuthToken(
    userId: string,
    providerId: string,
    providerType: OAuthProviderType,
    tokenData: {
      accessToken: string;
      refreshToken?: string;
      tokenType: string;
      expiresIn: number;
      scope: string;
    },
    metadata: Partial<TokenMetadata> = {}
  ): Promise<OAuthToken> {
    try {
      const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000).toISOString();

      const { data, error } = await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: userId,
          provider_id: providerId,
          provider_type: providerType,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          token_type: tokenData.tokenType,
          expires_at: expiresAt,
          scope: tokenData.scope,
          is_active: true,
          metadata: {
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            deviceInfo: metadata.deviceInfo,
            location: metadata.location,
            securityFlags: metadata.securityFlags || []
          }
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de sauvegarder le token OAuth');

      console.log('✅ Token OAuth sauvegardé pour:', providerType);
      return this.mapTokenFromDB(data);

    } catch (error) {
      console.error('❌ Erreur sauvegarde token OAuth:', error);
      throw new Error(`Échec de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Rafraîchit un token OAuth
   */
  async refreshOAuthToken(token: OAuthToken, provider: OAuthProvider): Promise<OAuthToken> {
    try {
      if (!token.refreshToken) {
        throw new Error('Aucun refresh token disponible');
      }

      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          refresh_token: token.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur refresh token: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Erreur OAuth refresh: ${data.error_description || data.error}`);
      }

      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      const { data: updatedToken, error } = await supabase
        .from('oauth_tokens')
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token || token.refreshToken,
          token_type: data.token_type || 'Bearer',
          expires_at: expiresAt,
          scope: data.scope,
          updated_at: new Date().toISOString()
        })
        .eq('id', token.id)
        .select()
        .single();

      if (error) throw error;
      if (!updatedToken) throw new Error('Impossible de mettre à jour le token');

      console.log('✅ Token OAuth rafraîchi pour:', token.providerType);
      return this.mapTokenFromDB(updatedToken);

    } catch (error) {
      console.error('❌ Erreur refresh token OAuth:', error);
      throw new Error(`Échec du rafraîchissement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les tokens OAuth actifs d'un utilisateur
   */
  async getUserTokens(userId: string, includeExpired = false): Promise<OAuthToken[]> {
    try {
      let query = supabase
        .from('oauth_tokens')
        .select(`
          *,
          oauth_providers!inner(
            id,
            name,
            display_name,
            type,
            icon,
            color
          )
        `)
        .eq('user_id', userId);

      if (!includeExpired) {
        query = query.or('expires_at.gt.now(),is_active.eq.true');
      }

      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(this.mapTokenFromDB);

    } catch (error) {
      console.error('❌ Erreur récupération tokens utilisateur:', error);
      throw new Error(`Échec de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Synchronise le profil utilisateur depuis le provider OAuth
   */
  async syncUserProfile(
    userId: string,
    provider: OAuthProvider,
    accessToken: string
  ): Promise<OAuthUserProfile> {
    try {
      const userInfo = await this.getUserInfo(provider, accessToken);
      const mappedProfile = this.mapUserInfoFromProvider(provider.type, userInfo);

      const { data, error } = await supabase
        .from('oauth_user_profiles')
        .upsert({
          user_id: userId,
          provider_id: provider.id,
          provider_type: provider.type,
          provider_user_id: mappedProfile.providerUserId,
          email: mappedProfile.email,
          name: mappedProfile.name,
          first_name: mappedProfile.firstName,
          last_name: mappedProfile.lastName,
          username: mappedProfile.username,
          avatar: mappedProfile.avatar,
          profile_url: mappedProfile.profileUrl,
          locale: mappedProfile.locale,
          timezone: mappedProfile.timezone,
          verified: mappedProfile.verified,
          metadata: {
            rawResponse: userInfo,
            additionalFields: mappedProfile.additionalFields,
            syncErrors: [],
            lastSyncStatus: 'success',
            syncFrequency: 24
          },
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Impossible de synchroniser le profil');

      console.log('✅ Profil utilisateur synchronisé pour:', provider.type);
      return this.mapUserProfileFromDB(data);

    } catch (error) {
      console.error('❌ Erreur synchronisation profil utilisateur:', error);
      throw new Error(`Échec de la synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Révoque un token OAuth
   */
  async revokeOAuthToken(tokenId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('oauth_tokens')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Token OAuth révoqué:', tokenId);

    } catch (error) {
      console.error('❌ Erreur révocation token OAuth:', error);
      throw new Error(`Échec de la révocation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les statistiques OAuth
   */
  async getOAuthStats(): Promise<OAuthStats> {
    try {
      const { data, error } = await supabase.rpc('get_oauth_stats');

      if (error) throw error;

      const stats = data || {
        total_providers: 0,
        active_providers: 0,
        total_users: 0,
        users_with_oauth: 0,
        provider_distribution: {},
        login_trends: [],
        active_tokens: 0,
        expired_tokens: 0,
        security_events: [],
        sync_errors: []
      };

      return {
        totalProviders: stats.total_providers,
        activeProviders: stats.active_providers,
        totalUsers: stats.total_users,
        usersWithOAuth: stats.users_with_oauth,
        providerDistribution: stats.provider_distribution,
        loginTrends: stats.login_trends,
        activeTokens: stats.active_tokens,
        expiredTokens: stats.expired_tokens,
        securityEvents: stats.security_events,
        syncErrors: stats.sync_errors
      };

    } catch (error) {
      console.error('❌ Erreur statistiques OAuth:', error);
      throw new Error(`Échec des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Génère un état OAuth sécurisé
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Mappe les informations utilisateur depuis la réponse du provider
   */
  private mapUserInfoFromProvider(providerType: OAuthProviderType, userInfo: any): any {
    switch (providerType) {
      case 'google':
        return {
          providerUserId: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          avatar: userInfo.picture,
          locale: userInfo.locale,
          verified: userInfo.email_verified,
          profileUrl: `https://plus.google.com/${userInfo.sub}`,
          additionalFields: {
            hd: userInfo.hd, // G Suite domain
            link: userInfo.link
          }
        };

      case 'facebook':
        return {
          providerUserId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          firstName: userInfo.first_name,
          lastName: userInfo.last_name,
          avatar: userInfo.picture?.data?.url,
          locale: userInfo.locale,
          verified: userInfo.verified,
          profileUrl: `https://facebook.com/${userInfo.id}`,
          additionalFields: {
            timezone: userInfo.timezone
          }
        };

      case 'microsoft':
        return {
          providerUserId: userInfo.id,
          email: userInfo.mail || userInfo.userPrincipalName,
          name: userInfo.displayName,
          firstName: userInfo.givenName,
          lastName: userInfo.surname,
          avatar: null, // Microsoft Graph API needed
          locale: userInfo.preferredLanguage,
          verified: true,
          profileUrl: null,
          additionalFields: {
            userPrincipalName: userInfo.userPrincipalName,
            jobTitle: userInfo.jobTitle,
            officeLocation: userInfo.officeLocation
          }
        };

      case 'github':
        return {
          providerUserId: userInfo.id.toString(),
          email: userInfo.email,
          name: userInfo.name,
          username: userInfo.login,
          avatar: userInfo.avatar_url,
          locale: null,
          verified: false,
          profileUrl: userInfo.html_url,
          additionalFields: {
            bio: userInfo.bio,
            location: userInfo.location,
            company: userInfo.company,
            public_repos: userInfo.public_repos
          }
        };

      case 'linkedin':
        return {
          providerUserId: userInfo.id,
          email: null, // LinkedIn requires special permissions
          name: `${userInfo.localizedFirstName} ${userInfo.localizedLastName}`,
          firstName: userInfo.localizedFirstName,
          lastName: userInfo.localizedLastName,
          avatar: userInfo.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
          locale: userInfo.locale?.language,
          verified: true,
          profileUrl: null,
          additionalFields: {
            headline: userInfo.localizedHeadline
          }
        };

      case 'apple':
        return {
          providerUserId: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name ? `${userInfo.name.firstName} ${userInfo.name.lastName}` : null,
          firstName: userInfo.name?.firstName,
          lastName: userInfo.name?.lastName,
          avatar: null,
          locale: null,
          verified: true,
          profileUrl: null,
          additionalFields: {}
        };

      default:
        throw new Error(`Provider non supporté: ${providerType}`);
    }
  }

  /**
   * Mappe un provider depuis la base de données
   */
  private mapProviderFromDB(data: any): OAuthProvider {
    return {
      id: data.id,
      name: data.name,
      displayName: data.display_name,
      type: data.type,
      clientId: data.client_id,
      clientSecret: data.client_secret,
      authorizationUrl: data.authorization_url,
      tokenUrl: data.token_url,
      userInfoUrl: data.user_info_url,
      scopes: data.scopes,
      redirectUri: data.redirect_uri,
      isActive: data.is_active,
      isDefault: data.is_default,
      icon: data.icon,
      color: data.color,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      metadata: data.metadata || {}
    };
  }

  /**
   * Mappe un token depuis la base de données
   */
  private mapTokenFromDB(data: any): OAuthToken {
    return {
      id: data.id,
      userId: data.user_id,
      providerId: data.provider_id,
      providerType: data.provider_type,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresAt: data.expires_at,
      scope: data.scope,
      isActive: data.is_active,
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      metadata: data.metadata || {}
    };
  }

  /**
   * Mappe un profil utilisateur depuis la base de données
   */
  private mapUserProfileFromDB(data: any): OAuthUserProfile {
    return {
      id: data.id,
      providerId: data.provider_id,
      providerType: data.provider_type,
      providerUserId: data.provider_user_id,
      email: data.email,
      name: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      avatar: data.avatar,
      profileUrl: data.profile_url,
      locale: data.locale,
      timezone: data.timezone,
      verified: data.verified,
      metadata: data.metadata || {},
      syncedAt: data.synced_at,
      updatedAt: data.updated_at
    };
  }
}

// Instance singleton
export const oauthService = new OAuthService();

// Export des fonctions utilitaires
export const createOAuthProvider = (provider: Omit<OAuthProvider, 'id' | 'createdAt' | 'updatedAt'>) => 
  oauthService.createProvider(provider);

export const getActiveOAuthProviders = () => 
  oauthService.getActiveProviders();

export const generateOAuthAuthorizationUrl = (provider: OAuthProvider, options?: {
  state?: string;
  scopes?: string[];
  redirectUri?: string;
  extraParams?: Record<string, string>;
}) => oauthService.generateAuthorizationUrl(provider, options);

export const exchangeOAuthCodeForTokens = (
  provider: OAuthProvider,
  code: string,
  redirectUri: string
) => oauthService.exchangeCodeForTokens(provider, code, redirectUri);

export const saveOAuthToken = (
  userId: string,
  providerId: string,
  providerType: OAuthProviderType,
  tokenData: {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresIn: number;
    scope: string;
  },
  metadata?: Partial<TokenMetadata>
) => oauthService.saveOAuthToken(userId, providerId, providerType, tokenData, metadata);

export const syncOAuthUserProfile = (
  userId: string,
  provider: OAuthProvider,
  accessToken: string
) => oauthService.syncUserProfile(userId, provider, accessToken);

export const getUserOAuthTokens = (userId: string, includeExpired?: boolean) => 
  oauthService.getUserTokens(userId, includeExpired);

export const revokeOAuthToken = (tokenId: string, userId: string) => 
  oauthService.revokeOAuthToken(tokenId, userId);

export const getOAuthStats = () => 
  oauthService.getOAuthStats();
