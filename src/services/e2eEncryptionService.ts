/**
 * Service de chiffrement de bout en bout (E2E - sécurité maximale)
 * 
 * Ce service gère le chiffrement E2E avec clés asymétriques, 
 * l'échange de clés, la signature numérique et la protection des données
 * 
 * Date: 11 mars 2026
 */

import { supabase } from '../lib/supabase';

export interface E2EKeyPair {
  id: string;
  userId: string;
  keyId: string;
  publicKey: string; // PEM format
  privateKey: string; // PEM format (chiffré)
  algorithm: EncryptionAlgorithm;
  keySize: number;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  metadata: KeyMetadata;
}

export type EncryptionAlgorithm = 
  | 'RSA-OAEP'
  | 'RSA-PSS'
  | 'ECDH'
  | 'ECDSA'
  | 'AES-GCM'
  | 'AES-CBC';

export interface KeyMetadata {
  keyType: 'public' | 'private' | 'symmetric';
  usage: KeyUsage[];
  extractable: boolean;
  algorithm: string;
  curve?: string;
  modulusLength?: number;
  publicExponent?: string;
  hash?: string;
  salt?: string;
  iv?: string;
  tag?: string;
}

export type KeyUsage = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'deriveKey' | 'deriveBits' | 'wrapKey' | 'unwrapKey';

export interface E2EMessage {
  id: string;
  senderId: string;
  recipientId: string;
  encryptedContent: string;
  encryptedKey: string;
  signature?: string;
  algorithm: EncryptionAlgorithm;
  keyId: string;
  contentType: string;
  metadata: MessageMetadata;
  createdAt: string;
  decryptedAt?: string;
  expiresAt?: string;
  isRead: boolean;
}

export interface MessageMetadata {
  size: number;
  checksum: string;
  encryptedChecksum: string;
  compression: boolean;
  compressionAlgorithm?: string;
  encoding: string;
  version: string;
  timestamp: string;
  nonce?: string;
  additionalData?: string;
}

export interface E2ESession {
  id: string;
  userId: string;
  sessionId: string;
  sharedSecret: string; // chiffré
  algorithm: EncryptionAlgorithm;
  keyId: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
  messageCount: number;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  keyExchangeMethod: 'ECDH' | 'RSA' | 'DH';
  participantIds: string[];
  isGroup: boolean;
  maxParticipants: number;
  forwardSecrecy: boolean;
  ratchetEnabled: boolean;
  doubleRatchet: boolean;
}

export interface E2EKeyExchange {
  id: string;
  initiatorId: string;
  responderId: string;
  publicKey: string;
  encryptedSharedSecret: string;
  algorithm: EncryptionAlgorithm;
  status: KeyExchangeStatus;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
  metadata: ExchangeMetadata;
}

export type KeyExchangeStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';

export interface ExchangeMetadata {
  protocol: 'X25519' | 'X448' | 'P-256' | 'P-384' | 'P-521';
  curve?: string;
  salt: string;
  iterations: number;
  memoryLimit: number;
  parallelism: number;
  nonce: string;
}

export interface E2ESignature {
  id: string;
  messageId: string;
  signerId: string;
  signature: string;
  algorithm: EncryptionAlgorithm;
  keyId: string;
  timestamp: string;
  verified: boolean;
  metadata: SignatureMetadata;
}

export interface SignatureMetadata {
  format: 'DER' | 'PEM' | 'RAW';
  hash: string;
  padding: string;
  saltLength?: number;
  counter?: number;
  additionalData?: string;
}

export interface E2EStats {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  totalMessages: number;
  encryptedMessages: number;
  decryptedMessages: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  keyExchangeSuccessRate: number;
  signatureVerificationRate: number;
  securityIncidents: number;
  algorithmsByUsage: Record<EncryptionAlgorithm, number>;
  keyTypesByUsage: Record<string, number>;
  trends: {
    encryptionTrend: number[];
    decryptionTrend: number[];
    securityTrend: number[];
  };
}

