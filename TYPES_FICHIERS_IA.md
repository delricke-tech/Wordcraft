# 🤖 Types de Fichiers Supportés par l'IA WordCraft

**Date de mise à jour** : 5 janvier 2025  
**Statut** : ✅ **TOUS LES TYPES SONT FONCTIONNELS**

---

## ✅ FICHIERS QUE L'IA PEUT LIRE ET COMPRENDRE

### 📄 1. Documents Textuels (Extraction Automatique Complète)

| Type | Extensions | Bibliothèque | L'IA peut lire le contenu |
|------|------------|--------------|---------------------------|
| **PDF** | `.pdf` | pdfjs-dist | ✅ **OUI** - Texte complet |
| **Word** | `.docx`, `.doc` | mammoth | ✅ **OUI** - Texte complet |
| **PowerPoint** | `.pptx`, `.ppt` | pizzip | ✅ **OUI** - Texte de chaque diapositive |
| **Excel** | `.xlsx`, `.xls` | xlsx | ✅ **OUI** - Toutes les feuilles (format tabulaire) |
| **Texte** | `.txt`, `.md`, `.csv` | Natif | ✅ **OUI** - Texte brut |

**Résultat** : L'IA peut répondre à vos questions basées sur le **contenu réel** de ces documents.

---

### 📸 2. Images avec Texte (OCR Automatique)

| Type | Extensions | Technologie | L'IA peut lire le contenu |
|------|------------|-------------|---------------------------|
| **Photos/Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp` | Tesseract.js OCR | ✅ **OUI** - Texte extrait automatiquement |

**Langues supportées** : Français + Anglais  
**Temps de traitement** : 10-30 secondes par image  
**Qualité** : Dépend de la lisibilité du texte dans l'image

**Exemple** :
- ✅ Photo d'un cours écrit au tableau → L'IA peut lire le texte
- ✅ Capture d'écran d'un document → L'IA peut lire le texte
- ✅ Photo d'une page de livre → L'IA peut lire le texte
- ❌ Photo d'un paysage sans texte → L'IA ne peut rien extraire

---

## ❌ FICHIERS QUE L'IA NE PEUT PAS LIRE

### 🎥 Vidéos (Non supporté)

| Type | Extensions | Raison |
|------|------------|--------|
| **Vidéo** | `.mp4`, `.avi`, `.mov`, `.webm`, `.mkv` | Pas de transcription audio automatique |

**Solution** : Utilisez un service de transcription externe (Otter.ai, Rev.com, YouTube sous-titres), puis importez le texte transcrit en fichier `.txt`

---

### 🎵 Audio (Non supporté)

| Type | Extensions | Raison |
|------|------------|--------|
| **Audio** | `.mp3`, `.wav`, `.ogg`, `.aac`, `.flac` | Pas de transcription vocale automatique |

**Solution** : Utilisez un service de transcription externe, puis importez le texte transcrit en fichier `.txt`

---

## 📊 TABLEAU RÉCAPITULATIF COMPLET

| Type de Fichier | L'IA peut lire | Extraction | Temps | Qualité |
|-----------------|----------------|------------|-------|---------|
| **PDF** | ✅ OUI | Automatique | < 5s | 🟢 Excellente |
| **DOCX** | ✅ OUI | Automatique | < 3s | 🟢 Excellente |
| **PPTX** | ✅ OUI | Automatique | < 5s | 🟢 Excellente |
| **XLSX** | ✅ OUI | Automatique | < 5s | 🟢 Excellente |
| **TXT/MD/CSV** | ✅ OUI | Instantané | < 1s | 🟢 Excellente |
| **Images (JPG, PNG, etc.)** | ✅ OUI | OCR | 10-30s | 🟡 Bonne* |
| **Vidéo (MP4, AVI, etc.)** | ❌ NON | - | - | - |
| **Audio (MP3, WAV, etc.)** | ❌ NON | - | - | - |

*La qualité de l'OCR dépend de la lisibilité du texte dans l'image

---

## 🎯 CE QUE L'IA PEUT FAIRE AVEC VOS FICHIERS

### ✅ Avec les Documents et Images supportés :

1. **Lire et comprendre le contenu complet**
   - "Résume-moi ce document PDF"
   - "Quels sont les concepts clés de ce cours DOCX ?"

2. **Répondre à des questions précises**
   - "Quelle est la définition de X dans ce document ?"
   - "Explique-moi la section 3 du PowerPoint"

3. **Analyser plusieurs documents en même temps**
   - "Compare ces deux cours"
   - "Quels sont les points communs entre ces 5 PDFs ?"

4. **Créer du contenu basé sur vos documents**
   - "Crée-moi un quiz sur ce cours"
   - "Génère des flashcards à partir de ce PDF"

5. **Extraire des informations structurées**
   - "Liste tous les concepts importants"
   - "Résume chaque chapitre en 3 points"

### ❌ Avec les Vidéos et Audio :

L'IA ne peut pas :
- Transcrire automatiquement
- Comprendre le contenu audio/vidéo
- Répondre à des questions sur ces fichiers

**Solution** : Transcrivez d'abord avec un outil externe, puis importez le texte.

---

## 🚀 COMMENT UTILISER

### 1. Importer vos fichiers

Dans l'**Assistant IA**, cliquez sur **"Importer"** et sélectionnez vos fichiers :
- ✅ PDF, DOCX, PPTX, XLSX, TXT
- ✅ JPG, PNG, GIF, BMP, WEBP

### 2. Attendre l'extraction

- Documents : Quelques secondes
- Images : 10-30 secondes (OCR)

### 3. Poser vos questions

L'IA a maintenant accès au **contenu complet** de vos fichiers et peut répondre à toutes vos questions !

---

## 💡 CONSEILS POUR DE MEILLEURS RÉSULTATS

### Pour les Images (OCR) :

- ✅ Utilisez des images nettes et bien éclairées
- ✅ Le texte doit être lisible (pas trop petit)
- ✅ Évitez les photos floues ou mal cadrées
- ✅ Préférez les captures d'écran aux photos de documents

### Pour les Documents :

- ✅ Les PDF avec texte sélectionnable fonctionnent mieux que les PDF scannés
- ✅ Pour les PDF scannés, convertissez-les en images et utilisez l'OCR
- ✅ Les fichiers Excel sont extraits en format tabulaire (lignes et colonnes)

### Pour les Vidéos/Audio :

- ❌ Transcrivez d'abord avec :
  - **Otter.ai** (gratuit, 300 min/mois)
  - **Rev.com** (payant, très précis)
  - **YouTube** (sous-titres automatiques)
- ✅ Puis importez le texte transcrit en fichier `.txt`

---

## 🎉 RÉSUMÉ

### ✅ L'IA PEUT LIRE :
- **Documents** : PDF, DOCX, PPTX, XLSX, TXT ✅
- **Images avec texte** : JPG, PNG, GIF, BMP, WEBP ✅

### ❌ L'IA NE PEUT PAS LIRE :
- **Vidéos** : MP4, AVI, MOV ❌
- **Audio** : MP3, WAV, OGG ❌

---

**🎯 Conclusion** : Votre IA WordCraft peut maintenant lire et comprendre le contenu de **TOUS les types de documents textuels et images** que vous lui donnez !

**📚 Prêt à importer vos cours et poser vos questions !**
