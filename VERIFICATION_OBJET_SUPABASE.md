# ✅ VÉRIFICATION - Objet envoyé à Supabase

## 📋 Objet actuellement envoyé

### Ligne 177-186 de `Library.tsx`

```typescript
const { data: docData, error: dbError } = await supabase
  .from('documents')
  .insert({
    name: documentName,            // ✅ file.name (avec protection)
    storage_path: uploadData.path, // ✅ Chemin dans Storage
    user_id: user.id,              // ✅ ID de l'utilisateur
    file_type: fileType,           // ⚠️ Colonne supplémentaire
  })
  .select()
  .single();
```

---

## ✅ Propriétés confirmées

| Propriété | Valeur | Description | Statut |
|-----------|--------|-------------|--------|
| `name` | `file.name` ou `document-timestamp` | Nom du fichier | ✅ Correct |
| `storage_path` | `uploadData.path` | Chemin dans Storage | ✅ Correct |
| `user_id` | `user.id` | ID utilisateur | ✅ Correct |
| `file_type` | `fileType` | Type de fichier (pdf, docx...) | ⚠️ À vérifier |

---

## ⚠️ Point d'attention : `file_type`

L'objet envoie **4 propriétés** au lieu de 3.

### Votre table a-t-elle la colonne `file_type` ?

**Si OUI ✅** - Tout est correct, gardez le code tel quel.

**Si NON ❌** - Je dois enlever `file_type` de l'objet.

---

## 🔍 Comment vérifier votre table

### Dans Supabase Dashboard :

1. Allez dans **Table Editor**
2. Sélectionnez la table **documents**
3. Vérifiez les colonnes

### Structure attendue (minimum) :

```
documents
├── id (uuid, primary key)
├── name (text)             ← ✅
├── storage_path (text)     ← ✅
├── user_id (uuid)          ← ✅
└── file_type (text)        ← ❓ Avez-vous cette colonne ?
```

### OU (si pas de file_type) :

```
documents
├── id (uuid, primary key)
├── name (text)             ← ✅
├── storage_path (text)     ← ✅
└── user_id (uuid)          ← ✅
```

---

## 📊 SQL pour vérifier

Dans **SQL Editor** de Supabase :

```sql
-- Voir la structure exacte de votre table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

**Résultat attendu :**

```
column_name    | data_type | is_nullable
---------------|-----------|------------
id             | uuid      | NO
name           | text      | NO
storage_path   | text      | NO
user_id        | uuid      | NO
file_type      | text      | ?   ← Cette ligne existe ?
created_at     | timestamp | YES (optionnel)
```

---

## 🛠️ Corrections selon votre table

### Option 1 : Votre table a `file_type` ✅

**Code actuel est correct !** Rien à changer.

```typescript
.insert({
  name: documentName,
  storage_path: uploadData.path,
  user_id: user.id,
  file_type: fileType,  // ✅ Gardez cette ligne
})
```

### Option 2 : Votre table n'a PAS `file_type` ❌

**Je dois enlever cette ligne :**

```typescript
.insert({
  name: documentName,
  storage_path: uploadData.path,
  user_id: user.id,
  // file_type: fileType,  ← Enlever cette ligne
})
```

---

## 💡 Recommandation

### Si vous n'avez que 3 colonnes

Je recommande **d'ajouter `file_type`** à votre table car c'est utile pour :
- Afficher les bonnes icônes (PDF, Word, Image...)
- Filtrer les documents par type
- Gérer différemment selon le type

**SQL pour ajouter la colonne :**

```sql
ALTER TABLE documents
ADD COLUMN file_type text NOT NULL DEFAULT 'txt';
```

**Puis mettez à jour les documents existants :**

```sql
-- Détecter le type depuis le nom du fichier
UPDATE documents
SET file_type = CASE
  WHEN name LIKE '%.pdf' THEN 'pdf'
  WHEN name LIKE '%.docx' OR name LIKE '%.doc' THEN 'docx'
  WHEN name LIKE '%.jpg' OR name LIKE '%.png' OR name LIKE '%.jpeg' THEN 'image'
  ELSE 'txt'
END;
```

---

## 🧪 Test de vérification

### Dans la console du navigateur (F12)

Quand vous uploadez, vous devriez voir :

```
💾 Tentative d'enregistrement en BDD avec vos colonnes:
{
  name: "mon-fichier.pdf",           ← Nom du fichier
  storage_path: "user-id/12345-...", ← Chemin Storage
  user_id: "abc-123-def-456",        ← ID utilisateur
  file_type: "pdf"                   ← Type de fichier
}
```

**Si vous voyez une erreur :** `column "file_type" does not exist`  
→ Enlevez `file_type` de l'objet OU ajoutez la colonne à votre table.

---

## ✅ Confirmation actuelle

**L'objet envoyé contient :**

```typescript
{
  name: file.name,               // ✅ Correct
  storage_path: uploadData.path, // ✅ Correct
  user_id: user.id,              // ✅ Correct
  file_type: fileType,           // ⚠️ À vérifier selon votre table
}
```

**Les 3 propriétés principales sont CORRECTES !** ✅

---

## 🚀 Prochaine étape

**Dites-moi :**
1. Votre table a-t-elle la colonne `file_type` ?
2. Si non, voulez-vous que je l'enlève du code ?
3. Ou préférez-vous ajouter cette colonne à votre table ?

**En attendant, vous pouvez tester l'upload et voir dans la console si une erreur apparaît !** 🧪
