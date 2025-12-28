# 🔧 Diagnostic : Lecteur PDF Ne S'Affiche Pas

## ✅ Vérifications Effectuées

J'ai analysé votre code et voici ce que j'ai trouvé :

### 1. ✅ URL Signée : **BON**
Le code utilise bien `createSignedUrl()` à la ligne 60-62 de `PDFViewer.tsx` :
```typescript
const { data: signedUrlData, error: signedUrlError } = await supabase.storage
  .from('documents')
  .createSignedUrl(storagePath, 3600); // ✅ Correct
```

### 2. ✅ Règle des Noms : **BON**
Le code utilise bien `storagePath` (nom nettoyé) et non `documentName` :
- Ligne 41 : `console.log('  - Storage path:', storagePath);`
- Ligne 49 : `.getPublicUrl(storagePath)` ✅
- Ligne 62 : `.createSignedUrl(storagePath, 3600)` ✅

### 3. ⚠️ Problème Identifié : **Logique de Fallback**

Le code essaie d'abord `getPublicUrl()` qui **retourne toujours une URL**, même si le bucket est privé. Mais cette URL ne fonctionnera pas si le bucket nécessite une authentification.

---

## 🔨 Solution : Code Corrigé

J'ai amélioré la logique pour forcer l'utilisation d'URLs signées de manière plus robuste.

---

## 🌐 Configuration CORS pour Supabase

Si vous voyez une erreur CORS dans la console, voici la configuration à ajouter :

### Dans Supabase Dashboard :

1. Allez dans **Storage** → **Cliquez sur votre bucket "documents"**
2. Cliquez sur **Settings** (roue dentée)
3. Section **CORS Configuration**
4. Collez cette configuration JSON :

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

**Pour la production** (plus sécurisé), remplacez `"*"` par votre domaine :

```json
[
  {
    "allowedOrigins": ["http://localhost:5173", "https://votre-domaine.com"],
    "allowedMethods": ["GET", "HEAD"],
    "allowedHeaders": ["authorization", "x-client-info", "apikey", "content-type"],
    "maxAge": 3600
  }
]
```

---

## 🔍 Checklist de Diagnostic

Ouvrez la **console du navigateur (F12)** et vérifiez :

### Étape 1 : Logs du chargement

Vous devriez voir :
```javascript
📄 Chargement du document: abc-123-def-456
✅ Document chargé: {
  id: "abc-123",
  name: "Mon Document.pdf",
  storage_path: "1735245678901-abc123-mon-document.pdf",
  file_type: "pdf"
}
```

**❌ Si `storage_path` est `null` ou `undefined`** :
- La colonne `storage_path` n'existe pas en BDD
- Exécutez la migration SQL : `supabase/migrations/20251228_fix_documents_columns.sql`

---

### Étape 2 : Génération de l'URL

Vous devriez voir :
```javascript
📄 ===== CHARGEMENT PDF =====
  - Document ID: abc-123
  - Nom affiché: Mon Document.pdf
  - Storage path: 1735245678901-abc123-mon-document.pdf
✅ URL signée générée (valide 1h)
```

**❌ Si vous voyez une erreur** :
```javascript
❌ Erreur lors de la génération de l'URL signée: { message: "..." }
```

Causes possibles :
1. Le fichier n'existe pas dans Storage
2. RLS policy trop restrictive
3. Bucket privé sans permissions

---

### Étape 3 : Erreurs CORS

**❌ Si vous voyez dans la console** :
```
Access to fetch at 'https://...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution** : Appliquez la configuration CORS ci-dessus.

---

### Étape 4 : iframe bloquée

**❌ Si vous voyez** :
```
Refused to display '...' in a frame because it set 'X-Frame-Options' to 'deny'
```

**Cause** : Supabase ou le navigateur bloque l'affichage en iframe.

**Solution** : Utiliser `window.open()` au lieu d'iframe (voir code alternatif ci-dessous).

---

## 🔄 Code Alternatif (Si iframe ne fonctionne pas)

Si l'iframe est bloquée, utilisez cette version qui ouvre le PDF dans un nouvel onglet :

```typescript
// Remplacer l'iframe par un bouton d'ouverture
{!loading && !error && pdfUrl && (
  <div className="flex flex-col items-center gap-4">
    <div className="text-center">
      <p className="text-lg text-gray-300 mb-4">
        Votre PDF est prêt à être visualisé
      </p>
      <button
        onClick={() => window.open(pdfUrl, '_blank')}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Eye size={20} />
        Ouvrir le PDF dans un nouvel onglet
      </button>
    </div>
  </div>
)}
```

---

## 📊 Vérification Base de Données

### Commande SQL à exécuter dans Supabase :

```sql
-- Vérifier qu'un document a bien storage_path
SELECT 
  id, 
  name, 
  storage_path, 
  file_type,
  created_at
