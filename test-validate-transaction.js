/**
 * Script de test pour validate-transaction Edge Function
 * Configuration: Moov Money Gabon uniquement (2 cartes SIM)
 * Date: 6 janvier 2025
 * 
 * Usage: node test-validate-transaction.js
 */

const SUPABASE_URL = 'https://votre-projet.supabase.co';
const AUTHORIZATION_KEY = 'votre-cle-secrete';

// ============================================
// EXEMPLES DE SMS RÉELS - MOOV MONEY GABON
// ============================================

const SMS_EXAMPLES = [
  // Moov Money - Format 1 (Standard)
  {
    message: 'Paiement confirmé\nMontant: 5000 FCFA\nRef: 123456789\nDate: 06/01/2025\nService: WordCraft\nMerci d\'utiliser Moov Money',
    from: 'MoovMoney',
    sim_slot: 1,
    sim_number: '+24177123456',
    description: 'Moov Money - Format standard (SIM 1)'
  },
  
  // Moov Money - Format 2 (Compact)
  {
    message: 'Transaction réussie\n5000 F CFA\nRef : 987654321\nMerci',
    from: 'Moov',
    sim_slot: 2,
    sim_number: '+24177654321',
    description: 'Moov Money - Format compact (SIM 2)'
  },
  
  // Libertis - Format 1
  {
    message: 'Libertis Money\nPaiement: 5000 FCFA\nReference: 456789123\n06/01/2025 10:30',
    from: 'Libertis',
    sim_slot: 1,
    description: 'Libertis - Format standard (SIM 1)'
  },
  
  // Moov Money - Avec espaces dans le Ref
  {
    message: 'Confirmation paiement\nMontant : 5000 FCFA\nRef : 111 222 333\nService : App',
    from: 'MoovMoney',
    sim_slot: 2,
    description: 'Moov Money - Ref avec espaces (SIM 2)'
  },
  
  // Moov Money - Format minimal
  {
    message: 'Ref: 555666777\n5000 F',
    from: 'Moov',
    sim_slot: 1,
    description: 'Moov Money - Format minimal (SIM 1)'
  },
  
  // Moov Money - Format long
  {
    message: 'Cher client,\nVotre paiement de 10000 FCFA a été effectué avec succès.\nRéférence: 999888777\nDate: 06/01/2025 14:30\nMerci de votre confiance.\nMoov Money Gabon',
    from: 'MoovMoney',
    sim_slot: 2,
    description: 'Moov Money - Format long (SIM 2)'
  },
  
  // Test - TID invalide
  {
    message: 'Paiement confirme sans reference',
    from: 'MoovMoney',
    sim_slot: 1,
    description: '❌ Test erreur - Pas de Ref'
  },
  
  // Test - Format inconnu
  {
    message: 'Code: ABC123\n5000 FCFA',
    from: 'MoovMoney',
    sim_slot: 2,
    description: '❌ Test erreur - Format non reconnu'
  }
];

// ============================================
// FONCTIONS DE TEST
// ============================================

async function testSmsValidation(smsData, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📱 TEST ${index + 1}/${SMS_EXAMPLES.length}: ${smsData.description}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Expéditeur: ${smsData.from}`);
  console.log(`SIM Slot: ${smsData.sim_slot || 'N/A'}`);
  console.log(`Numéro SIM: ${smsData.sim_number || 'N/A'}`);
  console.log(`Message: ${smsData.message.substring(0, 80)}${smsData.message.length > 80 ? '...' : ''}`);
  console.log('');
  
  try {
    const body = {
      message: smsData.message,
      from: smsData.from
    };
    
    // Ajouter les champs optionnels si présents
    if (smsData.sim_slot) body.sim_slot = smsData.sim_slot;
    if (smsData.sim_number) body.sim_number = smsData.sim_number;
    if (smsData.timestamp) body.timestamp = smsData.timestamp;
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-custom-authorization': AUTHORIZATION_KEY
      },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCÈS');
      console.log(`Status: ${response.status}`);
      console.log(`Payment ID: ${result.payment_id}`);
      console.log(`TID: ${result.tid}`);
      console.log(`Opérateur: ${result.operator}`);
      console.log(`Montant: ${result.amount} FCFA`);
      console.log(`SIM utilisée: Slot ${result.sim_info?.slot || 'N/A'}`);
      console.log(`Abonnement: ${result.subscription?.subscriptionType}`);
      console.log(`Expire le: ${result.subscription?.expiresAt}`);
    } else {
      console.log(`❌ ERREUR ${response.status}`);
      console.log(`Message: ${result.error}`);
      if (result.details) {
        console.log(`Détails:`, result.details);
      }
      if (result.tid) {
        console.log(`TID: ${result.tid}`);
      }
    }
    
  } catch (error) {
    console.log('🔥 EXCEPTION');
    console.error(error.message);
  }
}

async function testWithoutAuthorization() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔐 TEST SÉCURITÉ: Sans header d'autorisation`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Pas de x-custom-authorization
      },
      body: JSON.stringify({
        message: 'Ref: 123456',
        from: 'MoovMoney'
      })
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ SÉCURITÉ OK - Accès refusé comme attendu');
      console.log(`Message: ${result.error}`);
    } else {
      console.log('⚠️ PROBLÈME DE SÉCURITÉ - L\'accès devrait être refusé!');
      console.log(`Status: ${response.status}`);
    }
    
  } catch (error) {
    console.error('🔥 EXCEPTION:', error.message);
  }
}

