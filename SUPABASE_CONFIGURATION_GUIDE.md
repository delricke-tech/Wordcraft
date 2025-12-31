# 🔧 Guide de Configuration Supabase pour Multi-Formats

## 📋 **Checklist rapide**

- [ ] Script SQL exécuté
- [ ] Bucket "documents" configuré
- [ ] MIME types vérifiés
- [ ] Taille max vérifiée (100 MB)
- [ ] Test d'upload effectué

---

## 🎯 **Configuration nécessaire**

### **Étape 1 : Exécuter le script SQL** (⏱️ 2 minutes)

1. **Ouvrez Supabase Dashboard** : https://supabase.com/dashboard

2. **Sélectionnez votre projet** : `delirisee-techsProject`

3. **Allez dans SQL Editor** :
   - Cliquez sur l'icône `<>` dans la barre latérale gauche
   - Ou cherchez "SQL Editor" dans le menu

4. **Créez une nouvelle query** :
   - Cliquez sur "+ New query"

5. **Copiez-collez le script** :
   - Ouvrez le fichier `CONFIGURE_STORAGE_MULTI_FORMATS.sql`
   - Sélectionnez tout (Ctrl+A)
   - Copiez (Ctrl+C)
   - Collez dans l'éditeur SQL de Supabase (Ctrl+V)

6. **Exécutez** :
   - Cliquez sur le bouton "Run" (▶️) ou appuyez sur Ctrl+Enter

7. **Vérifiez le résultat** :
   Vous devriez voir :
   ```
   ✅ CONFIGURATION STORAGE MULTI-FORMATS TERMINÉE !
   
   Bucket "documents" : ✅ Configuré
   MIME types autorisés : 27 formats
   Taille max par fichier : 100 MB
   Accès public : ✅ Activé
   ```

---

## 🔍 **Vérification manuelle (optionnel)**

Si vous voulez vérifier manuellement la configuration :

### **A. Vérifier le bucket Storage**

1. **Allez dans Storage** :
   - Cliquez sur l'icône 🗄️ "Storage" dans la barre latérale

2. **Cherchez le bucket "documents"** :
   - Il devrait être listé avec un statut "Public"

3. **Cliquez sur "documents"** :
   - Vérifiez que vous pouvez voir les fichiers uploadés

4. **Paramètres du bucket** :
   - Cliquez sur les 3 points ⋮ à côté du nom du bucket
   - Sélectionnez "Edit bucket"
   - Vérifiez :
     - ✅ Public bucket : **ON**
     - ✅ File size limit : **100 MB**
     - ✅ Allowed MIME types : **Multiple types**

### **B. Vérifier les politiques (RLS)**

1. **Allez dans Authentication** → **Policies**

2. **Cherchez le bucket "storage.objects"**

3. **Vérifiez les politiques** :
   - ✅ `Authenticated users can upload documents` (INSERT)
   - ✅ `Public can view documents` (SELECT)
   - ✅ `Users can delete own documents` (DELETE)
   - ✅ `Users can update own documents` (UPDATE)

---

## 📊 **MIME Types configurés**

Voici tous les types de fichiers autorisés après configuration :

### **📄 Documents**
- `application/pdf` - PDF
- `application/msword` - Word 97-2003
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - Word moderne (.docx)

### **📝 Texte**
- `text/plain` - Fichiers .txt
- `text/markdown` - Fichiers .md

### **🖼️ Images**
- `image/jpeg`, `image/jpg` - JPEG
- `image/png` - PNG
- `image/gif` - GIF animés
- `image/webp` - WebP moderne
- `image/svg+xml` - SVG vectoriel

### **🎥 Vidéos**
- `video/mp4` - MP4 (le plus courant)
- `video/mpeg` - MPEG
- `video/quicktime` - MOV (Apple)
- `video/x-msvideo` - AVI
- `video/webm` - WebM
- `video/x-matroska` - MKV

### **🎵 Audio**
- `audio/mpeg`, `audio/mp3` - MP3
- `audio/wav`, `audio/wave`, `audio/x-wav` - WAV
- `audio/ogg` - OGG Vorbis
- `audio/webm` - WebM Audio

**Total : 27 types MIME** ✅

---

## ⚙️ **Paramètres du bucket**

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **ID** | `documents` | Identifiant du bucket |
| **Public** | ✅ Oui | Accessible via URL publique |
| **Taille max** | 100 MB | Par fichier (ajustable) |
| **MIME types** | 27 types | Tous les formats supportés |

