# 📚 Guide d'utilisation : Support Multi-Formats

## 🎉 Nouveauté : Votre application supporte maintenant plusieurs types de documents !

Date : 31 décembre 2024

---

## 📋 **Types de fichiers supportés**

| Type | Formats acceptés | Extraction IA | Visualisation | Statut |
|------|------------------|---------------|---------------|--------|
| **PDF** | `.pdf` | ✅ Automatique | ✅ Lecteur intégré | ✅ Opérationnel |
| **Texte** | `.txt` | ✅ Automatique | ✅ Affichage formaté | ✅ Opérationnel |
| **Word** | `.docx`, `.doc` | ✅ Automatique* | ⏳ Téléchargement | ✅ Opérationnel* |
| **Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | ✅ OCR* | ✅ Visionneuse | ✅ Opérationnel* |
| **Vidéo** | `.mp4`, `.avi`, `.mov`, `.webm` | ⏳ Bientôt (Whisper) | ✅ Lecteur intégré | ✅ Opérationnel |
| **Audio** | `.mp3`, `.wav`, `.ogg` | ⏳ Bientôt (Whisper) | ✅ Lecteur intégré | ✅ Opérationnel |

\* *Nécessite l'installation de packages supplémentaires (voir ci-dessous)*

---

## 🚀 **Installation des fonctionnalités avancées**

### **1. Extraction DOCX (Word)**

Pour activer l'extraction automatique du texte des fichiers Word :

```bash
npm install mammoth
```

**Que fait ce package ?**
- Extrait le texte des fichiers `.docx` et `.doc`
- Préserve la structure des paragraphes
- Permet à l'IA de répondre à vos questions sur vos documents Word

### **2. OCR pour Images**

Pour activer la reconnaissance de texte dans les images :

```bash
npm install tesseract.js
```