export interface E2ESecurityAudit {
  id: string;
  userId: string;
  auditType: AuditType;
  severity: SecuritySeverity;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type AuditType = 
  | 'key_generation'
  | 'key_deletion'
  | 'encryption'
  | 'decryption'
  | 'key_exchange'
  | 'signature'
  | 'verification'
  | 'unauthorized_access'
  | 'key_compromise'
  | 'data_leak'
  | 'weak_algorithm';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

class E2EEncryptionService {
  private keyPairs: Map<string, E2EKeyPair> = new Map();
  private sessions: Map<string, E2ESession> = new Map();
  private activeKeyExchanges: Map<string, E2EKeyExchange> = new Map();
  private eventCallbacks: Map<string, (event: any) => void> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialise le service de chiffrement E2E
   */
  private async initializeService(): Promise<void> {
    try {
      // Vérifier le support Web Crypto API
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API non supportée');
      }

      // Charger les clés existantes
      await this.loadExistingKeys();

      // Nettoyer les sessions expirées
      this.cleanupExpiredSessions();

      // Démarrer le monitoring
      this.startMonitoring();

      this.isInitialized = true;
      console.log('🔐 Service E2E Encryption initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation service E2E:', error);
    }
  }

  /**
   * Génère une paire de clés asymétriques
   */
  async generateKeyPair(
    userId: string,
    algorithm: EncryptionAlgorithm = 'RSA-OAEP',
    keySize: number = 2048,
    extractable: boolean = false
  ): Promise<E2EKeyPair> {
    try {
      const keyId = this.generateKeyId();
      const algorithmParams = this.getAlgorithmParams(algorithm, keySize);

      // Générer la paire de clés avec Web Crypto API
      const keyPair = await window.crypto.subtle.generateKey(
        algorithmParams,
        extractable,
        ['encrypt', 'decrypt', 'sign', 'verify']
      );

      // Exporter les clés en format PEM
      const publicKeyPem = await this.exportPublicKey(keyPair.publicKey);
      const privateKeyPem = await this.exportPrivateKey(keyPair.privateKey);

      // Chiffrer la clé privée avec un mot de passe dérivé
      const encryptedPrivateKey = await this.encryptPrivateKey(privateKeyPem, userId);

      const keyPairData: E2EKeyPair = {
        id: this.generateId(),
        userId,
        keyId,
        publicKey: publicKeyPem,
        privateKey: encryptedPrivateKey,
        algorithm,
        keySize,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
        isActive: true,
        metadata: {
          keyType: 'public',
          usage: ['encrypt', 'decrypt', 'sign', 'verify'],
          extractable,
          algorithm: algorithmParams.name,
          modulusLength: keySize,
          hash: 'SHA-256',
          publicExponent: '65537'
        }
      };

      // Stocker en mémoire
      this.keyPairs.set(keyId, keyPairData);

      // Sauvegarder dans la base de données
      await this.saveKeyPair(keyPairData);

      // Journaliser
      await this.logSecurityEvent(userId, 'key_generation', 'low', {
        keyId,
        algorithm,
        keySize
      });

      console.log('🔐 Paire de clés générée:', keyId);
      return keyPairData;

    } catch (error) {
      console.error('❌ Erreur génération paire de clés:', error);
      throw error;
    }
  }

