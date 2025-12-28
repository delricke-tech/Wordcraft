# 🔧 Configuration CORS Supabase Storage - Guide Complet

**Date** : 28 décembre 2024  
**Problème** : Autoriser `http://localhost:5173` pour le Storage Supabase

---

## 🎯 Solution 1 : Configuration via l'Interface Supabase (RECOMMANDÉ)

### Étapes détaillées

#### 1️⃣ Accéder aux paramètres Storage

1. Aller sur https://app.supabase.com
2. Sélectionner votre projet
3. Dans le menu latéral gauche, cliquer sur **Storage**
4. Cliquer sur le bucket **`documents`**
5. Cliquer sur l'icône **⚙️ (Settings/Configuration)** en haut à droite

#### 2️⃣ Configurer CORS

**Si vous voyez une section "CORS Configuration"** :
- Ajouter `http://localhost:5173` dans la liste des origines autorisées
- Sauvegarder

**Si vous ne voyez PAS de section CORS** :
- C'est normal ! Par défaut, Supabase Storage autorise **toutes les origines** en développement
- Passez à la Solution 2 pour forcer la configuration

---

## 🎯 Solution 2 : Configuration via SQL (ALTERNATIVE)

Si l'interface ne propose pas de configuration CORS, utilisez cette requête SQL :

### Étape 1 : Ouvrir l'éditeur SQL

1. Dans votre projet Supabase
2. Menu latéral → **SQL Editor**
3. Cliquer sur **New query**

### Étape 2 : Exécuter ce script

```sql
-- Configuration CORS pour le bucket 'documents'
-- Autorise localhost:5173 pour le développement

-- Note: Cette configuration se fait au niveau de Supabase,
-- pas au niveau de PostgreSQL directement

-- Pour vérifier la configuration actuelle du bucket :
SELECT * FROM storage.buckets WHERE name = 'documents';

-- Si vous avez besoin de recréer le bucket avec CORS :
-- (ATTENTION : Cela supprime et recrée le bucket - sauvegarder vos fichiers d'abord)

/*
-- 1. Supprimer l'ancien bucket (BACKUP VOS FICHIERS AVANT)
DELETE FROM storage.buckets WHERE name = 'documents';

-- 2. Créer le nouveau bucket avec configuration CORS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,  -- Bucket public
  52428800,  -- 50MB max
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
);
*/

-- Note: La configuration CORS détaillée n'est pas exposée dans PostgreSQL
-- Elle est gérée par l'API Supabase
```

---

## 🎯 Solution 3 : Configuration via Supabase CLI (SI NÉCESSAIRE)

### Installation de la CLI

```powershell
# Installer Supabase CLI avec npm
npm install -g supabase

# Vérifier l'installation
supabase --version
```

### Configuration CORS

1. **Se connecter à votre projet**
   ```powershell
   supabase login
   ```

2. **Créer un fichier de configuration local**
   ```powershell
   # Dans votre projet
   cd "C:\Users\HP I5\Downloads\project"
   supabase init
   ```

3. **Configurer CORS dans `supabase/config.toml`**
   ```toml
   [storage]
   file_size_limit = 52428800  # 50MB
   
   [storage.cors]
   allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
   allowed_methods = ["GET", "POST", "PUT", "DELETE"]
   allowed_headers = ["*"]
   ```

4. **Déployer la configuration**
   ```powershell
   supabase link --project-ref votre-project-ref
   supabase db push
   ```

---

## 🎯 Solution 4 : Vérifier que le bucket est PUBLIC

Le plus souvent, le problème vient du fait que le bucket n'est pas public :

### Via l'interface

1. **Storage** → Bucket **`documents`**
2. Vérifier que le bucket est marqué comme **Public**
3. Si non, cliquer sur **Make Public**

### Via SQL

```sql
-- Rendre le bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'documents';

-- Vérifier
SELECT name, public FROM storage.buckets WHERE name = 'documents';
-- Doit retourner : documents | true
```