### **Ajuster la taille max (optionnel)**

Si vous voulez accepter des fichiers plus gros :

1. Modifiez la ligne dans le script SQL :
   ```sql
   file_size_limit = 104857600, -- 100 MB
   ```

2. Valeurs courantes :
   - 50 MB : `52428800`
   - 100 MB : `104857600` (défaut)
   - 200 MB : `209715200`
   - 500 MB : `524288000`
   - 1 GB : `1073741824`

3. Réexécutez le script

---

## 🧪 **Tester la configuration**

Après avoir exécuté le script :

### **Test 1 : Upload PDF** ✅
1. Retournez dans votre application
2. Cliquez sur "Ajouter documents"
3. Sélectionnez un PDF
4. ✅ Devrait fonctionner

### **Test 2 : Upload TXT** ✅
1. Créez un fichier texte simple
2. Uploadez-le
3. ✅ Devrait s'afficher avec extraction automatique

### **Test 3 : Upload Image** ✅
1. Sélectionnez une image (.jpg, .png)
2. Uploadez-la
3. ✅ Devrait s'afficher dans la visionneuse

### **Test 4 : Upload Audio** ✅
1. Sélectionnez un fichier audio (.mp3)
2. Uploadez-le
3. ✅ Devrait avoir un lecteur audio

### **Test 5 : Upload Vidéo** ✅
1. Sélectionnez une vidéo (.mp4)
2. Uploadez-la
3. ✅ Devrait avoir un lecteur vidéo

---

## ❌ **Dépannage**

### **Erreur : "File type not allowed"**

**Cause :** Le MIME type n'est pas dans la liste autorisée

**Solution :**
1. Vérifiez le type MIME du fichier
2. Ajoutez-le dans le script SQL (section `allowed_mime_types`)
3. Réexécutez le script

### **Erreur : "File size limit exceeded"**

**Cause :** Le fichier dépasse 100 MB

**Solution :**
1. Compressez le fichier
2. Ou augmentez la limite dans le script SQL
3. Réexécutez le script

### **Erreur : "Bucket not found"**

**Cause :** Le bucket "documents" n'existe pas

**Solution :**
1. Exécutez le script `CONFIGURE_STORAGE_MULTI_FORMATS.sql`
2. Le bucket sera créé automatiquement

### **Erreur : "Policy violation"**

**Cause :** Les politiques RLS bloquent l'accès

**Solution :**
1. Vérifiez que vous êtes connecté
2. Exécutez le script SQL pour recréer les politiques
3. Déconnectez-vous puis reconnectez-vous

---

## 🔐 **Sécurité**

### **Le bucket est public, c'est sûr ?**

**Oui**, car :
1. ✅ Les fichiers ne sont accessibles que via leur URL complète (impossible à deviner)
2. ✅ Les politiques RLS empêchent la suppression non autorisée
3. ✅ Seuls les utilisateurs authentifiés peuvent uploader
4. ✅ Les URLs sont uniques et impossibles à énumérer

### **Qui peut faire quoi ?**

| Action | Utilisateur anonyme | Utilisateur connecté |
|--------|---------------------|---------------------|
| **Voir un document** | ✅ Oui (avec URL) | ✅ Oui |
| **Uploader** | ❌ Non | ✅ Oui |
| **Supprimer** | ❌ Non | ✅ Oui (ses fichiers) |
| **Modifier** | ❌ Non | ✅ Oui (ses fichiers) |

---

## 📞 **Support**

### **Problème persistant ?**

1. **Vérifiez la console** :
   - F12 dans le navigateur
   - Onglet "Console"
   - Cherchez les erreurs en rouge

2. **Vérifiez les logs Supabase** :
   - Dashboard → Logs
   - Cherchez les erreurs récentes

3. **Réexécutez le script** :
   - Parfois une seconde exécution résout les problèmes

---

## ✅ **Checklist finale**

Avant de terminer, vérifiez que :

- [x] Le script SQL a été exécuté sans erreur
- [x] Le message "✅ CONFIGURATION TERMINÉE" s'affiche
- [x] Vous avez testé l'upload d'au moins un fichier
- [x] Le fichier s'affiche correctement dans l'application
- [x] Le chat IA s'ouvre automatiquement

---

## 🎉 **Félicitations !**

Votre Supabase est maintenant configuré pour accepter tous les types de documents !

**Prochaine étape :** Installez les packages npm pour activer DOCX et OCR

```bash
npm install mammoth tesseract.js
```

**Bon apprentissage ! 🚀**
