# Règles Projet - Gestion des Fichiers

## ⚠️ RÈGLE CRITIQUE : Noms de Fichiers et Supabase Storage

**Les noms de fichiers originaux ne doivent JAMAIS servir de clé (path) pour Supabase Storage.**

### Pourquoi ?

Les accents et caractères spéciaux dans les noms de fichiers causent des erreurs `Invalid key` avec Supabase Storage :

❌ **Exemples qui échouent :**
- `Mon Document Été 2024.pdf` → Erreur : espaces et accent
- `Virologie_Général #1.pdf` → Erreur : accent, underscore, #
- `Cours (partie 1) & notes.pdf` → Erreur : parenthèses, &, espaces

### Solution Obligatoire

✅ **Toujours utiliser les utilitaires de `src/utils/fileUtils.ts`**

```typescript
import { generateUniqueFileName } from '../utils/fileUtils';

// Générer un chemin sûr pour Supabase Storage
const safePath = generateUniqueFileName(file.name);

// Upload avec le chemin sûr
await supabase.storage.from('documents').upload(safePath, file);

// Enregistrer avec le nom ORIGINAL en base de données
await supabase.from('documents').insert({
  name: file.name,           // ✅ Nom original pour l'affichage
  storage_path: safePath     // ✅ Chemin nettoyé pour Storage
});
```

### Transformations Appliquées

| Nom Original | Chemin Storage Généré |
|-------------|----------------------|
| `Mon Document Été 2024.pdf` | `1735245678901-abc123-mon-document-ete-2024.pdf` |
| `Virologie_Général #1.pdf` | `1735245678902-def456-virologie-general-1.pdf` |
| `Cours (partie 1) & notes.pdf` | `1735245678903-ghi789-cours-partie-1-notes.pdf` |

### Fonctions Disponibles

#### `cleanFileName(fileName: string): string`
Nettoie un nom de fichier pour le rendre compatible avec Supabase Storage.

```typescript
cleanFileName("Mon Document (Été 2024).pdf")
// Returns: "mon-document-ete-2024.pdf"
```

#### `generateUniqueFileName(fileName: string): string`
Génère un nom unique et sûr avec timestamp et chaîne aléatoire.

```typescript
generateUniqueFileName("Mon Document.pdf")
// Returns: "1735245678901-abc123-mon-document.pdf"
```

#### `isFileNameSafe(fileName: string): boolean`
Vérifie si un nom de fichier est déjà sûr.

```typescript
isFileNameSafe("mon-document.pdf")  // true
isFileNameSafe("Mon Document.pdf")  // false (espace et majuscule)
```

#### `getFileType(fileName: string)`
Détermine le type de fichier basé sur l'extension.

```typescript
getFileType("document.pdf")    // 'pdf'
getFileType("image.jpg")       // 'image'
getFileType("video.mp4")       // 'video'
```

### Checklist d'Implémentation

Lors de l'ajout d'une nouvelle fonctionnalité d'upload :

- [ ] Importer `generateUniqueFileName` depuis `src/utils/fileUtils`
- [ ] Générer un chemin sûr : `const safePath = generateUniqueFileName(file.name)`
- [ ] Uploader avec le chemin sûr : `supabase.storage.from('documents').upload(safePath, file)`
- [ ] Enregistrer le nom original en BDD : `name: file.name`
- [ ] Enregistrer le chemin sûr en BDD : `storage_path: safePath`
- [ ] Ajouter un délai de 200ms entre uploads multiples
- [ ] Tester avec des noms contenant accents, espaces, caractères spéciaux

### Fichiers Concernés

- ✅ `src/utils/fileUtils.ts` - Utilitaires de nettoyage (UTILISER TOUJOURS)
- ✅ `src/lib/supabase.ts` - Fonction `uploadFile` (utilise les utilitaires)
- ✅ `src/pages/Library.tsx` - `handleFileUpload` et `handlePdfUpload` (utilise les utilitaires)

### Erreurs Courantes à Éviter

❌ **NE JAMAIS FAIRE :**
```typescript
// MAUVAIS : Utiliser le nom original directement
await supabase.storage.from('documents').upload(file.name, file);

// MAUVAIS : Nettoyage manuel incomplet
const name = file.name.replace(' ', '-');
await supabase.storage.from('documents').upload(name, file);
```

✅ **TOUJOURS FAIRE :**
```typescript
// BON : Utiliser l'utilitaire
const safePath = generateUniqueFileName(file.name);
await supabase.storage.from('documents').upload(safePath, file);
```

### Tests Recommandés

Avant de merger du code d'upload, tester avec ces noms de fichiers :

1. `Mon Document Été 2024.pdf` (espaces + accents)
2. `Virologie_Général.pdf` (underscore + accent)
3. `Cours #1 & Notes (v2).pdf` (caractères spéciaux multiples)
4. `TD-Immuno.2023[final].pdf` (tirets, points, crochets)

Tous doivent s'uploader avec succès sans erreur `Invalid key`.

---

**Date de création :** 27 décembre 2024  
**Dernière mise à jour :** 27 décembre 2024  
**Statut :** ✅ Règle active et implémentée

