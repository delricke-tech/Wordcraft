# 🚀 Guide Rapide de Test - IA Activée

## ⚡ Test en 3 Minutes

### 1️⃣ Upload d'un PDF avec Accents (30 sec)

```
1. Allez sur http://localhost:5173/library
2. Cliquez "Upload PDF"
3. Choisissez un PDF avec accents, ex: "Cours Été 2024.pdf"
4. ✅ Vérifiez que le nom s'affiche AVEC les accents
```

### 2️⃣ Extraction de Texte (1 min)

```
1. Cliquez sur le document uploadé
2. Cliquez "Extraire le texte"
3. ✅ Attendez l'extraction (logs dans console F12)
4. ✅ Vérifiez les stats : pages, mots, caractères
5. ✅ Vérifiez l'aperçu du texte extrait
```

### 3️⃣ Assistant IA (1 min 30)

```
1. Cliquez le bouton à droite (chevron)
2. ✅ Le panneau Glassmorphism s'ouvre (fond flou)
3. ✅ Le titre affiche le nom avec accents
4. Cliquez "Résumer"
5. ✅ L'IA génère un résumé du PDF
6. ✅ Le Markdown s'affiche correctement (pas d'erreur)
```

## 🎯 Résultats Attendus

### ✅ Upload
- Nom affiché : `Cours Été 2024.pdf` (AVEC accents)
- Pas d'erreur "Invalid key"

### ✅ Extraction
Console logs :
```
📄 ===== EXTRACTION TEXTE PDF =====
📥 Téléchargement PDF depuis Supabase Storage...
✅ PDF téléchargé: [taille] bytes
📖 PDF chargé avec succès. Pages: [N]
✅ Extraction complète
```

### ✅ IA
- Panneau translucide avec flou ✓
- Titre avec accents ✓
- Résumé généré ✓
- Markdown sans erreur ✓

## 🐛 Si Problème

### Erreur "Invalid key"
→ Vérifiez que `storage_path` est utilisé (pas `name`)

### Texte non extrait
→ Vérifiez console (F12) pour les erreurs

### IA ne répond pas
→ Vérifiez `VITE_OPENAI_API_KEY` dans `.env`

### Glassmorphism invisible
→ Rechargez la page (Ctrl+R)

---

**Temps total : 3 minutes ⏱️**

