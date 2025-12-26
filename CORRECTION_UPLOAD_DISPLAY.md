# 🔧 Correction : Documents n'apparaissent pas après upload

## 🐛 Problème identifié

Les fichiers étaient bien uploadés dans Supabase Storage, mais n'apparaissaient pas dans la liste de la bibliothèque.

### Causes identifiées :

1. **Filtre trop restrictif** ❌
   - La requête filtrait par `folder_id = selectedFolder`
   - Quand `selectedFolder = null`, la requête cherchait `folder_id = null`
   - Cela excluait tous les documents uploadés sans dossier

2. **Manque de logs** ❌
   - Pas de logs détaillés pour diagnostiquer l'insertion en BDD
   - Impossible de savoir si l'erreur venait de l'upload ou de la récupération

3. **Pas d'option "Tous les documents"** ❌
   - Impossible de voir facilement tous les documents uploadés
   - Navigation limitée aux dossiers uniquement

---

## ✅ Solutions implémentées

### 1. Correction de la requête `fetchData()`

**Avant :**
```typescript
const [docsResult, foldersResult] = await Promise.all([
  supabase
    .from('documents')
    .select('*')
    .eq('folder_id', selectedFolder)  // ❌ Problème : filtre toujours actif
    .order('created_at', { ascending: false }),
  supabase.from('folders').select('*').order('name'),
]);
```

**Après :**
```typescript
let docsQuery = supabase
  .from('documents')
  .select('*')
  .order('created_at', { ascending: false });

// Option 1 : Afficher TOUS les documents
if (showAllDocuments) {
  console.log('📚 Récupération de TOUS les documents');
  // Pas de filtre
}
// Option 2 : Filtrer par dossier sélectionné
else if (selectedFolder !== null) {
  console.log('📁 Récupération des documents du dossier:', selectedFolder);
  docsQuery = docsQuery.eq('folder_id', selectedFolder);
}
// Option 3 : Documents sans dossier (par défaut)
else {
  console.log('📄 Récupération des documents sans dossier');
  docsQuery = docsQuery.is('folder_id', null);
}
```

### 2. Ajout de logs détaillés

#### Dans `handleFileUpload()` :

```typescript
// Avant l'insertion en BDD
console.log('💾 Tentative d\'enregistrement en BDD...', {
  user_id: user.id,
  title: file.name,
  file_type: fileType,
  file_size: file.size,
  mime_type: file.type,
  file_url: publicUrl,
  folder_id: selectedFolder,
  processing_status: 'completed',
});

// Après insertion réussie
console.log('✅ Document enregistré en BDD avec succès:', docData);

// En cas d'erreur
console.error('❌ Détails de l\'erreur:', {
  message: dbError.message,
  details: dbError.details,
  hint: dbError.hint,
  code: dbError.code,
});
```

#### Dans `fetchData()` :

```typescript
console.log('📚 Documents récupérés:', docsResult.data?.length || 0);
console.log('📁 Dossiers récupérés:', foldersResult.data?.length || 0);

if (docsResult.error) {
  console.error('❌ Erreur lors de la récupération des documents:', docsResult.error);
}
```

### 3. Nouveau bouton "Tous les documents"

Interface utilisateur avec bouton toggle :

```typescript
<button
  onClick={() => {
    setShowAllDocuments(!showAllDocuments);
    setSelectedFolder(null);
  }}
  className={`px-4 py-2 border rounded-lg transition-colors ${
    showAllDocuments 
      ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700' 
      : 'border-gray-300 hover:bg-gray-50'
  }`}
>
  {showAllDocuments ? '📚 Tous' : '📄 Sans dossier'}
</button>
```

---

## 🎯 Comportement mis à jour

### 3 modes d'affichage :

1. **📄 Sans dossier** (par défaut)
   - Affiche uniquement les documents `folder_id = null`
   - Documents uploadés sans sélectionner de dossier

2. **📁 Dans un dossier** (quand dossier sélectionné)
   - Affiche uniquement les documents du dossier
   - Filtrage par `folder_id = dossier_id`

3. **📚 Tous les documents** (nouveau bouton)
   - Affiche TOUS les documents de l'utilisateur
   - Aucun filtre sur `folder_id`
   - **Idéal pour diagnostiquer et voir tous les uploads**

---

## 🧪 Comment tester

