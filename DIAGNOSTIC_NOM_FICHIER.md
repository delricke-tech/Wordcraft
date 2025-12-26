# 🔍 DIAGNOSTIC - "Document sans nom"

## ❓ Problème

Votre document s'affiche comme **"Document sans nom"** alors que le fichier a un vrai nom.

---

## ✅ Correction appliquée

### Protection dans la fonction d'upload (ligne 164-179)

**Avant :**
```typescript
const { data: docData, error: dbError } = await supabase
  .from('documents')
  .insert({
    name: file.name,  // Peut être vide ou undefined
    ...
  });
```

**Après :**
```typescript
// ✅ S'assurer que le nom n'est jamais vide
const documentName = file.name || `document-${Date.now()}`;

const { data: docData, error: dbError } = await supabase
  .from('documents')
  .insert({
    name: documentName,  // ✅ Toujours un nom valide
    storage_path: uploadData.path,
    user_id: user.id,
    file_type: fileType,
  });
```

**Résultat :**
- Si `file.name` existe → Utilise le vrai nom du fichier ✅
- Si `file.name` est vide → Utilise `document-1234567890` ✅

---

## 🔍 Diagnostic de votre table Supabase

### Étape 1 : Vérifier la structure de votre table

Dans **Supabase Dashboard** :

```
1. Allez dans "Table Editor"
2. Sélectionnez la table "documents"
3. Vérifiez les colonnes
```

### Votre table doit avoir ces colonnes :

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | ID unique |
| `name` | text | Non | **Nom du fichier** ✅ |
| `storage_path` | text | Non | Chemin dans Storage |
| `user_id` | uuid | Non | ID utilisateur |
| `file_type` | text | Non | Type de fichier |
| `created_at` | timestamptz | Oui | Date de création |

---

## 🐛 Causes possibles du problème

### 1. La colonne s'appelle différemment ❌

Votre table utilise peut-être :
- `title` au lieu de `name`
- `filename` au lieu de `name`
- `document_name` au lieu de `name`

**Solution :**
```sql
-- Vérifier le nom exact de la colonne
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents';
```

### 2. La colonne `name` est nullable et vide ❌

Les anciens documents ont peut-être `name = NULL`.

**Solution :**
```sql
-- Mettre à jour les documents sans nom
UPDATE documents 
SET name = 'Document-' || id 
WHERE name IS NULL OR name = '';
```

### 3. Le fichier uploadé n'avait pas de nom ❌

Certains navigateurs peuvent envoyer un fichier sans nom.

**Solution :** ✅ Déjà corrigé avec `file.name || 'document-...'`

---

## 🧪 Test de diagnostic

### Test 1 : Uploader un nouveau fichier

```bash
1. Sélectionnez un fichier PDF avec un nom clair (ex: "test.pdf")
2. Uploadez-le
3. Ouvrez la console du navigateur (F12)
4. Cherchez : "💾 Tentative d'enregistrement en BDD"
5. Vérifiez que le log affiche : name: "test.pdf"
```

**Résultat attendu dans la console :**
```
💾 Tentative d'enregistrement en BDD avec vos colonnes:
{
  name: "test.pdf",              ← Doit afficher le vrai nom
  storage_path: "user-id/...",
  user_id: "...",
  file_type: "pdf"
}
✅ Document enregistré en BDD avec succès
```

### Test 2 : Vérifier dans Supabase

```
1. Allez dans Supabase Dashboard
2. Table Editor → documents
3. Trouvez votre document
4. Vérifiez la colonne "name"
```

**Si la colonne "name" contient le bon nom :**
→ Le problème vient de l'affichage, pas de l'upload

**Si la colonne "name" est vide ou NULL :**
→ Le problème vient de l'insertion en BDD

---

## 🔧 Solutions selon le diagnostic

### Solution 1 : Si votre colonne s'appelle "title" ou autre

Modifiez le code pour utiliser le bon nom de colonne :

```typescript
const { data: docData, error: dbError } = await supabase
  .from('documents')
  .insert({
    title: documentName,  // ← Changez ici si nécessaire
    storage_path: uploadData.path,
    user_id: user.id,
    file_type: fileType,
  });
```

### Solution 2 : Si la colonne "name" n'existe pas

Ajoutez la colonne dans Supabase :

```sql
ALTER TABLE documents 
ADD COLUMN name text NOT NULL DEFAULT 'Document sans titre';
```

Puis mettez à jour les anciens documents :

```sql
UPDATE documents 
SET name = COALESCE(title, 'Document-' || id);
```

### Solution 3 : Si tout est correct mais ça ne marche pas

Vérifiez les **RLS (Row Level Security)** :

```sql
-- Autoriser l'insertion de la colonne name
CREATE POLICY "Users can insert documents with name"
ON documents FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);
```

---

## 🎯 Checklist de vérification

- [ ] La table `documents` existe dans Supabase
- [ ] La colonne `name` existe (ou `title`)
- [ ] La colonne `name` est de type `text`
- [ ] Les RLS policies autorisent l'insertion
- [ ] Le code utilise le bon nom de colonne
- [ ] `file.name` contient bien le nom du fichier
- [ ] La console affiche le bon nom lors de l'upload

---

## 📊 Script SQL de diagnostic complet

Exécutez ceci dans l'**SQL Editor** de Supabase :

```sql
-- 1. Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- 2. Vérifier les documents actuels
SELECT id, name, storage_path, file_type, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;

-- 3. Compter les documents sans nom
SELECT 
  COUNT(*) FILTER (WHERE name IS NULL) as sans_nom,
  COUNT(*) FILTER (WHERE name IS NOT NULL) as avec_nom,
  COUNT(*) as total
FROM documents;

-- 4. Mettre à jour les documents sans nom (si nécessaire)
-- UPDATE documents 
-- SET name = 'Document-' || id 
-- WHERE name IS NULL OR name = '';
```

---

## 🚀 Test après correction

### Étape 1 : Uploader un nouveau fichier
```
1. Uploadez "mon-document.pdf"
2. Vérifiez la console : doit afficher "mon-document.pdf"
3. Vérifiez Supabase : la colonne "name" doit contenir "mon-document.pdf"
```

### Étape 2 : Vérifier l'affichage
```
1. Rafraîchissez la page
2. Le document doit s'afficher avec "mon-document.pdf"
3. Plus de "Document sans nom" ✅
```

---

## 💡 Résumé

**Correction appliquée :**
```typescript
const documentName = file.name || `document-${Date.now()}`;
```

**Protections :**
- ✅ Si `file.name` existe → utilise le vrai nom
- ✅ Si `file.name` est vide → génère un nom unique
- ✅ Plus jamais "Document sans nom" à l'upload

**Prochaine étape :**
1. Testez l'upload d'un nouveau fichier
2. Vérifiez la console et Supabase
3. Si toujours "Document sans nom", exécutez le script SQL de diagnostic

---

**Le nom du fichier devrait maintenant s'afficher correctement !** 🎉
