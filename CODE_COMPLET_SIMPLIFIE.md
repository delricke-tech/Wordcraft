# ✅ CODE COMPLET - Structure simplifiée

## 📦 Fichiers mis à jour

J'ai recréé **2 fichiers complets et propres** qui fonctionnent avec votre structure de table simplifiée.

---

## 1️⃣ `src/lib/supabase.ts`

### Type Document simplifié :
```typescript
export type Document = {
  id: string;
  name: string;
  storage_path: string;
  user_id: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'image' | 'url' | 'video' | 'audio';
  created_at?: string;
};
```

**Colonnes correspondantes :**
- `id` - UUID automatique
- `name` - Nom du fichier
- `storage_path` - Chemin dans Storage
- `user_id` - ID utilisateur
- `file_type` - Type de fichier
- `created_at` - Date (optionnelle)

---

## 2️⃣ `src/pages/Library.tsx`

### Fonctionnalités :
✅ Upload vers Supabase Storage
✅ Insertion en BDD avec structure simplifiée
✅ Rafraîchissement automatique
✅ Téléchargement des fichiers
✅ Suppression (Storage + BDD)
✅ Protections anti-crash
✅ Vue grille et liste
✅ Recherche et filtres

### Objet envoyé à Supabase :
```typescript
{
  name: file.name,
  storage_path: uploadData.path,
  user_id: user.id,
  file_type: fileType
}
```

---

## 🗄️ Structure de table requise

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  storage_path text NOT NULL,
  user_id uuid NOT NULL,
  file_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## 🎯 Protections incluses

### 1. Protection dans le filtre
```typescript
const matchesSearch = doc.name 
  ? doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  : true;
```

### 2. Protection dans l'affichage
```typescript
{doc.name || 'Document sans nom'}
```

### 3. Protection dans fetchData
```typescript
setDocuments(Array.isArray(docsResult.data) ? docsResult.data : []);
```

### 4. Protection du nom de fichier
```typescript
const documentName = file.name || `document-${Date.now()}`;
```

---

## 🚀 Test rapide

### Étape 1 : Vérifier que l'app tourne
```bash
npm run dev
```

### Étape 2 : Tester l'upload
1. Cliquez "Uploader"
2. Sélectionnez un fichier
3. Vérifiez la console (F12) :

```
📤 Upload du fichier vers Supabase Storage: test.pdf
✅ Fichier uploadé avec succès: user-id/12345-test.pdf
💾 Insertion en BDD: {
  name: "test.pdf",
  storage_path: "user-id/12345-test.pdf",
  user_id: "abc-123",
  file_type: "pdf"
}
✅ Document enregistré en BDD avec succès
```

### Étape 3 : Vérifier l'affichage
Le document doit apparaître avec son nom correct !

---

## ⚙️ Configuration Supabase requise

### 1. Storage Bucket
```
Bucket name: documents
Public: true
```

### 2. RLS Policies (Storage)
```sql
-- Users can upload their own documents
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own documents
CREATE POLICY "Users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. RLS Policies (Table)
```sql
-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

---

## 🎯 Différences avec l'ancien code

### Supprimé :
- ❌ Colonnes complexes (title, extracted_text, has_quiz, etc.)
- ❌ Fonctions Quiz/Flashcards (commentées car nécessitent colonnes supplémentaires)
- ❌ Imports inutilisés
- ❌ États non utilisés

### Simplifié :
- ✅ Type Document minimal
- ✅ Fonction d'upload directe
- ✅ Gestion basique des documents
- ✅ Code propre et lisible

### Conservé :
- ✅ Toutes les protections anti-crash
- ✅ Rafraîchissement automatique
- ✅ Upload/Download/Delete
- ✅ Vue grille et liste
- ✅ Recherche et filtres

---

## 📝 Checklist

### Code
- [x] `supabase.ts` - Type Document simplifié
- [x] `Library.tsx` - Code complet et fonctionnel
- [x] Protections anti-crash
- [x] Pas d'erreurs de compilation

### Supabase
- [ ] Table `documents` créée avec bonnes colonnes
- [ ] Storage bucket `documents` créé
- [ ] RLS policies configurées (Storage)
- [ ] RLS policies configurées (Table)

### Test
- [ ] Upload fonctionne
- [ ] Nom du fichier s'affiche correctement
- [ ] Téléchargement fonctionne
- [ ] Suppression fonctionne
- [ ] Pas de crash

---

## 🎉 Résultat

**Code propre, simple et fonctionnel !**

✅ 2 fichiers complets fournis
✅ Structure de table simplifiée
✅ Toutes les protections incluses
✅ Prêt à utiliser !

---

**Testez maintenant !** 🚀