### Test 1 : Upload de base
1. Allez dans Bibliothèque
2. Cliquez sur "Uploader un document"
3. Uploadez un fichier PDF
4. Ouvrez la console (F12)
5. Vérifiez les logs :
   ```
   📤 Upload du fichier vers Supabase Storage: test.pdf
   ✅ Fichier uploadé avec succès: user-id/timestamp-random-test.pdf
   🔗 URL publique générée: https://...
   💾 Tentative d'enregistrement en BDD...
   ✅ Document enregistré en BDD avec succès: { id: ..., title: "test.pdf", ... }
   📄 Récupération des documents sans dossier
   📚 Documents récupérés: 1
   ```

### Test 2 : Voir tous les documents
1. Cliquez sur le bouton "📄 Sans dossier" pour passer en mode "📚 Tous"
2. Vérifiez que TOUS vos documents apparaissent
3. Console : `📚 Récupération de TOUS les documents`

### Test 3 : Vérifier en BDD directement
Dans Supabase Dashboard → SQL Editor :
```sql
-- Voir tous les documents de votre utilisateur
SELECT id, title, file_type, file_url, folder_id, created_at
FROM documents
WHERE user_id = 'votre-user-id'
ORDER BY created_at DESC;
```

---

## 🔍 Diagnostic des erreurs

### Si le fichier est dans Storage mais pas en BDD :

**Vérifiez les logs console :**
```
❌ Erreur lors de l'enregistrement en BDD: ...
```

**Erreurs possibles :**

1. **"new row violates row-level security policy"**
   - Les politiques RLS bloquent l'insertion
   - Solution : Vérifier que `user_id = auth.uid()`

2. **"null value in column violates not-null constraint"**
   - Un champ requis est manquant
   - Solution : Vérifier que tous les champs obligatoires sont remplis

3. **"violates check constraint"**
   - Valeur invalide pour `file_type` ou `processing_status`
   - Solution : Utiliser uniquement les valeurs autorisées

### Si le fichier est en BDD mais pas affiché :

**Vérifiez les logs console :**
```
📚 Documents récupérés: 0
```

**Solutions :**
1. Cliquez sur "📚 Tous" pour voir tous les documents
2. Vérifiez que `folder_id` correspond à votre filtre
3. Vérifiez les politiques RLS en BDD

---

## 📋 Checklist de vérification

Après upload, vérifiez :

- [ ] Console affiche "✅ Fichier uploadé avec succès"
- [ ] Console affiche "✅ Document enregistré en BDD avec succès"
- [ ] Console affiche "📚 Documents récupérés: X" (X > 0)
- [ ] Le fichier apparaît dans l'interface
- [ ] Le fichier est dans Supabase Storage
- [ ] Le fichier est dans la table `documents`
- [ ] Le bouton "📚 Tous" affiche bien tous les documents

---

## 🎉 Résultat

**Tous les documents uploadés apparaissent maintenant dans l'interface !**

### Avantages des corrections :

✅ **Filtrage intelligent** : 3 modes d'affichage
✅ **Logs détaillés** : Diagnostic facile en cas d'erreur
✅ **Bouton "Tous"** : Voir facilement tous les documents
✅ **Récupération en temps réel** : Rafraîchissement après chaque upload
✅ **Messages clairs** : Confirmation visuelle et console

---

## 🔧 Fichiers modifiés

**`src/pages/Library.tsx`**
- Ajout de `showAllDocuments` state
- Modification de `fetchData()` avec filtrage conditionnel
- Ajout de logs détaillés dans `handleFileUpload()`
- Ajout du bouton toggle "Sans dossier / Tous"
- Mise à jour du `useEffect` pour écouter `showAllDocuments`

---

## 💡 Conseils d'utilisation

### Pour voir vos uploads immédiatement :
1. Uploadez un fichier
2. Cliquez sur "📚 Tous" pour voir tous vos documents
3. Vérifiez que votre fichier apparaît avec le badge "Terminé"

### Pour organiser vos documents :
1. Créez des dossiers avec "Nouveau dossier"
2. Uploadez dans un dossier sélectionné
3. Le document apparaîtra dans ce dossier

### En cas de problème :
1. Ouvrez la console (F12)
2. Uploadez un fichier
3. Lisez les logs colorés (📤, ✅, ❌)
4. Identifiez l'étape qui échoue
