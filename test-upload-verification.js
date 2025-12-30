/**
 * Script de vérification des uploads - Nouvelle Session
 * 
 * Ce script vérifie que toutes les insertions dans la table 'documents'
 * respectent les règles établies [cite: 2025-12-27]
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des modifications de la nouvelle session...\n');

// Lire le fichier Library.tsx
const libraryPath = path.join(__dirname, 'src', 'pages', 'Library.tsx');
const libraryContent = fs.readFileSync(libraryPath, 'utf8');

// Lire le fichier supabase.ts
const supabasePath = path.join(__dirname, 'src', 'lib', 'supabase.ts');
const supabaseContent = fs.readFileSync(supabasePath, 'utf8');

let allChecksPass = true;

// ========================================
// TEST 1 : user_id avec fallback à null
// ========================================
console.log('📋 Test 1 : Vérification de user_id avec fallback à null');

const userIdPattern = /user_id:\s*user\?\.\id\s*\|\|\s*null/g;
const userIdMatches = libraryContent.match(userIdPattern);

if (userIdMatches && userIdMatches.length >= 2) {
  console.log(`✅ PASS : ${userIdMatches.length} occurrences de 'user?.id || null' trouvées`);
  userIdMatches.forEach((match, index) => {
    console.log(`   ${index + 1}. ${match}`);
  });
} else {
  console.log('❌ FAIL : Pas assez d\'occurrences de user?.id || null');
  allChecksPass = false;
}

// Vérifier qu'il n'y a pas de user.id sans fallback dans les insertions
const badUserIdPattern = /user_id:\s*user\.id(?!\s*\|\|)/g;
const badMatches = libraryContent.match(badUserIdPattern);

if (badMatches) {
  console.log('⚠️  WARNING : Occurrences de user.id sans fallback trouvées :');
  badMatches.forEach((match, index) => {
    console.log(`   ${index + 1}. ${match}`);
  });
  allChecksPass = false;
} else {
  console.log('✅ PASS : Aucun user.id sans fallback détecté');
}

console.log('');

// ========================================
// TEST 2 : storage_path utilise uploadData.path
// ========================================
console.log('📋 Test 2 : Vérification que storage_path utilise le chemin retourné par Storage');

// Dans handleFileUpload
if (libraryContent.includes('storage_path: uploadData.path')) {
  console.log('✅ PASS : handleFileUpload utilise uploadData.path');
} else {
  console.log('❌ FAIL : handleFileUpload n\'utilise pas uploadData.path');
  allChecksPass = false;
}

// Dans handlePdfUpload (via result.data.path)
if (libraryContent.includes('storage_path: result.data?.path')) {
  console.log('✅ PASS : handlePdfUpload utilise result.data?.path');
} else {
  console.log('❌ FAIL : handlePdfUpload n\'utilise pas result.data?.path');
  allChecksPass = false;
}

console.log('');

// ========================================
// TEST 3 : uploadFile retourne data.path
// ========================================
console.log('📋 Test 3 : Vérification que uploadFile retourne data.path');

if (supabaseContent.includes('path: data.path,') && 
    supabaseContent.includes('Retourner le chemin exact de Storage')) {
  console.log('✅ PASS : uploadFile retourne data.path avec commentaire explicatif');
} else {
  console.log('❌ FAIL : uploadFile ne retourne pas correctement data.path');
  allChecksPass = false;
}

console.log('');

// ========================================
// TEST 4 : Ordre d'exécution (Upload → Insert)
// ========================================
console.log('📋 Test 4 : Vérification de l\'ordre d\'exécution');

// Vérifier que dans handleFileUpload, l'upload est avant l'insertion
const handleFileUploadMatch = libraryContent.match(
  /const handleFileUpload[\s\S]*?upload\(safePath[\s\S]*?\.from\('documents'\)[\s\S]*?\.insert\(/
);

if (handleFileUploadMatch) {
  console.log('✅ PASS : handleFileUpload fait Upload → puis Insert');
} else {
  console.log('❌ FAIL : L\'ordre n\'est pas respecté dans handleFileUpload');
  allChecksPass = false;
}

console.log('');

// ========================================
// TEST 5 : Commentaires [cite: 2025-12-27]
// ========================================
console.log('📋 Test 5 : Vérification des commentaires [cite: 2025-12-27]');

const citationPattern = /\[cite:\s*2025-12-27\]/g;
const citationMatches = (libraryContent.match(citationPattern) || []).length + 
                        (supabaseContent.match(citationPattern) || []).length;

if (citationMatches >= 10) {
  console.log(`✅ PASS : ${citationMatches} références [cite: 2025-12-27] trouvées`);
} else {
  console.log(`⚠️  WARNING : Seulement ${citationMatches} références [cite: 2025-12-27] trouvées`);
}

console.log('');

// ========================================
// TEST 6 : Logs de débogage
// ========================================
console.log('📋 Test 6 : Vérification des logs de débogage');

const debugLogs = [
  'Storage path original (envoyé)',
  'Storage path en BDD (normalisé par trigger)',
  'Le trigger SQL va normaliser storage_path automatiquement'
];

let logsFound = 0;
debugLogs.forEach(log => {
  if (libraryContent.includes(log)) {
    logsFound++;
    console.log(`✅ Log trouvé : "${log}"`);
  } else {
    console.log(`❌ Log manquant : "${log}"`);
  }
});

if (logsFound === debugLogs.length) {
  console.log('✅ PASS : Tous les logs de débogage sont présents');
} else {
  console.log(`⚠️  WARNING : ${logsFound}/${debugLogs.length} logs trouvés`);
}

console.log('');

// ========================================
// TEST 7 : generateUniqueFileName est utilisé
// ========================================
console.log('📋 Test 7 : Vérification de l\'utilisation de generateUniqueFileName');

if (libraryContent.includes('import { generateUniqueFileName') &&
    libraryContent.includes('const safePath = generateUniqueFileName(file.name)')) {
  console.log('✅ PASS : generateUniqueFileName est importé et utilisé');
} else {
  console.log('❌ FAIL : generateUniqueFileName n\'est pas correctement utilisé');
  allChecksPass = false;
}

console.log('');

// ========================================
// RÉSULTAT FINAL
// ========================================
console.log('═══════════════════════════════════════════════════════');
if (allChecksPass) {
  console.log('✅ TOUS LES TESTS CRITIQUES SONT PASSÉS ! 🎉');
  console.log('La nouvelle session respecte toutes les mises à jour [cite: 2025-12-27]');
} else {
  console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
  console.log('Veuillez vérifier les erreurs ci-dessus');
}
console.log('═══════════════════════════════════════════════════════');

process.exit(allChecksPass ? 0 : 1);

