# ✅ ADAPTATION POUR STRUCTURE SIMPLIFIÉE - Table Documents

## 🎯 Modifications effectuées

J'ai adapté le code pour correspondre à votre structure de table simplifiée avec les colonnes :
- `name` (nom du fichier)
- `storage_path` (chemin dans Supabase Storage)
- `user_id` (ID de l'utilisateur)
- `file_type` (type de fichier)

---

## 📦 Changements dans `src/lib/supabase.ts`

### Type Document simplifié

```typescript
export type Document = {
  id: string;
  name: string;                // ✅ Nom du fichier
  storage_path: string;         // ✅ Chemin dans Supabase Storage
  user_id: string;              // ✅ ID de l'utilisateur
  file_type: 'pdf' | 'docx' | 'txt' | 'image' | 'url' | 'video' | 'audio';
  created_at?: string;          // ✅ Date de création (optionnelle)
};
```

Le type `DocumentFull` a été conservé pour référence future si vous ajoutez des colonnes.

---

## 📝 Changements dans `src/pages/Library.tsx`

### 1. Fonction `handleFileUpload` ✅

**Insertion avec les bonnes colonnes :**

```typescript
const { data: docData, error: dbError } = await supabase
  .from('documents')
  .insert({
    name: file.name,              // ✅ Nom du fichier
    storage_path: uploadData.path, // ✅ Chemin dans Storage
    user_id: user.id,              // ✅ ID utilisateur
    file_type: fileType,           // ✅ Type de fichier
  })
  .select()
  .single();
```

**Rafraîchissement automatique :**
```typescript
await fetchData(); // ✅ Liste rafraîchie automatiquement
```

---

### 2. Affichage des documents ✅

**Vue Grille :**
```typescript
<h3>{doc.name}</h3>  // ✅ Affichage du nom
<p>{doc.created_at ? format(...) : 'Date inconnue'}</p>
```

**Vue Liste :**
```typescript
<span>{doc.name}</span>  // ✅ Affichage du nom
```

---

### 3. Fonction `handleDownloadDocument` ✅

**Génération d'URL depuis `storage_path` :**

```typescript
const handleDownloadDocument = (doc: Document) => {
  if (doc.storage_path) {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(doc.storage_path);  // ✅ URL depuis storage_path
    
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  }
};
```

---

### 4. Fonction `handleDeleteDocument` ✅

**Suppression du fichier ET de la BDD :**

```typescript
const handleDeleteDocument = async (id: string) => {
  const doc = documents.find(d => d.id === id);
  
  // 1. Supprimer du Storage
  if (doc?.storage_path) {
    await supabase.storage
      .from('documents')
      .remove([doc.storage_path]);  // ✅ Utilise storage_path
  }
  
  // 2. Supprimer de la BDD
  await supabase.from('documents').delete().eq('id', id);
  
  // 3. Rafraîchir automatiquement
  await fetchData();  // ✅ Liste mise à jour
};
```

---

### 5. Filtre de recherche ✅

```typescript
const filteredDocuments = documents.filter((doc) => {
  const matchesSearch = doc.name.toLowerCase()...  // ✅ Utilise 'name'
  return matchesSearch && matchesFilter;
});
```

---

### 6. Boutons conditionnels ✅

**Bouton télécharger :**
```typescript
{doc.storage_path && (  // ✅ Vérifie storage_path
  <button onClick={() => handleDownloadDocument(doc)}>
    Télécharger
  </button>
)}
```

---

## 🔧 Fonctionnalités désactivées temporairement

Les fonctionnalités suivantes ont été **commentées** car elles nécessitent des colonnes supplémentaires :

### Colonnes manquantes pour Quiz/Flashcards :
- `file_url` (URL publique)
- `extracted_text` (texte extrait du PDF)
- `title` (titre du document)
- `has_quiz` (boolean)
- `has_cards` (boolean)
- `processing_status` (statut)
- `page_count` (nombre de pages)

### Fonctions commentées :
```typescript
/* 
const handleGenerateQuiz = async (doc: Document) => { ... }
const handleGenerateFlashcards = async (doc: Document) => { ... }
*/
```

Pour réactiver ces fonctions, ajoutez les colonnes manquantes à votre table !

---

## ✅ Fonctionnalités opérationnelles

### 1. Upload de fichiers ✅
- Sélection de fichiers (PDF, DOCX, TXT, Images)
- Upload vers Supabase Storage
- Insertion en BDD avec `name`, `storage_path`, `user_id`, `file_type`
- **Rafraîchissement automatique de la liste**

### 2. Affichage des documents ✅
- Vue grille avec cartes
- Vue liste avec tableau
- Affichage du nom du fichier
- Affichage de la date de création
- Icônes selon le type de fichier

### 3. Téléchargement ✅
- Génération d'URL publique depuis `storage_path`
- Ouverture dans un nouvel onglet

### 4. Suppression ✅
- Suppression du fichier dans Storage
- Suppression de l'entrée en BDD
- **Rafraîchissement automatique de la liste**

### 5. Recherche et filtrage ✅
- Recherche par nom de fichier
- Filtrage par type de fichier

---

## 🚀 Test rapide

```bash
# 1. Lancer l'application
npm run dev

# 2. Tester l'upload
- Cliquez "Uploader un document"
- Sélectionnez un fichier
- Cliquez "Uploader"

# 3. Vérifier
✅ Le fichier apparaît automatiquement dans la liste
✅ Le nom est affiché correctement
✅ Le bouton télécharger fonctionne
✅ Le bouton supprimer fonctionne
```

---

## 📊 Structure de la table requise

### SQL actuel (minimal) :

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

### SQL pour activer Quiz/Flashcards (optionnel) :

```sql
ALTER TABLE documents
  ADD COLUMN file_url text,
  ADD COLUMN extracted_text text,
  ADD COLUMN title text,
  ADD COLUMN has_quiz boolean DEFAULT false,
  ADD COLUMN has_cards boolean DEFAULT false,
  ADD COLUMN processing_status text DEFAULT 'completed',
  ADD COLUMN page_count integer;
```

---

## 🎯 Résumé des colonnes

### Colonnes utilisées actuellement ✅
- `id` - UUID généré automatiquement
- `name` - Nom du fichier (ex: "cours.pdf")
- `storage_path` - Chemin dans Storage (ex: "user-id/timestamp-file.pdf")
- `user_id` - ID de l'utilisateur
- `file_type` - Type de fichier (pdf, docx, txt, image)
- `created_at` - Date d'upload (auto)

### Colonnes pour fonctionnalités avancées (optionnelles) 🔜
- `file_url` - URL publique Supabase
- `extracted_text` - Texte extrait du PDF
- `title` - Titre personnalisable
- `has_quiz` - Indique si un quiz existe
- `has_cards` - Indique si des fiches existent
- `processing_status` - Statut du traitement
- `page_count` - Nombre de pages

---

## 🎉 Résultat

**Votre application fonctionne maintenant avec votre structure de table simplifiée !**

### Ce qui marche :
- ✅ Upload de fichiers vers Supabase
- ✅ Insertion en BDD avec les bonnes colonnes
- ✅ **Rafraîchissement automatique après upload**
- ✅ Affichage dans la bibliothèque
- ✅ Téléchargement des fichiers
- ✅ **Rafraîchissement automatique après suppression**
- ✅ Recherche et filtrage

### Pour activer Quiz/Flashcards :
Ajoutez les colonnes manquantes à votre table et décommentez les fonctions !

---

**Testez dès maintenant !** 🚀📚
