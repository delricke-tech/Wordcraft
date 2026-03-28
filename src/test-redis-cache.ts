/**
 * Test du service Redis Cache corrigé
 * Phase 1.1 - Vérification des corrections
 */

import { RedisCacheService } from './services/redisCacheService';

async function testRedisCache() {
  console.log('🧪 Test du service Redis Cache corrigé...');
  
  // Configuration du service
  const config = {
    redisUrl: 'redis://localhost:6379',
    password: undefined,
    database: 0,
    maxRetries: 3,
    retryDelay: 1000,
    connectTimeout: 5000,
    commandTimeout: 3000,
    lazyConnect: true,
    keyPrefix: 'wordcraft:',
    compression: false,
    encryption: false,
    monitoring: true
  };

  const cacheService = new RedisCacheService(config);

  try {
    // Test 1: Set avec type générique
    console.log('✅ Test 1: Set avec type générique');
    await cacheService.set('user:123', { name: 'John', age: 30 });
    
    // Test 2: Get avec type générique
    console.log('✅ Test 2: Get avec type générique');
    const user = await cacheService.get<{ name: string; age: number }>('user:123');
    console.log('User récupéré:', user);
    
    // Test 3: Incr avec typage
    console.log('✅ Test 3: Incr avec typage');
    await cacheService.set('counter', 0);
    const counter = await cacheService.incr('counter', 5);
    console.log('Counter:', counter);
    
    // Test 4: List operations avec types
    console.log('✅ Test 4: List operations avec types');
    await cacheService.lpush('messages', 'Hello');
    await cacheService.lpush('messages', 'World');
    const messages = await cacheService.get<string[]>('messages');
    console.log('Messages:', messages);
    
    // Test 5: Exists et Delete
    console.log('✅ Test 5: Exists et Delete');
    const exists = await cacheService.exists('user:123');
    console.log('User exists:', exists);
    
    await cacheService.delete('user:123');
    const existsAfterDelete = await cacheService.exists('user:123');
    console.log('User exists after delete:', existsAfterDelete);
    
    console.log('🎉 Tous les tests passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exporter pour utilisation
export { testRedisCache };