async function testMalformedJson() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔧 TEST FORMAT: JSON invalide`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-custom-authorization': AUTHORIZATION_KEY
      },
      body: 'ceci nest pas du json'
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Message: ${result.error || 'Pas de message d\'erreur'}`);
    
  } catch (error) {
    console.log('✅ Erreur capturée comme attendu');
    console.error(error.message);
  }
}

async function testMissingFields() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔧 TEST FORMAT: Champs manquants`);
  console.log(`${'='.repeat(80)}`);
  
  const testCases = [
    { message: 'Ref: 123456' }, // Manque 'from'
    { from: 'MoovMoney' }, // Manque 'message'
    {} // Tout manque
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    console.log(`\nTest ${i + 1}:`, JSON.stringify(testCases[i]));
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-custom-authorization': AUTHORIZATION_KEY
        },
        body: JSON.stringify(testCases[i])
      });
      
      const result = await response.json();
      
      if (response.status === 400) {
        console.log(`✅ Validation OK - ${result.error}`);
      } else {
        console.log(`⚠️ Devrait retourner 400, reçu ${response.status}`);
      }
      
    } catch (error) {
      console.error('🔥 EXCEPTION:', error.message);
    }
  }
}

async function testBothSims() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📱 TEST MULTI-SIM: Validation avec 2 SIM différentes`);
  console.log(`${'='.repeat(80)}`);
  
  const testCases = [
    {
      message: 'Ref: SIM1TEST\n5000 FCFA',
      from: 'MoovMoney',
      sim_slot: 1,
      sim_number: '+24177111111',
      description: 'Test SIM 1'
    },
    {
      message: 'Ref: SIM2TEST\n5000 FCFA',
      from: 'MoovMoney',
      sim_slot: 2,
      sim_number: '+24177222222',
      description: 'Test SIM 2'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.description}`);
    console.log(`SIM Slot: ${testCase.sim_slot}`);
    console.log(`Numéro: ${testCase.sim_number}`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-custom-authorization': AUTHORIZATION_KEY
        },
        body: JSON.stringify(testCase)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Validé via SIM ${result.sim_info?.slot}`);
      } else {
        console.log(`❌ ${result.error}`);
      }
      
    } catch (error) {
      console.error('🔥 EXCEPTION:', error.message);
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// ============================================
// EXECUTION DES TESTS
// ============================================

async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║      TEST SUITE - validate-transaction Edge Function                      ║
║              Moov Money Gabon (2 cartes SIM)                              ║
║                                                                            ║
║  Date: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}                                                    ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
  
  console.log(`🔗 URL: ${SUPABASE_URL}/functions/v1/validate-transaction`);
  console.log(`🔑 Authorization Key: ${AUTHORIZATION_KEY.substring(0, 10)}...`);
  console.log(`🇬🇦 Opérateur: Moov Money Gabon`);
  console.log(`📱 Configuration: 2 cartes SIM`);
  
  // Test 1: Validation SMS Moov Money
  console.log(`\n\n┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│  SECTION 1: Tests de Validation SMS Moov Money                 │`);
  console.log(`└─────────────────────────────────────────────────────────────────┘`);
  
  for (let i = 0; i < SMS_EXAMPLES.length; i++) {
    await testSmsValidation(SMS_EXAMPLES[i], i);
    // Pause de 500ms entre les tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test 2: Sécurité
  console.log(`\n\n┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│  SECTION 2: Tests de Sécurité                                  │`);
  console.log(`└─────────────────────────────────────────────────────────────────┘`);
  
  await testWithoutAuthorization();
  
  // Test 3: Format
  console.log(`\n\n┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│  SECTION 3: Tests de Format                                    │`);
  console.log(`└─────────────────────────────────────────────────────────────────┘`);
  
  await testMalformedJson();
  await testMissingFields();
  
  // Test 4: Multi-SIM
  console.log(`\n\n┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│  SECTION 4: Tests Multi-SIM                                    │`);
  console.log(`└─────────────────────────────────────────────────────────────────┘`);
  
  await testBothSims();
  
  // Résumé
  console.log(`\n\n╔════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                         FIN DES TESTS                                      ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════╝\n`);
  
  console.log(`
📋 RÉSUMÉ:
  - ${SMS_EXAMPLES.length} tests de validation SMS
  - 1 test de sécurité
  - 2 tests de format
  - 2 tests multi-SIM
  
💡 PROCHAINES ÉTAPES:
  1. Vérifier les logs dans Supabase Dashboard
  2. Créer des paiements de test dans la base
  3. Configurer SmsForwarder sur Android
  4. Tester avec de vrais SMS Moov Money
  5. Déployer en production
  
📚 DOCUMENTATION: GUIDE_EDGE_FUNCTION_SMS.md
  
🇬🇦 Configuration: 2 cartes SIM Moov Money Gabon
  `);
}

// ============================================
// CONFIGURATION
// ============================================

console.log(`
⚙️  CONFIGURATION REQUISE

Avant d'exécuter les tests, modifiez les constantes en haut du fichier:

1. SUPABASE_URL: Votre URL Supabase
   Exemple: https://abc123.supabase.co

2. AUTHORIZATION_KEY: Votre clé configurée dans Supabase
   Même valeur que CUSTOM_AUTHORIZATION_KEY dans Edge Functions → Secrets

Puis relancez: node test-validate-transaction.js
`);

// Vérifier si la config est valide
if (SUPABASE_URL.includes('votre-projet') || AUTHORIZATION_KEY === 'votre-cle-secrete') {
  console.log('❌ Veuillez configurer SUPABASE_URL et AUTHORIZATION_KEY avant de lancer les tests.');
  process.exit(1);
} else {
  // Lancer les tests
  runAllTests().catch(console.error);
}
