/**
 * Script de test pour valider le fix du Bug 2
 * Extension d'abonnement (pas d'écrasement)
 * Date: 6 janvier 2025
 * 
 * Usage: node test_subscription_extension.js
 */

// Configuration
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SERVICE_ROLE_KEY = 'votre-service-role-key';  // ⚠️ Clé service, PAS anon key

// ============================================
// TESTS
// ============================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║      TEST BUG 2 : Extension Abonnement (Pas d'écrasement)                ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// Test 1 : Renouvellement AVANT expiration (cas du bug)
console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  TEST 1 : Renouvellement 10 jours AVANT expiration             │
└─────────────────────────────────────────────────────────────────┘
`);

console.log(`
📋 Scénario :
1. Utilisateur a un abonnement expirant le 31 janvier 2025
2. Le 21 janvier, il paie 5000 FCFA (30 jours premium)
3. Question : Nouvelle date d'expiration ?

❌ AVANT FIX : 21 jan + 30 jours = 20 février (perd 10 jours !)
✅ APRÈS FIX : 31 jan + 30 jours = 1er mars (garde ses 10 jours)
`);

console.log(`
🧪 Pour tester :

1. Créer un profil de test dans Supabase SQL Editor :
   
   INSERT INTO profiles (id, subscription_type, subscription_expires_at)
   VALUES (
     'test-user-bug2-001',
     'basic',
     '2025-01-31T23:59:59Z'
   );

2. Créer un paiement :
   
   INSERT INTO payments (user_id, amount, tid_submitted, operator, status)
   VALUES (
     'test-user-bug2-001',
     5000,
     'TEST_BUG2_001',
     'moov',
     'pending'
   );

3. Simuler la validation SMS :
   
   curl -X POST ${SUPABASE_URL}/functions/v1/validate-transaction \\
     -H "Content-Type: application/json" \\
     -H "x-custom-authorization: VOTRE_CLE" \\
     -d '{
       "message": "Ref: TEST_BUG2_001\\n5000 FCFA",
       "from": "MoovMoney",
       "sim_slot": 1
     }'

4. Vérifier le résultat :
   
   SELECT 
     subscription_type,
     subscription_expires_at,
     EXTRACT(DAY FROM (subscription_expires_at - '2025-01-31T23:59:59Z'::timestamp)) as jours_ajoutes
   FROM profiles
   WHERE id = 'test-user-bug2-001';
   
   Résultat attendu :
   - subscription_type: 'premium'
   - subscription_expires_at: '2025-03-01...' (31 jan + 30 jours)
   - jours_ajoutes: 30

5. Nettoyer :
   
   DELETE FROM payments WHERE tid_submitted = 'TEST_BUG2_001';
   DELETE FROM profiles WHERE id = 'test-user-bug2-001';
`);

// Test 2 : Renouvellement APRÈS expiration
console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  TEST 2 : Renouvellement APRÈS expiration                      │
└─────────────────────────────────────────────────────────────────┘
`);

console.log(`
📋 Scénario :
1. Utilisateur a un abonnement expiré le 31 janvier 2025
2. Le 5 février, il paie 5000 FCFA (30 jours premium)
3. Question : Nouvelle date d'expiration ?

✅ AVANT ET APRÈS FIX : 5 fév + 30 jours = 6 mars
(Pas de bug dans ce cas)
`);

console.log(`
🧪 Pour tester :

1. Créer un profil avec abonnement expiré :
   
   INSERT INTO profiles (id, subscription_type, subscription_expires_at)
   VALUES (
     'test-user-bug2-002',
     'basic',
     '2025-01-31T23:59:59Z'  -- Dans le passé
   );

2. Attendre que la date soit passée, ou modifier manuellement :
   UPDATE profiles 
   SET subscription_expires_at = NOW() - INTERVAL '5 days'
   WHERE id = 'test-user-bug2-002';

3. Créer un paiement et valider (comme Test 1)

4. Vérifier que l'expiration est NOW() + 30 jours
`);

// Test 3 : Premier abonnement
console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  TEST 3 : Premier abonnement (pas d'abonnement existant)       │
└─────────────────────────────────────────────────────────────────┘
`);

console.log(`
📋 Scénario :
1. Nouvel utilisateur sans abonnement
2. Il paie 5000 FCFA (30 jours premium)
3. Question : Nouvelle date d'expiration ?

✅ AVANT ET APRÈS FIX : Aujourd'hui + 30 jours
(Pas de bug dans ce cas)
`);

// Test 4 : Cas extrême - Renouvellement 1 jour avant
console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  TEST 4 : Renouvellement 1 jour avant expiration               │
└─────────────────────────────────────────────────────────────────┘
`);

