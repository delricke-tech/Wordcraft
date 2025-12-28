# 🧪 Script de Test Rapide : Lecteur PDF

## 📋 Instructions

Copiez-collez ces scripts dans la **console du navigateur (F12)** pour diagnostiquer rapidement les problèmes.

---

## Test 1 : Vérifier la Connexion Supabase

```javascript
// Test de base
console.log('🔍 ===== TEST CONNEXION SUPABASE =====');
console.log('URL de l\'app:', window.location.origin);
console.log('Supabase importé:', typeof supabase !== 'undefined' ? '✅' : '❌');

// Si supabase n'est pas défini, importez-le
import { supabase } from './src/lib/supabase';
```

---

## Test 2 : Lister les Documents PDF

```javascript
// Récupérer les 5 derniers PDFs
console.log('🔍 ===== TEST DOCUMENTS PDF =====');

const { data: docs, error } = await supabase
  .from('documents')
  .select('id, name, storage_path, file_type')
  .eq('file_type', 'pdf')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('❌ Erreur:', error);
} else {
  console.log('✅ Documents trouvés:', docs.length);
  docs.forEach((doc, i) => {
    console.log(`\n📄 Document ${i + 1}:`);
    console.log('  - ID:', doc.id);
    console.log('  - Nom:', doc.name);
    console.log('  - Storage path:', doc.storage_path);
    console.log('  - storage_path vide?', !doc.storage_path ? '❌ OUI (PROBLÈME)' : '✅ NON');
  });
}
```

**Résultat attendu** :
```
✅ Documents trouvés: 3
📄 Document 1:
  - ID: abc-123
  - Nom: Mon Document.pdf
  - Storage path: 1735245678901-abc123-mon-document.pdf
  - storage_path vide? ✅ NON
```

**❌ Si `storage_path` est vide** :
- Exécutez la migration SQL : `20251228_fix_documents_columns.sql`

---

## Test 3 : Vérifier qu'un Fichier Existe dans Storage

```javascript
// REMPLACEZ par un vrai storage_path de vos documents
const testPath = "1735245678901-abc123-mon-document.pdf";

console.log('🔍 ===== TEST FICHIER STORAGE =====');
console.log('Path testé:', testPath);

// Tester l'existence avec download (sans vraiment télécharger)
const { data, error } = await supabase.storage
  .from('documents')
  .download(testPath);

if (error) {
  console.error('❌ Fichier introuvable ou erreur:', error.message);
} else {
  console.log('✅ Fichier existe !');
  console.log('  - Taille:', data.size, 'octets');
  console.log('  - Type:', data.type);
}
```

**Résultat attendu** :
```
✅ Fichier existe !
  - Taille: 245678 octets
  - Type: application/pdf
```

---

## Test 4 : Générer une URL Signée

```javascript
// REMPLACEZ par un vrai storage_path
const testPath = "1735245678901-abc123-mon-document.pdf";

console.log('🔍 ===== TEST URL SIGNÉE =====');
console.log('Path testé:', testPath);

const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl(testPath, 60); // Valide 60 secondes

if (error) {
  console.error('❌ Erreur génération URL signée:');
  console.error('  - Message:', error.message);
  console.error('  - Code:', error.statusCode);
} else {
  console.log('✅ URL signée générée avec succès !');
  console.log('  - URL:', data.signedUrl);
  console.log('  - Valide pendant: 60 secondes');
  console.log('\n🔗 Test dans un nouvel onglet...');
  window.open(data.signedUrl, '_blank');
}
```

**Résultat attendu** :
```
✅ URL signée générée avec succès !
  - URL: https://...supabase.co/storage/v1/object/sign/documents/...
  - Valide pendant: 60 secondes
```

Un nouvel onglet s'ouvre avec le PDF.

**❌ Si erreur** :
- Vérifier que le fichier existe (Test 3)
- Vérifier les permissions du bucket (RLS)

---

## Test 5 : Test Complet (Simulation du Lecteur)

```javascript
// REMPLACEZ par l'ID d'un vrai document PDF
const documentId = "VOTRE_DOCUMENT_ID_ICI";

console.log('🔍 ===== TEST COMPLET LECTEUR PDF =====');

// Étape 1 : Récupérer le document
console.log('Étape 1 : Récupération du document...');
const { data: doc, error: docError } = await supabase
  .from('documents')
  .select('id, name, storage_path, file_type')
  .eq('id', documentId)
  .single();

if (docError) {
  console.error('❌ Document non trouvé:', docError.message);
} else {
  console.log('✅ Document récupéré:');
  console.log('  - ID:', doc.id);
  console.log('  - Nom:', doc.name);
  console.log('  - Storage path:', doc.storage_path);
  
  // Étape 2 : Vérifier storage_path
  console.log('\nÉtape 2 : Vérification storage_path...');
  if (!doc.storage_path) {
    console.error('❌ storage_path est vide !');
    console.error('   → Exécutez la migration SQL');
  } else {
    console.log('✅ storage_path OK');
    
    // Étape 3 : Générer URL signée
    console.log('\nÉtape 3 : Génération URL signée...');
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 3600);
    
    if (urlError) {
      console.error('❌ Erreur URL signée:', urlError.message);
    } else {
      console.log('✅ URL signée générée !');
      console.log('  - URL (tronquée):', urlData.signedUrl.substring(0, 100) + '...');
      
      // Étape 4 : Tester l'ouverture
      console.log('\nÉtape 4 : Test d\'ouverture...');
      console.log('🔗 Ouverture dans un nouvel onglet...');
      window.open(urlData.signedUrl, '_blank');
      console.log('\n✅ Si le PDF s\'affiche, tout fonctionne ! 🎉');
    }
  }
}
```

