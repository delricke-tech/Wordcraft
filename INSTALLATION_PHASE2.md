# 🚀 Installation Rapide - Phase 2

## Étape 1 : Installer les dépendances

```bash
npm install
```

Cette commande va installer `pdfjs-dist` automatiquement.

---

## Étape 2 : Vérifier votre fichier .env

Assurez-vous que votre `.env` contient :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon

# OpenAI (OBLIGATOIRE pour les quiz)
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

---

## Étape 3 : Redémarrer le serveur

Si le serveur tourne déjà :

```bash
# Arrêtez avec Ctrl+C
# Puis relancez :
npm run dev
```

---

## Étape 4 : Tester !

### Test 1 : Upload un PDF
1. Allez dans **Bibliothèque**
2. Uploadez un PDF (cours, livre, document)

### Test 2 : Extraire le texte
1. Cliquez sur le document
2. Cliquez sur **"Extraire le texte"**
3. Attendez l'extraction (quelques secondes)

### Test 3 : Générer un quiz
1. Cliquez sur **"Générer un Quiz"**
2. Attendez la génération (10-15 secondes)
3. Répondez aux 5 questions !

---

## ✅ Tout est prêt !

**Phase 2 complète :**
- ✅ Extraction de texte PDF
- ✅ Génération de quiz avec IA
- ✅ Interface interactive

**Profitez de vos quiz automatiques !** 🎉