FROM documents
WHERE file_type = 'pdf'
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu** :
```
id        | name              | storage_path                        | file_type
----------|-------------------|-------------------------------------|----------
abc-123   | Mon Document.pdf  | 1735245678901-abc123-mon-document.pdf | pdf
```

**❌ Si `storage_path` est `NULL`** :
- La colonne n'existe pas ou n'est pas remplie
- Exécutez la migration SQL
- Re-uploadez les fichiers

---

## 🔐 Vérification Supabase Storage

### 1. Vérifier que le fichier existe

1. Allez dans **Supabase Dashboard** → **Storage** → **documents**
2. Cherchez le fichier avec le nom technique (ex: `1735245678901-abc123-mon-document.pdf`)
3. ✅ Si le fichier est là, c'est bon
4. ❌ Si le fichier n'existe pas, re-uploadez-le

### 2. Vérifier les permissions du bucket

**Storage** → **documents** → **Settings** :

- **Public bucket** : Activé = URLs publiques (plus simple, moins sécurisé)
- **Public bucket** : Désactivé = URLs signées (plus sécurisé, nécessite RLS)

**Si le bucket est privé**, configurez les RLS policies :

```sql
-- Policy pour lire ses propres fichiers
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🧪 Test de Diagnostic Complet

### Script de test à coller dans la console :

```javascript
// Test 1 : Vérifier que Supabase est connecté
console.log('🔍 Test Supabase:', window.location.origin);

// Test 2 : Tester la génération d'URL signée
const testStoragePath = "VOTRE_STORAGE_PATH_ICI"; // Remplacez par un vrai path
const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl(testStoragePath, 60);

if (error) {
  console.error('❌ Erreur:', error);
} else {
  console.log('✅ URL générée:', data.signedUrl);
  // Testez l'URL dans un nouvel onglet
  window.open(data.signedUrl, '_blank');
}
```

---

## 📋 Checklist de Résolution

Cochez au fur et à mesure :

- [ ] Colonne `storage_path` existe en BDD (requête SQL ci-dessus)
- [ ] Les documents ont bien un `storage_path` rempli
- [ ] Le fichier physique existe dans Supabase Storage
- [ ] Configuration CORS appliquée (si erreur CORS)
- [ ] Aucune erreur dans la console (F12)
- [ ] Les logs montrent "✅ URL signée générée"
- [ ] L'URL signée fonctionne dans un nouvel onglet (test ci-dessus)

---

## 🚨 Erreurs Fréquentes & Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `storage_path is null` | Colonne manquante ou vide | Exécuter migration SQL |
| `Invalid key` | Utilisation de `name` au lieu de `storage_path` | Code déjà corrigé ✅ |
| `CORS policy` | Configuration CORS manquante | Ajouter config JSON ci-dessus |
| `X-Frame-Options` | iframe bloquée | Utiliser `window.open()` |
| `File not found` | Fichier absent du Storage | Re-uploader le fichier |
| `Unauthorized` | RLS policy trop stricte | Configurer les policies |

---

## 💡 Prochaines Étapes

1. **Ouvrez la console (F12)** et vérifiez les logs
2. **Notez les erreurs** que vous voyez
3. **Appliquez la solution** correspondante ci-dessus
4. **Testez à nouveau**

Si le problème persiste, partagez-moi les messages d'erreur de la console et je vous aiderai davantage.

---

**Date :** 28 décembre 2024  
**Statut :** Guide de diagnostic complet

