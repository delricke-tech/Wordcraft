# ⚡ DÉMARRAGE RAPIDE - ASSISTANT IA MULTI-DOCUMENTS

## 🎯 EN 3 ÉTAPES

### 1️⃣ VÉRIFIER LA CLÉ OPENAI

Ouvrez `.env` et assurez-vous d'avoir :

```bash
VITE_OPENAI_API_KEY=sk-proj-...votre_clé...
```

Si vous n'avez pas de clé :
1. Allez sur https://platform.openai.com/api-keys
2. Créez une nouvelle clé API
3. Ajoutez-la dans `.env`
4. Redémarrez l'app (`npm run dev`)

---

### 2️⃣ IMPORTER VOS COURS

1. Cliquez sur **"Assistant IA"** dans le menu
2. Cliquez sur **"Importer des cours"**
3. Sélectionnez **jusqu'à 20 fichiers** (PDF, DOCX, TXT, images)
4. Attendez l'extraction ⏳
5. ✅ Les documents apparaissent à gauche

---

### 3️⃣ INTERROGER L'IA

**Questions rapides pour commencer :**

```
"Résume-moi tous les cours"

"Quels sont les concepts clés ?"

"Crée un quiz de 10 questions"

"Compare ces différents documents"

"Explique-moi [concept] en détail"
```

---

## 🎬 EXEMPLE COMPLET

### Scénario : Révision d'examen de biologie

1. **Import** : Importez vos 5 cours de biologie (PDF)
2. **Résumé** : *"Résume chaque cours en 3 points clés"*
3. **Quiz** : *"Crée un quiz de 20 questions sur tous ces cours"*
4. **Approfondissement** : *"Explique-moi la photosynthèse en détail"*
5. **Fiche** : *"Génère une fiche de révision complète"*

---

## 📊 FORMATS SUPPORTÉS

| Format | Extension | Support | OCR |
|--------|-----------|---------|-----|
| PDF | `.pdf` | ✅ | - |
| Word | `.docx` | ✅ | - |
| Texte | `.txt` | ✅ | - |
| Image | `.jpg`, `.png` | ✅ | ✅ |

---

## 🆘 PROBLÈME ?

### L'IA ne répond pas
→ Vérifiez `VITE_OPENAI_API_KEY` dans `.env`

### "Erreur extraction"
→ Le PDF est peut-être protégé, essayez un autre format

### Extraction lente
→ Normal pour PDF/images (jusqu'à 10s par document)

---

## 📚 POUR ALLER PLUS LOIN

Consultez le guide complet :
👉 `GUIDE_ASSISTANT_IA_MULTI_DOCUMENTS.md`

---

**C'EST PRÊT ! Importez vos cours et commencez à poser des questions !** 🚀
