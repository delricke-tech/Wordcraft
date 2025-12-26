# 🧪 Guide de Test - Upload et Affichage des Documents

## ✅ Corrections appliquées

1. ✅ Filtrage corrigé dans `fetchData()`
2. ✅ Logs détaillés ajoutés
3. ✅ Bouton "Tous les documents" ajouté
4. ✅ Insertion en BDD vérifiée

---

## 🧪 Test 1 : Upload d'un document simple

### Étapes :
1. Ouvrez l'application → Bibliothèque
2. Ouvrez la console (F12 → Console)
3. Cliquez sur **"Uploader un document"**
4. Sélectionnez un fichier PDF
5. Cliquez sur **"Uploader 1 fichier"**

### Ce que vous devriez voir dans la console :

```
📤 Upload du fichier vers Supabase Storage: test.pdf
✅ Fichier uploadé avec succès: user-uuid/1234567890-abc123-test.pdf
🔗 URL publique générée: https://xxx.supabase.co/storage/v1/object/public/documents/...
💾 Tentative d'enregistrement en BDD... { user_id: "...", title: "test.pdf", ... }
✅ Document enregistré en BDD avec succès: { id: "...", title: "test.pdf", file_url: "..." }
📄 Récupération des documents sans dossier
📚 Documents récupérés: 1
📁 Dossiers récupérés: 0
✅ Tous les fichiers ont été uploadés avec succès !
```

### Résultat attendu :
- ✅ Le fichier apparaît dans la liste (mode "Sans dossier")
- ✅ Badge "Terminé" en vert
- ✅ Icône rouge pour PDF
- ✅ Taille du fichier affichée
- ✅ Bouton de téléchargement visible au survol

---

## 🧪 Test 2 : Voir tous les documents

### Étapes :
1. Cliquez sur le bouton **"📄 Sans dossier"** pour passer en mode **"📚 Tous"**
2. Le bouton devient bleu/teal

### Ce que vous devriez voir dans la console :

```
📚 Récupération de TOUS les documents
📚 Documents récupérés: X
```

### Résultat attendu :
- ✅ TOUS vos documents apparaissent (avec ou sans dossier)
- ✅ Le bouton affiche "📚 Tous" en bleu

---

## 🧪 Test 3 : Upload dans un dossier

### Étapes :
1. Cliquez sur **"Nouveau dossier"**
2. Nommez-le "Test"
3. Cliquez sur le dossier "Test"
4. Uploadez un fichier
5. Vérifiez qu'il apparaît dans le dossier

### Ce que vous devriez voir dans la console :

```
📤 Upload du fichier vers Supabase Storage: test2.pdf
✅ Fichier uploadé avec succès: ...
💾 Tentative d'enregistrement en BDD... { ..., folder_id: "folder-uuid", ... }
✅ Document enregistré en BDD avec succès: ...
📁 Récupération des documents du dossier: folder-uuid
📚 Documents récupérés: 1
```

### Résultat attendu :
- ✅ Le fichier apparaît dans le dossier "Test"
- ✅ En cliquant sur "📚 Tous", vous voyez tous les documents (y compris ceux du dossier)

---

## 🐛 Test 4 : Diagnostic d'erreur

### Si l'upload échoue :

#### Erreur : "Row Level Security policy violation"

**Console :**
```
❌ Erreur lors de l'enregistrement en BDD: { message: "new row violates row-level security policy", code: "42501" }
```

**Solution :**
```sql
-- Dans Supabase SQL Editor, vérifiez les politiques :
SELECT * FROM pg_policies WHERE tablename = 'documents';

-- Si elles n'existent pas, exécutez :
-- (voir supabase/create_folders_documents_tables.sql)
```

#### Erreur : "Bucket not found"

**Console :**
```
❌ Erreur lors de l'upload: { message: "Bucket not found" }
```

**Solution :**
1. Allez dans Supabase Dashboard → Storage
2. Créez le bucket "documents"
3. Configurez-le en mode **public**

#### Erreur : "null value in column"

**Console :**
```
❌ Erreur lors de l'enregistrement en BDD: { 
  message: "null value in column violates not-null constraint",
  details: "Failing row contains (id, null, ...)"
}
```