---

## Test 6 : Vérifier les Permissions (RLS)

```javascript
console.log('🔍 ===== TEST PERMISSIONS RLS =====');

// Test lecture d'un fichier
const testPath = "VOTRE_STORAGE_PATH_ICI";

const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl(testPath, 60);

if (error) {
  if (error.message.includes('not allowed') || error.message.includes('policy')) {
    console.error('❌ PROBLÈME DE PERMISSIONS (RLS)');
    console.error('   → Le bucket est privé sans RLS policy');
    console.error('   → Solution: Configurer les RLS policies ou rendre le bucket public');
  } else {
    console.error('❌ Autre erreur:', error.message);
  }
} else {
  console.log('✅ Permissions OK');
}
```

---

## Test 7 : Vérifier CORS

```javascript
console.log('🔍 ===== TEST CORS =====');

const testPath = "VOTRE_STORAGE_PATH_ICI";

const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl(testPath, 60);

if (data) {
  console.log('Tentative de fetch avec CORS...');
  
  fetch(data.signedUrl, {
    method: 'HEAD', // Juste pour tester
  })
  .then(response => {
    console.log('✅ CORS OK - Aucune erreur');
    console.log('  - Status:', response.status);
  })
  .catch(err => {
    if (err.message.includes('CORS')) {
      console.error('❌ ERREUR CORS DÉTECTÉE');
      console.error('   → Appliquez la configuration CORS dans Supabase');
      console.error('   → Voir DIAGNOSTIC_LECTEUR_PDF.md pour la config JSON');
    } else {
      console.error('❌ Autre erreur:', err.message);
    }
  });
}
```

---

## 📊 Interprétation des Résultats

### ✅ Tous les tests passent
→ Le lecteur PDF devrait fonctionner parfaitement !

### ❌ Test 2 échoue (storage_path vide)
→ **Solution** : Exécuter la migration SQL
```sql
-- Dans Supabase SQL Editor
-- Fichier : supabase/migrations/20251228_fix_documents_columns.sql
```

### ❌ Test 3 échoue (fichier introuvable)
→ **Solution** : Re-uploader le fichier
- Le fichier a été supprimé du Storage
- Ou le chemin est incorrect

### ❌ Test 4 échoue (erreur URL signée)
→ **Solutions possibles** :
1. Bucket privé sans RLS policy → Configurer les policies
2. Fichier n'existe pas → Test 3
3. Permissions insuffisantes → Vérifier l'authentification

### ❌ Test 7 échoue (CORS)
→ **Solution** : Appliquer la configuration CORS
```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "HEAD"],
    "allowedHeaders": ["*"],
    "maxAge": 3600
  }
]
```

---

## 🎯 Raccourci : Test Complet en 1 Commande

```javascript
// Remplacez ces valeurs
const DOC_ID = "VOTRE_DOCUMENT_ID";

// Test automatique complet
(async () => {
  console.log('🚀 ===== TEST AUTOMATIQUE COMPLET =====\n');
  
  // 1. Document
  const { data: doc, error: e1 } = await supabase
    .from('documents')
    .select('*')
    .eq('id', DOC_ID)
    .single();
  
  console.log('1️⃣ Document:', doc ? '✅' : '❌', e1?.message || '');
  if (!doc) return;
  
  // 2. Storage path
  console.log('2️⃣ Storage path:', doc.storage_path ? '✅' : '❌');
  if (!doc.storage_path) {
    console.error('   ⚠️ Exécutez la migration SQL');
    return;
  }
  
  // 3. Fichier existe
  const { error: e2 } = await supabase.storage
    .from('documents')
    .download(doc.storage_path);
  console.log('3️⃣ Fichier existe:', !e2 ? '✅' : '❌', e2?.message || '');
  if (e2) return;
  
  // 4. URL signée
  const { data: url, error: e3 } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 60);
  console.log('4️⃣ URL signée:', url ? '✅' : '❌', e3?.message || '');
  
  if (url) {
    console.log('\n🎉 TOUS LES TESTS PASSENT !');
    console.log('🔗 Ouverture du PDF...');
    window.open(url.signedUrl, '_blank');
  }
})();
```

---

**Utilisez ces tests pour diagnostiquer rapidement les problèmes !** 🔧

**Date :** 28 décembre 2024