---

## 🎯 Solution 5 : Proxy Local (BACKUP - Si CORS persiste)

Si malgré tout le CORS bloque, voici un proxy local simple :

### Créer un fichier `proxy-server.js`

```javascript
// proxy-server.js - Proxy local pour contourner CORS
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors()); // Autoriser toutes les origines
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Route pour télécharger un fichier
app.get('/download/:path(*)', async (req, res) => {
  try {
    const filePath = req.params.path;
    console.log('📥 Téléchargement via proxy:', filePath);

    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error) {
      console.error('❌ Erreur:', error);
      return res.status(500).json({ error: error.message });
    }

    // Convertir le Blob en Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filePath}"`);
    res.send(buffer);
  } catch (error) {
    console.error('💥 Erreur proxy:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Proxy local actif sur http://localhost:${PORT}`);
});
```

### Installer les dépendances

```powershell
cd "C:\Users\HP I5\Downloads\project"
npm install express cors
```

### Lancer le proxy

```powershell
node proxy-server.js
```

### Modifier `openaiService.ts` pour utiliser le proxy

```typescript
// Dans extractPDFText(), remplacer :
const { data, error } = await supabase.storage
  .from('documents')
  .download(storagePath);

// Par :
const response = await fetch(`http://localhost:3001/download/${storagePath}`);
const data = await response.blob();
```

---

## ✅ Vérification que tout fonctionne

### Test 1 : Vérifier le bucket

```sql
-- Dans SQL Editor
SELECT name, public FROM storage.buckets WHERE name = 'documents';
```

**Résultat attendu** : `documents | true`

### Test 2 : Tester l'accès direct

1. Ouvrir la console navigateur (F12)
2. Taper :
```javascript
const { createClient } = supabase;
const supabase = createClient('VOTRE_URL', 'VOTRE_KEY');
const { data } = await supabase.storage.from('documents').list();
console.log(data);
```

**Résultat attendu** : Liste de vos fichiers

### Test 3 : Tester dans l'app

1. Ouvrir un PDF dans l'app
2. Ouvrir la console (F12)
3. Chercher les erreurs CORS
4. **Pas d'erreur CORS** = ✅ Tout fonctionne

---

## 🔍 Diagnostic des erreurs CORS

### Erreur typique

```
Access to fetch at 'https://xxx.supabase.co/storage/v1/object/public/documents/...'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Solutions par ordre de priorité

1. ✅ **Rendre le bucket public** (Solution 4)
2. ✅ **Vérifier les RLS policies** (voir ci-dessous)
3. ✅ **Utiliser le proxy local** (Solution 5)

---

## 🔐 Vérifier les Row Level Security (RLS) Policies

Les CORS peuvent aussi être bloqués par RLS. Vérifiez :

```sql
-- Voir les policies actuelles
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Créer une policy pour autoriser la lecture publique
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'public');

-- Ou autoriser TOUT le monde (développement uniquement)
CREATE POLICY "Allow all public access"
ON storage.objects FOR ALL
USING (bucket_id = 'documents');
```

---

## 📋 Checklist de dépannage

- [ ] Le bucket `documents` existe
- [ ] Le bucket est marqué comme **public**
- [ ] Les fichiers sont uploadés correctement
- [ ] Les RLS policies autorisent la lecture
- [ ] L'URL Supabase est correcte dans `.env`
- [ ] La clé ANON est correcte dans `.env`
- [ ] Le serveur dev tourne sur `localhost:5173`
- [ ] Pas d'erreur CORS dans la console

---

## 🎉 Recommandation finale

**Pour 99% des cas** : Le bucket public (Solution 4) suffit !

```sql
-- Exécuter simplement :
UPDATE storage.buckets SET public = true WHERE name = 'documents';
```

**Si ça ne suffit pas** : Utiliser le proxy local (Solution 5)

---

**Temps de configuration** : 2-5 minutes  
**Difficulté** : Facile ⭐⭐☆☆☆