**Solution :**
- Un champ obligatoire est manquant
- Vérifiez que `user_id`, `title`, `file_type` sont bien remplis

---

## 🔍 Test 5 : Vérification en BDD

### SQL pour voir vos documents :

```sql
-- Dans Supabase SQL Editor :

-- 1. Voir tous vos documents
SELECT 
  id, 
  title, 
  file_type, 
  file_url, 
  folder_id, 
  processing_status,
  created_at
FROM documents
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 2. Compter vos documents
SELECT COUNT(*) as total_documents
FROM documents
WHERE user_id = auth.uid();

-- 3. Voir les documents par type
SELECT file_type, COUNT(*) as count
FROM documents
WHERE user_id = auth.uid()
GROUP BY file_type;
```

---

## 🎯 Checklist de validation

Après chaque upload, vérifiez :

### Dans la console (F12) :
- [ ] "📤 Upload du fichier..." affiché
- [ ] "✅ Fichier uploadé avec succès" affiché
- [ ] "🔗 URL publique générée" avec une vraie URL
- [ ] "💾 Tentative d'enregistrement en BDD" avec les données
- [ ] "✅ Document enregistré en BDD avec succès" avec l'ID
- [ ] "📚 Documents récupérés: X" où X > 0
- [ ] Aucun message "❌ Erreur"

### Dans l'interface :
- [ ] Le fichier apparaît dans la liste
- [ ] Le nom du fichier est correct
- [ ] L'icône correspond au type (rouge = PDF, bleu = DOCX, etc.)
- [ ] Le badge "Terminé" est vert
- [ ] La date est correcte
- [ ] Le bouton de téléchargement fonctionne

### Dans Supabase Dashboard :
- [ ] Storage → documents → votre-user-id → le fichier est présent
- [ ] Table Editor → documents → une nouvelle ligne existe
- [ ] La colonne `file_url` contient une URL valide
- [ ] La colonne `processing_status` est "completed"

---

## 🚀 Modes d'affichage

### 📄 Mode "Sans dossier" (par défaut)
- Affiche : Documents avec `folder_id = null`
- Utilisation : Voir les documents non classés

### 📁 Mode "Dans un dossier"
- Affiche : Documents du dossier sélectionné
- Utilisation : Navigation dans les dossiers

### 📚 Mode "Tous" (nouveau)
- Affiche : TOUS vos documents
- Utilisation : Vue globale, diagnostic

**Astuce :** Commencez toujours par "📚 Tous" pour voir si vos uploads fonctionnent !

---

## 💡 Conseils de débogage

### Problème : "Le fichier est uploadé mais n'apparaît pas"

1. **Cliquez sur "📚 Tous"**
   - Si le fichier apparaît → Il est dans un dossier ou mal filtré
   - Si le fichier n'apparaît pas → Problème d'insertion en BDD

2. **Vérifiez la console**
   - Cherchez "❌ Erreur" → Lisez le message
   - Pas d'erreur mais pas de fichier → Problème de filtrage

3. **Vérifiez en BDD**
   - Exécutez le SQL ci-dessus
   - Si le document existe → Problème de RLS ou filtrage
   - Si le document n'existe pas → L'insertion a échoué

### Problème : "J'ai plusieurs fichiers uploadés mais je n'en vois qu'un"

- Solution : Cliquez sur "📚 Tous" pour voir tous vos documents
- Les autres sont probablement dans des dossiers

### Problème : "Le bouton de téléchargement ne fonctionne pas"

- Vérifiez que `file_url` n'est pas null en BDD
- Vérifiez que le bucket est en mode **public**
- Vérifiez les politiques Storage

---

## ✅ Résultat attendu final

Après tous ces tests, vous devriez avoir :

1. ✅ Upload fonctionnel vers Storage
2. ✅ Insertion automatique en BDD
3. ✅ Affichage immédiat dans l'interface
4. ✅ 3 modes d'affichage fonctionnels
5. ✅ Téléchargement fonctionnel
6. ✅ Suppression fonctionnelle
7. ✅ Logs détaillés pour diagnostic

**Votre bibliothèque est maintenant complètement fonctionnelle !** 🎉