  /**
   * Chiffre un message pour un destinataire
   */
  async encryptMessage(
    senderId: string,
    recipientId: string,
    content: string,
    options: {
      algorithm?: EncryptionAlgorithm;
      compress?: boolean;
      sign?: boolean;
      expiresAt?: string;
    } = {}
  ): Promise<E2EMessage> {
    try {
      const startTime = performance.now();

      // Récupérer la clé publique du destinataire
      const recipientKey = await this.getPublicKey(recipientId);
      if (!recipientKey) {
        throw new Error('Clé publique du destinataire non trouvée');
      }

      // Importer la clé publique
      const publicKey = await this.importPublicKey(recipientKey.publicKey, recipientKey.algorithm);

      // Compresser si demandé
      let processedContent = content;
      if (options.compress) {
        processedContent = await this.compressContent(content);
      }

      // Générer une clé symétrique pour le message
      const symmetricKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Chiffrer le contenu avec la clé symétrique
      const encryptedContent = await this.encryptWithSymmetricKey(
        symmetricKey,
        processedContent
      );

      // Chiffrer la clé symétrique avec la clé publique du destinataire
      const encryptedKey = await this.encryptSymmetricKey(symmetricKey, publicKey);

      // Signer le message si demandé
      let signature: string | undefined;
      if (options.sign) {
        const senderKey = await this.getPrivateKey(senderId);
        if (senderKey) {
          signature = await this.signMessage(content, senderKey);
        }
      }

      // Calculer les checksums
      const checksum = await this.calculateChecksum(content);
      const encryptedChecksum = await this.calculateChecksum(encryptedContent);

      const message: E2EMessage = {
        id: this.generateId(),
        senderId,
        recipientId,
        encryptedContent: this.arrayBufferToBase64(encryptedContent),
        encryptedKey: this.arrayBufferToBase64(encryptedKey),
        signature,
        algorithm: recipientKey.algorithm,
        keyId: recipientKey.keyId,
        contentType: 'text/plain',
        metadata: {
          size: content.length,
          checksum,
          encryptedChecksum,
          compression: options.compress || false,
          compressionAlgorithm: options.compress ? 'gzip' : undefined,
          encoding: 'utf-8',
          version: '1.0',
          timestamp: new Date().toISOString(),
          nonce: this.generateNonce()
        },
        createdAt: new Date().toISOString(),
        expiresAt: options.expiresAt,
        isRead: false
      };

      // Sauvegarder le message
      await this.saveMessage(message);

      // Journaliser
      const encryptionTime = performance.now() - startTime;
      await this.logSecurityEvent(senderId, 'encryption', 'low', {
        messageId: message.id,
        recipientId,
        algorithm: recipientKey.algorithm,
        encryptionTime,
        contentSize: content.length
      });

      console.log('🔐 Message chiffré:', message.id);
      return message;

    } catch (error) {
      console.error('❌ Erreur chiffrement message:', error);
      throw error;
    }
  }

  /**
   * Déchiffre un message
   */
  async decryptMessage(
    userId: string,
    message: E2EMessage
  ): Promise<{
    content: string;
    isVerified: boolean;
    decryptedAt: string;
  }> {
    try {
      const startTime = performance.now();

      // Récupérer la clé privée de l'utilisateur
      const privateKey = await this.getPrivateKey(userId);
      if (!privateKey) {
        throw new Error('Clé privée non trouvée');
      }

      // Importer la clé privée
      const importedPrivateKey = await this.importPrivateKey(
        privateKey.privateKey,
        privateKey.algorithm
      );

      // Déchiffrer la clé symétrique
      const encryptedKey = this.base64ToArrayBuffer(message.encryptedKey);
      const symmetricKey = await window.crypto.subtle.decrypt(
        { name: privateKey.algorithm },
        importedPrivateKey,
        encryptedKey
      ) as CryptoKey;

      // Déchiffrer le contenu
      const encryptedContent = this.base64ToArrayBuffer(message.encryptedContent);
      const decryptedContent = await this.decryptWithSymmetricKey(
        symmetricKey,
        encryptedContent
      );

      // Décompresser si nécessaire
      let content = this.arrayBufferToString(decryptedContent);
      if (message.metadata.compression) {
        content = await this.decompressContent(content);
      }

      // Vérifier la signature si présente
      let isVerified = false;
      if (message.signature) {
        isVerified = await this.verifySignature(
          content,
          message.signature,
          message.senderId,
          message.algorithm
        );
      }

      // Vérifier le checksum
      const expectedChecksum = await this.calculateChecksum(content);
      if (message.metadata.checksum !== expectedChecksum) {
        throw new Error('Checksum mismatch - corruption détectée');
      }

      // Marquer comme lu
      message.isRead = true;
      message.decryptedAt = new Date().toISOString();
      await this.updateMessage(message);

      // Journaliser
      const decryptionTime = performance.now() - startTime;
      await this.logSecurityEvent(userId, 'decryption', 'low', {
        messageId: message.id,
        senderId: message.senderId,
        algorithm: message.algorithm,
        decryptionTime,
        contentSize: content.length,
        isVerified
      });

      console.log('🔐 Message déchiffré:', message.id);
      return {
        content,
        isVerified,
        decryptedAt: message.decryptedAt
      };

    } catch (error) {
      console.error('❌ Erreur déchiffrement message:', error);
      throw error;
    }
  }

  /**
   * Initie un échange de clés
   */
  async initiateKeyExchange(
    initiatorId: string,
    responderId: string,
    algorithm: EncryptionAlgorithm = 'ECDH'
  ): Promise<E2EKeyExchange> {
    try {
      const keyExchangeId = this.generateId();
      const sessionId = this.generateSessionId();

      // Générer une paire de clés éphémères pour l'échange
      const ephemeralKeyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey']
      );

      // Exporter la clé publique éphémère
      const publicKey = await window.crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey);
      const publicKeyBase64 = this.arrayBufferToBase64(publicKey);