**Que fait ce package ?**
- Lit le texte dans les images (documents scannés, photos, captures d'écran)
- Support multilingue (français + anglais)
- Permet à l'IA d'analyser le texte contenu dans vos images

**⚠️ Note :** L'OCR peut prendre 10-30 secondes selon la taille de l'image.

### **3. Installation groupée (recommandé)**

Pour installer les deux en une seule commande :

```bash
npm install mammoth tesseract.js
```

---

## 📖 **Comment utiliser**

### **Upload de documents**

1. **Cliquez sur** le bouton **"Ajouter documents"** (violet-bleu)
2. **Sélectionnez** un ou plusieurs fichiers
3. **Attendez** l'upload et l'extraction automatique
4. **Le chat IA s'ouvre automatiquement** quand c'est prêt !

### **Visualiser un document**

1. **Cliquez** sur n'importe quel document dans votre bibliothèque
2. Le document s'affiche en plein écran
3. **Types d'affichage :**
   - **PDF** : Lecteur PDF intégré avec zoom
   - **TXT** : Texte formaté et lisible
   - **Images** : Visionneuse haute résolution
   - **Vidéo** : Lecteur vidéo avec contrôles
   - **Audio** : Lecteur audio moderne
   - **DOCX** : Téléchargement (aperçu bientôt)

### **Discuter avec l'IA**

1. **Ouvrez** un document
2. **Attendez** que le chat s'ouvre automatiquement (bulle violette)
3. **Posez vos questions** ou utilisez les suggestions
4. **L'IA analyse** le contenu du document pour répondre

---

## 🎯 **Exemples d'utilisation**

### **📄 Documents PDF**
- Cours universitaires
- Rapports médicaux
- Articles scientifiques
- Livres numériques

### **📝 Fichiers texte**
- Notes de cours
- Résumés
- Code source
- Scripts

### **📷 Images avec texte**
- Documents scannés
- Captures d'écran
- Photos de tableaux blancs
- Diapositives photographiées

### **📄 Documents Word**
- Mémoires
- Thèses
- Rapports de stage
- Devoirs

### **🎥 Vidéos**
- Cours enregistrés
- Tutoriels
- Conférences
- Présentations

### **🎵 Audio**
- Podcasts éducatifs
- Cours audio
- Enregistrements de conférences
- Notes vocales

---

## 🤖 **Capacités de l'IA**

L'IA peut vous aider avec :

✅ **Résumés automatiques**
- Synthèse du contenu principal
- Points clés à retenir
- Structure du document

✅ **Questions-Réponses**
- Réponses basées sur le contenu
- Explications de concepts
- Définitions et exemples

✅ **Analyse approfondie**
- Relations entre concepts
- Formules mathématiques
- Cas cliniques (médecine)

✅ **Génération de contenu**
- Flashcards automatiques
- Quiz personnalisés
- Plans de révision

---

## ⚡ **Performances**

### **Temps d'extraction moyen**

| Type | Taille | Temps |
|------|--------|-------|
| PDF (10 pages) | 2 MB | ~5 secondes |
| TXT | 100 KB | <1 seconde |
| Image (OCR) | 2 MB | ~15-30 secondes |
| DOCX | 1 MB | ~2-3 secondes |
| Vidéo/Audio | N/A | Instantané (pas d'extraction) |

### **Optimisations**

- ✅ Extraction en arrière-plan (non bloquante)
- ✅ Sauvegarde en base de données (pas de ré-extraction)
- ✅ Cache intelligent
- ✅ Ouverture automatique du chat quand prêt

---

## 🔧 **Dépannage**

### **"Extraction DOCX pas encore implémentée"**

**Solution :** Installez le package mammoth

```bash
npm install mammoth
```

Puis redémarrez le serveur :

```bash
npm run dev
```

### **"Extraction via OCR pas encore implémentée"**

**Solution :** Installez le package tesseract.js

```bash
npm install tesseract.js
```

Puis redémarrez le serveur.

### **L'OCR est trop lent**

**Normal !** L'OCR prend 10-30 secondes. Solutions :

1. Utilisez des images de meilleure qualité (plus rapide)
2. Réduisez la taille des images avant upload
3. Convertissez en PDF si possible

### **Le texte OCR est incorrect**

**Causes possibles :**
- Image de mauvaise qualité
- Texte trop petit
- Langue non supportée (actuellement : français + anglais)

**Solutions :**
1. Utilisez une image plus nette
2. Augmentez la résolution
3. Assurez-vous que le texte est horizontal

---

## 🚧 **Fonctionnalités à venir**

### **Transcription audio/vidéo** ⏳
- Utilisation de Whisper AI d'OpenAI
- Transcription automatique en français
- Horodatage des segments
- Recherche dans les transcriptions

### **Support de nouveaux formats** ⏳
- PowerPoint (`.pptx`)
- Excel (`.xlsx`)
- Markdown (`.md`)
- Code source (`.py`, `.js`, etc.)

### **Améliorations OCR** ⏳
- Support de plus de langues
- Détection automatique de la langue
- Correction orthographique automatique
- Extraction de tableaux

---

## 💡 **Conseils d'utilisation**

### **Pour de meilleurs résultats :**

1. **Qualité des fichiers**
   - Utilisez des PDF natifs plutôt que scannés
   - Images haute résolution pour l'OCR
   - Documents Word bien formatés

2. **Organisation**
   - Créez des dossiers par matière
   - Nommez vos fichiers clairement
   - Utilisez les favoris pour l'accès rapide

3. **IA**
   - Posez des questions précises
   - Utilisez les suggestions proposées
   - Le contexte compte : l'IA analyse le document entier

---

## 📞 **Support**

Des questions ? Des problèmes ?

1. Consultez la console du navigateur (F12)
2. Vérifiez que les packages sont installés
3. Redémarrez le serveur de développement

---

## 🎉 **Profitez de votre application multi-formats !**

Uploadez vos documents, laissez l'IA les analyser, et concentrez-vous sur l'apprentissage !

**Bon apprentissage ! 🚀📚**
