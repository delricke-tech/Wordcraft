/**
 * Validation du service Redis Cache corrigé
 * Vérification que tous les types sont corrects
 */

// Test d'importation
import { RedisCacheService, redisCacheService } from './services/redisCacheService';

// Test des types génériques
const testGenericTypes = () => {
  // Ces lignes ne doivent pas générer d'erreurs TypeScript
  const service = new RedisCacheService({
    redisUrl: 'redis://localhost:6379',
    password: undefined,
    database: 0,
    maxRetries: 3,
    retryDelay: 1000,
    connectTimeout: 5000,
    commandTimeout: 3000,
    lazyConnect: true,
    keyPrefix: 'test:',
    compression: false,
    encryption: false,
    monitoring: false
  });

  // Test set/get avec types
  const promise1 = service.set<string>('key1', 'value');
  const promise2 = service.get<string>('key1');
  const promise3 = service.set<{ name: string }>('key2', { name: 'test' });
  const promise4 = service.get<{ name: string }>('key2');
  
  // Test opérations numériques
  const promise5 = service.incr('counter', 1);
  
  // Test listes
  const promise6 = service.lpush<string>('list', 'item');
  const promise7 = service.get<string[]>('list');
  const promise8 = service.lrange<string>('list', 0, -1);
  
  // Test booléens
  const promise9 = service.exists('key');
  const promise10 = service.delete('key');

  return {
    set: promise1,
    get: promise2,
    setObject: promise3,
    getObject: promise4,
    incr: promise5,
    lpush: promise6,
    getList: promise7,
    lrange: promise8,
    exists: promise9,
    delete: promise10
  };
};

// Export pour validation
export { testGenericTypes, RedisCacheService, redisCacheService };

// Message de succès
console.log('✅ Validation Redis Cache: Tous les types sont corrects !');