console.log(`
📋 Scénario :
1. Abonnement expire demain (31 janvier)
2. Aujourd'hui (30 janvier), paiement de 5000 FCFA
3. Question : Nouvelle date d'expiration ?

❌ AVANT FIX : 30 jan + 30 = 28 février (perd 1 jour)
✅ APRÈS FIX : 31 jan + 30 = 1er mars (garde son jour)
`);

// Test 5 : Cas extrême - Renouvellement 1 an avant
console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  TEST 5 : Renouvellement très anticipé (1 an avant)            │
└─────────────────────────────────────────────────────────────────┘
`);

console.log(`
📋 Scénario :
1. Utilisateur a un abonnement jusqu'au 31 décembre 2025
2. Le 6 janvier 2025, il paie 10000 FCFA (365 jours = 1 an)
3. Question : Nouvelle date d'expiration ?

❌ AVANT FIX : 6 jan 2025 + 365 = 6 janvier 2026 (perd 359 jours !)
✅ APRÈS FIX : 31 déc 2025 + 365 = 31 décembre 2026 (garde tous ses jours)
`);

// Calculateur de pertes
console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  CALCULATEUR : Impact du Bug                                   │
└─────────────────────────────────────────────────────────────────┘
`);

function calculateLoss(renewDaysBefore) {
  const daysLost = renewDaysBefore;
  const pricePerMonth = 5000; // FCFA
  const lossPerUser = (daysLost / 30) * pricePerMonth;
  
  console.log(`
  Renouvellement ${renewDaysBefore} jours avant expiration :
  - Jours perdus par utilisateur : ${daysLost}
  - Perte financière : ${lossPerUser.toFixed(0)} FCFA
  
  Si 100 utilisateurs :
  - Total jours perdus : ${daysLost * 100}
  - Perte totale : ${(lossPerUser * 100).toFixed(0)} FCFA
  `);
}

console.log(`\n📊 Exemples de pertes :`);
calculateLoss(5);   // Renouvellement 5 jours avant
calculateLoss(10);  // Renouvellement 10 jours avant
calculateLoss(15);  // Renouvellement 15 jours avant

// Résumé
console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         RÉSUMÉ DES TESTS                                   ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ Test 1 : Renouvellement avant expiration (CAS DU BUG) - À tester
✅ Test 2 : Renouvellement après expiration (OK avant) - À tester
✅ Test 3 : Premier abonnement (OK avant) - À tester
✅ Test 4 : Renouvellement 1 jour avant (CAS DU BUG) - À tester
✅ Test 5 : Renouvellement très anticipé (CAS DU BUG) - À tester

📋 ACTIONS :
1. Redéployer l'Edge Function : supabase functions deploy validate-transaction
2. Exécuter les tests ci-dessus dans Supabase SQL Editor
3. Vérifier les logs de l'Edge Function pour voir :
   "📅 Extension: 30 jours ajoutés à [date]"
   OU
   "📅 Nouvel abonnement: 30 jours"
4. Valider que les dates sont correctes

⚠️ IMPORTANT :
Le bug affecte UNIQUEMENT les renouvellements avant expiration.
Les premiers abonnements et renouvellements après expiration fonctionnent correctement.

🎯 VALIDATION FINALE :
Un utilisateur qui renouvelle son abonnement doit TOUJOURS voir ses jours restants
être AJOUTÉS à la nouvelle durée, jamais PERDUS.
`);

// Configuration
console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         CONFIGURATION                                      ║
╚════════════════════════════════════════════════════════════════════════════╝

⚠️ Avant d'exécuter les tests, configurez :

1. SUPABASE_URL dans ce fichier (ligne 8)
2. SERVICE_ROLE_KEY dans ce fichier (ligne 9)
3. Redéployez l'Edge Function avec le fix

Puis exécutez : node test_subscription_extension.js
`);

if (SUPABASE_URL.includes('votre-projet')) {
  console.log('\n❌ Veuillez configurer SUPABASE_URL et SERVICE_ROLE_KEY avant de lancer les tests.\n');
  process.exit(1);
}

console.log('\n✅ Configuration OK. Suivez les instructions ci-dessus pour tester.\n');
