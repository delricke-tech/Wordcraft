# 🚨 RÈGLE CRITIQUE : UUID pour Supabase Storage

**Date** : 6 janvier 2025  
**Priorité** : 🔴 **CRITIQUE**  
**Concerne** : Tous les uploads vers Supabase Storage

---

## ⚠️ Problème : Invalid Key

Les noms de fichiers avec **accents**, **espaces** ou **caractères spéciaux** causent l'erreur :

```
Invalid key
```

### Exemples de noms problématiques :

| Nom Original | Problème |
|-------------|----------|
| `Mon Document Été 2024.pdf` | Espaces + accents (É, é) |
| `Virologie_Général #1.pdf` | Accent (é) + caractère spécial (#) |
| `Cours (partie 1) & notes.pdf` | Parenthèses + & |
| `Données_2025.xlsx` | Accent (é) |

---

## ✅ Solution : Utiliser des UUID

### Règle d'Or

**Pour TOUT upload vers Supabase Storage, utilisez un UUID comme clé (path), JAMAIS le nom original.**

---

## 📝 Implémentation Correcte

### 1. Importer les utilitaires

```typescript
import { generateUniqueFileName, getFileType } from '../utils/fileUtils';
```

### 2. Générer un chemin sûr

```typescript
const safePath = generateUniqueFileName(file.name);
// Exemple: "1735245678901-abc123-mon-document-ete-2024.pdf"
```

### 3. Upload avec le chemin sûr

```typescript
// ✅ BON
const { data, error } = await supabase.storage
  .from('documents')
  .upload(safePath, file);
```

```typescript
// ❌ MAUVAIS - NE JAMAIS FAIRE
const { data, error } = await supabase.storage
  .from('documents')
  .upload(file.name, file);  // ❌ Causera "Invalid key"
```

### 4. Enregistrer en base de données

```typescript
await supabase.from('documents').insert({
  name: file.name,           // ✅ Nom original pour l'affichage
  storage_path: safePath,    // ✅ Chemin nettoyé pour Storage
  file_type: getFileType(file.name)
});
```

---

## 🔧 Fonctions Utilitaires Disponibles

Fichier : `src/utils/fileUtils.ts`

### 1. `generateUniqueFileName(fileName)`

**Utilisation principale** : Générer un chemin sûr pour l'upload.

```typescript
const safePath = generateUniqueFileName('Mon Document Été.pdf');
// Retourne: "1735245678901-abc123-mon-document-ete.pdf"
```

**Caractéristiques** :
- ✅ Timestamp unique (évite les collisions)
- ✅ UUID court (6 caractères)
- ✅ Supprime les accents
- ✅ Remplace les espaces par des tirets
- ✅ Supprime les caractères spéciaux
- ✅ Préserve l'extension

### 2. `cleanFileName(fileName)`

Nettoie un nom sans ajouter de timestamp.

```typescript
const cleanName = cleanFileName('Mon Document #1.pdf');
// Retourne: "mon-document-1.pdf"
```

### 3. `getFileType(fileName)`

Détermine le type de fichier.

```typescript
const type = getFileType('document.pdf');
// Retourne: 'pdf'
```

Options : `'pdf' | 'docx' | 'pptx' | 'xlsx' | 'txt' | 'image' | 'video' | 'audio' | 'url'`

### 4. `isFileNameSafe(fileName)`

Vérifie si un nom est déjà sûr.

```typescript
if (!isFileNameSafe(fileName)) {
  fileName = cleanFileName(fileName);
}
```

### 5. `getFileExtension(fileName)`

Extrait l'extension d'un fichier.

```typescript
const ext = getFileExtension('document.pdf');
// Retourne: ".pdf"
```

---

## 📋 Checklist Upload

Avant **TOUT** upload vers Supabase Storage :

- [ ] ✅ Importer `generateUniqueFileName`
- [ ] ✅ Générer le chemin sûr : `const safePath = generateUniqueFileName(file.name)`
- [ ] ✅ Uploader avec `safePath`, PAS `file.name`
- [ ] ✅ Enregistrer le nom original en BDD dans `name`
- [ ] ✅ Enregistrer le chemin sûr en BDD dans `storage_path`
- [ ] ✅ Tester avec des noms contenant : accents, espaces, #, &, parenthèses

---

## ❌ Code à Éviter

### 1. Upload direct avec nom original

```typescript
// ❌ MAUVAIS
await supabase.storage
  .from('documents')
  .upload(file.name, file);
```

### 2. Nettoyage manuel incomplet

```typescript
// ❌ MAUVAIS - Ne supprime pas les accents
const safeName = file.name.replace(' ', '-');
await supabase.storage
  .from('documents')
  .upload(safeName, file);
```

### 3. Oublier de conserver le nom original

```typescript
// ❌ MAUVAIS - L'utilisateur verra le nom nettoyé
await supabase.from('documents').insert({
  name: safePath  // ❌ Mauvais : "1735245678901-abc123-..."
});
```

---

## ✅ Code Correct

### Exemple complet

```typescript
import { generateUniqueFileName, getFileType } from '../utils/fileUtils';
import { supabase } from '../lib/supabase';

async function uploadDocument(file: File) {
  try {
    // 1. Générer un chemin sûr
    const safePath = generateUniqueFileName(file.name);
    const fileType = getFileType(file.name);
    
    console.log('📤 Upload en cours...');
    console.log(`Nom original: ${file.name}`);
    console.log(`Chemin sûr: ${safePath}`);
    
    // 2. Upload vers Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(safePath, file);
    
    if (storageError) {
      throw storageError;
    }
    
    console.log('✅ Upload réussi:', storageData.path);
    
    // 3. Enregistrer en base de données
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert({
        name: file.name,                // ✅ Nom original
        storage_path: storageData.path, // ✅ Chemin sûr
        file_type: fileType,
        file_size: file.size,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (dbError) {
      // Nettoyer le Storage en cas d'erreur BDD
      await supabase.storage
        .from('documents')
        .remove([storageData.path]);
      
      throw dbError;
    }
    
    console.log('✅ Document enregistré:', dbData.id);
    
    return dbData;
    
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    throw error;
  }
}

// Utilisation
const file = /* File object */;
await uploadDocument(file);
```

---

## 🔍 Récupération des Fichiers

### 1. Obtenir l'URL publique

```typescript
// Utiliser storage_path, PAS name
const { data } = supabase.storage
  .from('documents')
  .getPublicUrl(document.storage_path);

console.log('URL:', data.publicUrl);
```

### 2. Afficher le nom original

```typescript
// Utiliser name pour l'affichage à l'utilisateur
<a href={publicUrl} download={document.name}>
  {document.name}  {/* ✅ Nom original */}
</a>
```

---

## 📊 Structure en Base de Données

### Table `documents`

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,              -- ✅ Nom original (pour affichage)
  storage_path text NOT NULL,      -- ✅ Chemin sûr (pour Storage API)
  file_type text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_documents_storage_path ON documents(storage_path);
CREATE INDEX idx_documents_user_id ON documents(user_id);
```

---

## 🧪 Tests

### Test avec noms problématiques

```typescript
const testFiles = [
  'Mon Document Été 2024.pdf',
  'Virologie_Général #1.pdf',
  'Cours (partie 1) & notes.pdf',
  'Données_2025.xlsx',
  'Présentation été.pptx'
];

for (const fileName of testFiles) {
  const safePath = generateUniqueFileName(fileName);
  console.log(`${fileName} → ${safePath}`);
  
  // Test upload
  const testFile = new File(['test'], fileName, { type: 'application/pdf' });
  await uploadDocument(testFile);
}
```

**Résultat attendu** : Tous les uploads réussissent sans erreur `Invalid key`.

---

## 🎯 Avantages de cette Approche

### 1. 🔒 Sécurité

- ✅ Pas d'erreur `Invalid key`
- ✅ Noms de fichiers prévisibles
- ✅ Pas d'injection de caractères malveillants

### 2. 🌍 Internationalisation

- ✅ Support de tous les accents (français, espagnol, etc.)
- ✅ Support de tous les alphabets (cyrillique, arabe, chinois, etc.)
- ✅ Pas de limitation linguistique

### 3. ⚡ Performance

- ✅ Index efficaces sur `storage_path`
- ✅ Pas de normalisation à la volée
- ✅ Recherche rapide

### 4. 🎨 UX

- ✅ L'utilisateur voit toujours le nom original
- ✅ Téléchargement avec le bon nom
- ✅ Recherche par nom original possible

---

## 📚 Ressources

### Fichiers concernés

- ✅ `src/utils/fileUtils.ts` - Utilitaires
- ✅ `src/pages/Documents.tsx` - Exemple d'upload
- ✅ `src/pages/AIAssistant.tsx` - Upload de documents pour l'IA
- ✅ Toute autre page avec upload de fichiers

### Documentation Supabase

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Upload Files](https://supabase.com/docs/guides/storage/uploads/standard-uploads)

---

## 🚨 Rappel Final

### RÈGLE ABSOLUE

**JAMAIS utiliser `file.name` directement comme clé pour Supabase Storage.**

**TOUJOURS utiliser `generateUniqueFileName(file.name)`.**

---

**Date** : 6 janvier 2025  
**Statut** : ✅ **RÈGLE EN VIGUEUR**

---

💡 **Cette règle est déjà implémentée dans le projet. Ne JAMAIS contourner cette sécurité.**