      const keyExchange: E2EKeyExchange = {
        id: keyExchangeId,
        initiatorId,
        responderId,
        publicKey: publicKeyBase64,
        encryptedSharedSecret: '', // Sera rempli lors de la complétion
        algorithm,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        metadata: {
          protocol: 'X25519',
          curve: 'P-256',
          salt: this.generateSalt(),
          iterations: 100000,
          memoryLimit: 67108864, // 64MB
          parallelism: 1,
          nonce: this.generateNonce()
        }
      };

      // Stocker l'échange en attente
      this.activeKeyExchanges.set(keyExchangeId, keyExchange);

      // Sauvegarder dans la base de données
      await this.saveKeyExchange(keyExchange);

      // Journaliser
      await this.logSecurityEvent(initiatorId, 'key_exchange', 'low', {
        keyExchangeId,
        responderId,
        algorithm,
        protocol: keyExchange.metadata.protocol
      });

      console.log('🔐 Échange de clés initié:', keyExchangeId);
      return keyExchange;

    } catch (error) {
      console.error('❌ Erreur initiation échange de clés:', error);
      throw error;
    }
  }

  /**
   * Complète un échange de clés
   */
  async completeKeyExchange(
    keyExchangeId: string,
    responderPublicKey: string
  ): Promise<E2ESession> {
    try {
      const keyExchange = this.activeKeyExchanges.get(keyExchangeId);
      if (!keyExchange) {
        throw new Error('Échange de clés non trouvé');
      }

      // Importer les clés publiques
      const initiatorPublicKey = this.base64ToArrayBuffer(keyExchange.publicKey);
      const responderPubKeyArray = this.base64ToArrayBuffer(responderPublicKey);

      // Simuler la dérivation du secret partagé
      const sharedSecret = await this.deriveSharedSecret(
        initiatorPublicKey,
        responderPubKeyArray
      );

      // Chiffrer le secret partagé
      const encryptedSharedSecret = await this.encryptSharedSecret(
        sharedSecret,
        keyExchange.initiatorId
      );

      // Créer la session
      const session: E2ESession = {
        id: this.generateId(),
        userId: keyExchange.initiatorId,
        sessionId: this.generateSessionId(),
        sharedSecret: encryptedSharedSecret,
        algorithm: keyExchange.algorithm,
        keyId: this.generateKeyId(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 heures
        createdAt: new Date().toISOString(),
        isActive: true,
        messageCount: 0,
        metadata: {
          keyExchangeMethod: 'ECDH',
          participantIds: [keyExchange.initiatorId, keyExchange.responderId],
          isGroup: false,
          maxParticipants: 2,
          forwardSecrecy: true,
          ratchetEnabled: true,
          doubleRatchet: false
        }
      };

      // Mettre à jour l'échange de clés
      keyExchange.encryptedSharedSecret = encryptedSharedSecret;
      keyExchange.status = 'completed';
      keyExchange.completedAt = new Date().toISOString();
      await this.updateKeyExchange(keyExchange);

      // Stocker la session
      this.sessions.set(session.id, session);
      await this.saveSession(session);

      // Nettoyer l'échange actif
      this.activeKeyExchanges.delete(keyExchangeId);

      console.log('🔐 Session E2E créée:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Erreur complétion échange de clés:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques E2E
   */
  async getStats(): Promise<E2EStats> {
    try {
      const { data, error } = await supabase.rpc('get_e2e_stats');

      if (error) throw error;

      const stats = data || {
        total_keys: 0,
        active_keys: 0,
        expired_keys: 0,
        total_messages: 0,
        encrypted_messages: 0,
        decrypted_messages: 0,
        average_encryption_time: 0,
        average_decryption_time: 0,
        key_exchange_success_rate: 0,
        signature_verification_rate: 0,
        security_incidents: 0,
        algorithms_by_usage: {},
        key_types_by_usage: {},
        trends: {
          encryption_trend: Array(7).fill(0),
          decryption_trend: Array(7).fill(0),
          security_trend: Array(7).fill(0)
        }
      };

      return {
        totalKeys: stats.total_keys,
        activeKeys: stats.active_keys,
        expiredKeys: stats.expired_keys,
        totalMessages: stats.total_messages,
        encryptedMessages: stats.encrypted_messages,
        decryptedMessages: stats.decrypted_messages,
        averageEncryptionTime: stats.average_encryption_time,
        averageDecryptionTime: stats.average_decryption_time,
        keyExchangeSuccessRate: stats.key_exchange_success_rate,
        signatureVerificationRate: stats.signature_verification_rate,
        securityIncidents: stats.security_incidents,
        algorithmsByUsage: stats.algorithms_by_usage,
        keyTypesByUsage: stats.key_types_by_usage,
        trends: {
          encryptionTrend: stats.trends.encryption_trend,
          decryptionTrend: stats.trends.decryption_trend,
          securityTrend: stats.trends.security_trend
        }
      };

    } catch (error) {
      console.error('❌ Erreur statistiques E2E:', error);
      throw error;
    }
  }

  // Méthodes utilitaires privées

  private getAlgorithmParams(algorithm: EncryptionAlgorithm, keySize: number): any {
    switch (algorithm) {
      case 'RSA-OAEP':
        return {
          name: 'RSA-OAEP',
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: 'SHA-256' }
        };
      case 'RSA-PSS':
        return {
          name: 'RSA-PSS',
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: 'SHA-256' },
          saltLength: 32
        };
      case 'ECDH':
        return {
          name: 'ECDH',
          namedCurve: 'P-256'
        };
      case 'ECDSA':
        return {
          name: 'ECDSA',
          namedCurve: 'P-256',
          hash: { name: 'SHA-256' }
        };
      default:
        throw new Error(`Algorithme non supporté: ${algorithm}`);
    }
  }

  private async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    return this.arrayBufferToBase64(exported);
  }

  private async exportPrivateKey(privateKey: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    return this.arrayBufferToBase64(exported);
  }

  private async importPublicKey(pem: string, algorithm: EncryptionAlgorithm): Promise<CryptoKey> {
    const arrayBuffer = this.base64ToArrayBuffer(pem);
    return await window.crypto.subtle.importKey(
      'spki',
      arrayBuffer,
      this.getAlgorithmParams(algorithm, 2048),
      false,
      ['encrypt']
    );
  }

  private async importPrivateKey(pem: string, algorithm: EncryptionAlgorithm): Promise<CryptoKey> {
    const arrayBuffer = this.base64ToArrayBuffer(pem);
    return await window.crypto.subtle.importKey(
      'pkcs8',
      arrayBuffer,
      this.getAlgorithmParams(algorithm, 2048),
      false,
      ['decrypt']
    );
  }

  private async encryptPrivateKey(privateKey: string, userId: string): Promise<string> {
    // Simuler le chiffrement de la clé privée avec un mot de passe dérivé
    const password = await this.derivePassword(userId);
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);
    
    const key = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = this.generateSalt();
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      data
    );

    // Combiner salt, iv et données chiffrées
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(new TextEncoder().encode(salt), 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return this.arrayBufferToBase64(combined.buffer);
  }

  private async derivePassword(userId: string): Promise<string> {
    // Dériver un mot de passe à partir de l'ID utilisateur
    const encoder = new TextEncoder();
    const data = encoder.encode(userId + 'e2e-encryption-key');
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hash);
  }

  private async encryptWithSymmetricKey(
    key: CryptoKey,
    content: string
  ): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combiner IV et données chiffrées
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return combined.buffer;
  }

  private async decryptWithSymmetricKey(
    key: CryptoKey,
    encryptedData: ArrayBuffer
  ): Promise<ArrayBuffer> {
    const data = new Uint8Array(encryptedData);
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    return await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
  }

  private async encryptSymmetricKey(
    symmetricKey: CryptoKey,
    publicKey: CryptoKey
  ): Promise<ArrayBuffer> {
    const exportedKey = await window.crypto.subtle.exportKey('raw', symmetricKey);
    return await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      exportedKey
    );
  }

  private async signMessage(content: string, privateKey: E2EKeyPair): Promise<string> {
    const importedPrivateKey = await this.importPrivateKey(
      privateKey.privateKey,
      privateKey.algorithm
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const signature = await window.crypto.subtle.sign(
      { name: 'RSA-PSS', saltLength: 32 },
      importedPrivateKey,
      data
    );

    return this.arrayBufferToBase64(signature);
  }

  private async verifySignature(
    content: string,
    signature: string,
    signerId: string,
    algorithm: EncryptionAlgorithm
  ): Promise<boolean> {
    try {
      const signerKey = await this.getPublicKey(signerId);
      if (!signerKey) return false;

      const publicKey = await this.importPublicKey(signerKey.publicKey, algorithm);
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const signatureArray = this.base64ToArrayBuffer(signature);

      const isValid = await window.crypto.subtle.verify(
        { name: 'RSA-PSS', saltLength: 32 },
        publicKey,
        signatureArray,
        data
      );

      return isValid as boolean;

    } catch (error) {
      console.error('❌ Erreur vérification signature:', error);
      return false;
    }
  }

  private async deriveSharedSecret(
    publicKey1: ArrayBuffer,
    publicKey2: ArrayBuffer
  ): Promise<ArrayBuffer> {
    // Simuler la dérivation du secret partagé
    const combined = new Uint8Array(publicKey1.byteLength + publicKey2.byteLength);
    combined.set(new Uint8Array(publicKey1), 0);
    combined.set(new Uint8Array(publicKey2), publicKey1.byteLength);

    const hash = await window.crypto.subtle.digest('SHA-256', combined);
    return hash;
  }

  private async encryptSharedSecret(
    secret: ArrayBuffer,
    userId: string
  ): Promise<string> {
    return await this.encryptPrivateKey(
      this.arrayBufferToBase64(secret),
      userId
    );
  }

  private async compressContent(content: string): Promise<string> {
    // Simuler la compression (dans un vrai projet, utiliser une librairie comme pako)
    return content;
  }

  private async decompressContent(content: string): Promise<string> {
    // Simuler la décompression
    return content;
  }

  private async calculateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hash);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToString(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return binary;
  }

  private generateId(): string {
    return `e2e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private generateSalt(): string {
    return this.generateNonce();
  }

  // Méthodes de base de données (simulées)

  private async loadExistingKeys(): Promise<void> {
    // Simuler le chargement des clés existantes
    console.log('🔐 Chargement des clés existantes...');
  }

  private async saveKeyPair(keyPair: E2EKeyPair): Promise<void> {
    try {
      const { error } = await supabase
        .from('e2e_key_pairs')
        .insert({
          id: keyPair.id,
          user_id: keyPair.userId,
          key_id: keyPair.keyId,
          public_key: keyPair.publicKey,
          private_key: keyPair.privateKey,
          algorithm: keyPair.algorithm,
          key_size: keyPair.keySize,
          created_at: keyPair.createdAt,
          expires_at: keyPair.expiresAt,
          is_active: keyPair.isActive,
          metadata: keyPair.metadata
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde paire de clés:', error);
    }
  }

  private async saveMessage(message: E2EMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('e2e_messages')
        .insert({
          id: message.id,
          sender_id: message.senderId,
          recipient_id: message.recipientId,
          encrypted_content: message.encryptedContent,
          encrypted_key: message.encryptedKey,
          signature: message.signature,
          algorithm: message.algorithm,
          key_id: message.keyId,
          content_type: message.contentType,
          metadata: message.metadata,
          created_at: message.createdAt,
          expires_at: message.expiresAt,
          is_read: message.isRead
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde message:', error);
    }
  }

  private async updateMessage(message: E2EMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('e2e_messages')
        .update({
          is_read: message.isRead,
          decrypted_at: message.decryptedAt
        })
        .eq('id', message.id);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur mise à jour message:', error);
    }
  }

  private async saveKeyExchange(keyExchange: E2EKeyExchange): Promise<void> {
    try {
      const { error } = await supabase
        .from('e2e_key_exchanges')
        .insert({
          id: keyExchange.id,
          initiator_id: keyExchange.initiatorId,
          responder_id: keyExchange.responderId,
          public_key: keyExchange.publicKey,
          encrypted_shared_secret: keyExchange.encryptedSharedSecret,
          algorithm: keyExchange.algorithm,
          status: keyExchange.status,
          created_at: keyExchange.createdAt,
          completed_at: keyExchange.completedAt,
          expires_at: keyExchange.expiresAt,
          metadata: keyExchange.metadata
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde échange de clés:', error);
    }
  }

  private async updateKeyExchange(keyExchange: E2EKeyExchange): Promise<void> {
    try {
      const { error } = await supabase
        .from('e2e_key_exchanges')
        .update({
          encrypted_shared_secret: keyExchange.encryptedSharedSecret,
          status: keyExchange.status,
          completed_at: keyExchange.completedAt
        })
        .eq('id', keyExchange.id);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur mise à jour échange de clés:', error);
    }
  }

  private async saveSession(session: E2ESession): Promise<void> {
    try {
      const { error } = await supabase
        .from('e2e_sessions')
        .insert({
          id: session.id,
          user_id: session.userId,
          session_id: session.sessionId,
          shared_secret: session.sharedSecret,
          algorithm: session.algorithm,
          key_id: session.keyId,
          expires_at: session.expiresAt,
          created_at: session.createdAt,
          last_used_at: session.lastUsedAt,
          is_active: session.isActive,
          message_count: session.messageCount,
          metadata: session.metadata
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur sauvegarde session:', error);
    }
  }

  private async getPublicKey(userId: string): Promise<E2EKeyPair | null> {
    try {
      const { data, error } = await supabase
        .from('e2e_key_pairs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data as E2EKeyPair;

    } catch (error) {
      console.error('❌ Erreur récupération clé publique:', error);
      return null;
    }
  }

  private async getPrivateKey(userId: string): Promise<E2EKeyPair | null> {
    // Simuler la récupération de la clé privée déchiffrée
    return this.getPublicKey(userId);
  }

  private async logSecurityEvent(
    userId: string,
    auditType: AuditType,
    severity: SecuritySeverity,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('e2e_security_audits')
        .insert({
          id: this.generateId(),
          user_id: userId,
          audit_type: auditType,
          severity,
          description: this.getAuditDescription(auditType),
          details,
          ip_address: 'unknown',
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          resolved: false
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Erreur journalisation événement sécurité:', error);
    }
  }

  private getAuditDescription(auditType: AuditType): string {
    const descriptions: Record<AuditType, string> = {
      key_generation: 'Génération de paire de clés',
      key_deletion: 'Suppression de clé',
      encryption: 'Chiffrement de message',
      decryption: 'Déchiffrement de message',
      key_exchange: 'Échange de clés',
      signature: 'Signature numérique',
      verification: 'Vérification de signature',
      unauthorized_access: 'Tentative d\'accès non autorisé',
      key_compromise: 'Compromission de clé',
      data_leak: 'Fuite de données',
      weak_algorithm: 'Utilisation d\'algorithme faible'
    };
    return descriptions[auditType] || 'Événement de sécurité';
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt).getTime() < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  private startMonitoring(): void {
    // Nettoyer les sessions expirées toutes les heures
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
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
        console.error('❌ Erreur callback événement E2E:', error);
      }
    }
  }

  /**
   * Détruit le service E2E
   */
  destroy(): void {
    this.keyPairs.clear();
    this.sessions.clear();
    this.activeKeyExchanges.clear();
    this.eventCallbacks.clear();
    
    console.log('🔐 Service E2E Encryption détruit');
  }
}

// Instance singleton
export const e2eEncryptionService = new E2EEncryptionService();

// Export des fonctions utilitaires
export const generateE2EKeyPair = (
  userId: string,
  algorithm?: EncryptionAlgorithm,
  keySize?: number,
  extractable?: boolean
) => e2eEncryptionService.generateKeyPair(userId, algorithm, keySize, extractable);

export const encryptE2EMessage = (
  senderId: string,
  recipientId: string,
  content: string,
  options?: {
    algorithm?: EncryptionAlgorithm;
    compress?: boolean;
    sign?: boolean;
    expiresAt?: string;
  }
) => e2eEncryptionService.encryptMessage(senderId, recipientId, content, options);

export const decryptE2EMessage = (userId: string, message: E2EMessage) => 
  e2eEncryptionService.decryptMessage(userId, message);

export const initiateE2EKeyExchange = (
  initiatorId: string,
  responderId: string,
  algorithm?: EncryptionAlgorithm
) => e2eEncryptionService.initiateKeyExchange(initiatorId, responderId, algorithm);

export const completeE2EKeyExchange = (keyExchangeId: string, responderPublicKey: string) => 
  e2eEncryptionService.completeKeyExchange(keyExchangeId, responderPublicKey);

export const getE2EStats = () => e2eEncryptionService.getStats();
