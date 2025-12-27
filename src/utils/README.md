# Utilitaires de Gestion de Fichiers

Ce module contient les utilitaires pour gérer les noms de fichiers de manière sûre avec Supabase Storage.

## 🔴 Règle Critique

**Les noms de fichiers originaux ne doivent JAMAIS servir de clé (path) pour Supabase Storage.**

Les accents et caractères spéciaux causent des erreurs `Invalid key`.

## Utilisation

### Upload de fichiers vers Supabase Storage

```typescript
import { generateUniqueFileName, getFileType } from './utils/fileUtils';

// Générer un chemin sûr
const safePath = generateUniqueFileName(file.name);
const fileType = getFileType(file.name);

// Upload avec le chemin sûr
const { data, error } = await supabase.storage
  .from('documents')
  .upload(safePath, file);

// Enregistrer avec le nom original en BDD
await supabase.from('documents').insert({
  name: file.name,           // Nom original pour l'affichage
  storage_path: data.path,   // Chemin nettoyé
  file_type: fileType
});
```

## API

### `generateUniqueFileName(fileName: string): string`

Génère un nom de fichier unique et sûr pour Supabase Storage.

**Format :** `timestamp-random-nom-nettoyé.extension`

```typescript
generateUniqueFileName("Mon Document Été 2024.pdf")
// Returns: "1735245678901-abc123-mon-document-ete-2024.pdf"
```

### `cleanFileName(fileName: string): string`

Nettoie un nom de fichier sans ajouter de timestamp.

```typescript
cleanFileName("Mon Document (Été 2024).pdf")
// Returns: "mon-document-ete-2024.pdf"
```

### `getFileType(fileName: string): FileType`

Détermine le type de fichier basé sur l'extension.

```typescript
getFileType("document.pdf")    // 'pdf'
getFileType("image.jpg")       // 'image'
getFileType("video.mp4")       // 'video'
```

**Types retournés :** `'pdf' | 'docx' | 'txt' | 'image' | 'video' | 'audio' | 'url'`

### `isFileNameSafe(fileName: string): boolean`

Vérifie si un nom de fichier est déjà sûr pour Supabase Storage.

```typescript
isFileNameSafe("mon-document.pdf")    // true
isFileNameSafe("Mon Document.pdf")    // false (espace et majuscule)
```

### `getFileExtension(fileName: string): string`

Extrait l'extension d'un fichier (avec le point).

```typescript
getFileExtension("document.pdf")    // ".pdf"
getFileExtension("image.jpg")       // ".jpg"
```

## Transformations appliquées

| Transformation | Exemple |
|----------------|---------|
| Suppression des accents | `Été` → `ete` |
| Espaces → tirets | `Mon Document` → `mon-document` |
| Caractères spéciaux → tirets | `Doc #1 & (v2)` → `doc-1-v2` |
| Conversion en minuscules | `Document.PDF` → `document.pdf` |
| Tirets multiples → simple | `doc---final` → `doc-final` |

## Exemples complets

### Exemple 1 : Upload simple

```typescript
import { generateUniqueFileName } from './utils/fileUtils';

async function uploadDocument(file: File) {
  const safePath = generateUniqueFileName(file.name);
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(safePath, file);
    
  if (error) throw error;
  
  return data.path;
}
```

### Exemple 2 : Upload multiple avec gestion d'erreurs

```typescript
import { generateUniqueFileName, getFileType } from './utils/fileUtils';

async function uploadMultipleDocuments(files: FileList, userId: string) {
  const results = [];
  
  for (const file of Array.from(files)) {
    try {
      // Générer un chemin sûr
      const safePath = generateUniqueFileName(file.name);
      const fileType = getFileType(file.name);
      
      // Upload vers Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(safePath, file);
        
      if (uploadError) throw uploadError;
      
      // Enregistrer en BDD avec le nom original
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          storage_path: uploadData.path,
          user_id: userId,
          file_type: fileType
        })
        .select()
        .single();
        
      if (dbError) {
        // Nettoyer le fichier uploadé en cas d'erreur BDD
        await supabase.storage.from('documents').remove([uploadData.path]);
        throw dbError;
      }
      
      results.push({ success: true, document: docData });
      
      // Délai pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      results.push({ 
        success: false, 
        fileName: file.name, 
        error: error.message 
      });
    }
  }
  
  return results;
}
```

## Tests recommandés

Testez toujours avec ces noms de fichiers problématiques :

1. `Mon Document Été 2024.pdf` (espaces + accents)
2. `Virologie_Général.pdf` (underscore + accent)
3. `Cours #1 & Notes (v2).pdf` (caractères spéciaux)
4. `TD-Immuno.2023[final].pdf` (tirets, points, crochets)

Tous doivent s'uploader sans erreur `Invalid key`.

## Voir aussi

- [Documentation complète](../docs/REGLES_FICHIERS.md)
- [Règles Cursor](.cursorrules)

