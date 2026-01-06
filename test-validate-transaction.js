/**
 * Script de test pour validate-transaction Edge Function
 * Date: 5 janvier 2025
 * 
 * Usage: node test-validate-transaction.js
 */

const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SECRET_KEY = 'votre-cle-secrete';

// ============================================
// EXEMPLES DE SMS RÉELS
// ============================================

const SMS_EXAMPLES = [
  // Airtel Money - Format 1
  {
    message: 'Paiement réussi ! Montant : 5000 FCFA. TID: AMP1234567890. Date : 05/01/2025 10:30. Merci d\'utiliser Airtel Money',
    from: 'AirtelMoney',
    description: 'Airtel Money - Format standard'
  },
  
  // Airtel Money - Format 2
  {
    message: 'Your payment of 5000 CFA has been confirmed. Transaction ID: AIRT987654321. Thank you.',
    from: 'Airtel',
    description: 'Airtel Money - Format anglais'
  },
  
  // Airtel Money - Format 3
  {
    message: 'Confirmation paiement\n5000 F CFA\nCode: AIR2024ABC123\nMerci!',
    from: 'AirtelMoney',
    description: 'Airtel Money - Avec retours à la ligne'
  },
  
  // Moov Money - Format 1
  {
    message: 'Paiement confirmé. Montant: 5000 FCFA. Ref: MOV1234567890. Date: 05/01/2025. Service: WordCraft',
    from: 'MoovMoney',
    description: 'Moov Money - Format standard'
  },
  
  // Moov Money - Format 2
  {
    message: 'Transaction réussie\n5000 F CFA\nReference: MOOV123ABC456\nMerci de votre confiance',
    from: 'Moov',
    description: 'Moov Money - Avec retours à la ligne'
  },
  
  // Libertis - Format 1
  {
    message: 'Libertis Money\nPaiement: 5000 FCFA\nRef: LIB9876543210\nMerci!',
    from: 'Libertis',
    description: 'Libertis - Format compact'
  },
  
  // Test - TID invalide
  {
    message: 'Paiement confirme sans code',
    from: 'AirtelMoney',
    description: '❌ Test erreur - Pas de TID'
  },
  
  // Test - Opérateur inconnu
  {
    message: 'TID: ABC123456789',
    from: 'OperateurInconnu',
    description: '❌ Test erreur - Opérateur non reconnu'
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
  console.log(`Message: ${smsData.message.substring(0, 80)}${smsData.message.length > 80 ? '...' : ''}`);
  console.log('');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': SECRET_KEY
      },
      body: JSON.stringify({
        message: smsData.message,
        from: smsData.from
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCÈS');
      console.log(`Status: ${response.status}`);
      console.log(`Payment ID: ${result.payment_id}`);
      console.log(`TID: ${result.tid}`);
      console.log(`Opérateur: ${result.operator}`);
      console.log(`Montant: ${result.amount} FCFA`);
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

async function testWithoutSecretKey() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔐 TEST SÉCURITÉ: Sans clé secrète`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Pas de x-secret-key
      },
      body: JSON.stringify({
        message: 'TID: ABC123',
        from: 'AirtelMoney'
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
        'x-secret-key': SECRET_KEY
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
    { message: 'TID: ABC123' }, // Manque 'from'
    { from: 'AirtelMoney' }, // Manque 'message'
    {} // Tout manque
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    console.log(`\nTest ${i + 1}:`, JSON.stringify(testCases[i]));
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': SECRET_KEY
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

// ============================================
// EXECUTION DES TESTS
// ============================================

async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║           TEST SUITE - validate-transaction Edge Function                 ║
║                                                                            ║
║  Date: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}                                                    ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
  
  console.log(`🔗 URL: ${SUPABASE_URL}/functions/v1/validate-transaction`);
  console.log(`🔑 Secret Key: ${SECRET_KEY.substring(0, 10)}...`);
  
  // Test 1: Validation SMS
  console.log(`\n\n┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│  SECTION 1: Tests de Validation SMS                            │`);
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
  
  await testWithoutSecretKey();
  
  // Test 3: Format
  console.log(`\n\n┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│  SECTION 3: Tests de Format                                    │`);
  console.log(`└─────────────────────────────────────────────────────────────────┘`);
  
  await testMalformedJson();
  await testMissingFields();
  
  // Résumé
  console.log(`\n\n╔════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                         FIN DES TESTS                                      ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════╝\n`);
  
  console.log(`
📋 RÉSUMÉ:
  - ${SMS_EXAMPLES.length} tests de validation SMS
  - 1 test de sécurité
  - 2 tests de format
  
💡 PROCHAINES ÉTAPES:
  1. Vérifier les logs dans Supabase Dashboard
  2. Créer des paiements de test dans la base
  3. Tester avec de vrais SMS sur Android
  4. Déployer en production
  
📚 DOCUMENTATION: GUIDE_EDGE_FUNCTION_SMS.md
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

2. SECRET_KEY: Votre clé secrète configurée dans Supabase
   Même valeur que SMS_SECRET_KEY dans Edge Functions → Secrets

Puis relancez: node test-validate-transaction.js
`);

// Vérifier si la config est valide
if (SUPABASE_URL.includes('votre-projet') || SECRET_KEY === 'votre-cle-secrete') {
  console.log('❌ Veuillez configurer SUPABASE_URL et SECRET_KEY avant de lancer les tests.');
  process.exit(1);
} else {
  // Lancer les tests
  runAllTests().catch(console.error);
}
