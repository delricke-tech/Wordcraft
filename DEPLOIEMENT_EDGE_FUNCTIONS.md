# 🚀 Guide de déploiement des Edge Functions

## ⚠️ IMPORTANT : Les Edge Functions doivent être déployées depuis le Dashboard Supabase

Les Edge Functions ont été mises à jour avec une meilleure gestion d'erreur, mais le déploiement via CLI échoue localement.

**Solution recommandée : Utiliser le Dashboard Supabase**

---

## 📋 Méthode 1 : Déploiement via le Dashboard (RECOMMANDÉ)

### Étape 1 : Accéder au Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet : **uexuecubafgfhpfebknt**
3. Dans le menu de gauche, cliquez sur **"Edge Functions"**

---

### Étape 2 : Créer/Mettre à jour `generate-quiz`

1. Cliquez sur **"New function"** (ou éditez si elle existe déjà)
2. Nom : `generate-quiz`
3. Copiez le contenu de `supabase/functions/generate-quiz/index.ts`
4. Collez dans l'éditeur
5. Cliquez sur **"Deploy"**

---

### Étape 3 : Créer/Mettre à jour `generate-flashcards`

1. Cliquez sur **"New function"**
2. Nom : `generate-flashcards`
3. Copiez le contenu de `supabase/functions/generate-flashcards/index.ts`
4. Collez dans l'éditeur
5. Cliquez sur **"Deploy"**

---

### Étape 4 : Créer/Mettre à jour `chat-ai`

1. Cliquez sur **"New function"**
2. Nom : `chat-ai`
3. Copiez le contenu de `supabase/functions/chat-ai/index.ts`
4. Collez dans l'éditeur
5. Cliquez sur **"Deploy"**

---

## 📋 Méthode 2 : Déploiement via CLI (Alternative)

### Prérequis

```powershell
# Vérifier que Supabase CLI est installé
supabase --version

# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref uexuecubafgfhpfebknt
```

### Déployer les fonctions

```powershell
# Déployer chaque fonction une par une
supabase functions deploy generate-quiz
supabase functions deploy generate-flashcards
supabase functions deploy chat-ai
```

**Note :** Si vous obtenez une erreur "Docker is not running", utilisez la méthode Dashboard à la place.

---

## 🔑 Vérifier que la clé OpenAI est configurée

### Via le Dashboard

1. Dashboard Supabase → Edge Functions
2. Cliquez sur **"Manage secrets"** (icône ⚙️)
3. Vérifiez qu'il existe : **`OPENAI_API_KEY`**
4. Si absent, ajoutez-le :
   - Name: `OPENAI_API_KEY`
   - Value: `sk-proj-VOTRE_CLE_ICI`

### Via CLI

```powershell
# Définir le secret
supabase secrets set OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI

# Vérifier
supabase secrets list
```

---

## 🧪 Tester après déploiement

1. **Rechargez votre application** (F5)
2. **Ouvrez la console** du navigateur (F12)
3. **Testez une fonctionnalité IA** (génération de quiz, flashcards, ou chat)
4. **Regardez les logs** :
   - Console navigateur : Vous verrez maintenant le message d'erreur détaillé
   - Dashboard Supabase : Edge Functions → Sélectionnez une fonction → Onglet "Logs"

---

## 🔍 Comprendre les erreurs

Maintenant, les Edge Functions retournent des erreurs détaillées :

```json
{
  "error": "Message d'erreur principal",
  "details": "Détails complets de l'erreur",
  "timestamp": "2026-01-04T..."
}
```

**Erreurs courantes :**

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Clé OpenAI non configurée" | Secret `OPENAI_API_KEY` absent | Ajouter le secret dans Dashboard |
| "Non authentifié" | Session expirée | Se reconnecter |
| "Texte et nom du document requis" | Paramètres manquants | Vérifier l'appel depuis le frontend |
| "Erreur OpenAI: 401" | Clé API invalide | Vérifier la clé OpenAI |
| "Erreur OpenAI: 429" | Quota dépassé | Attendre ou upgrader le plan OpenAI |

---

## 📊 Vérifier les logs dans Supabase

1. Dashboard Supabase → **Edge Functions**
2. Cliquez sur une fonction (ex: `generate-quiz`)
3. Onglet **"Logs"**
4. Vous verrez :
   - Les requêtes reçues
   - Les erreurs détaillées
   - Les appels OpenAI
   - Les réponses générées

---

## ✅ Ce qui a été amélioré

Les 3 Edge Functions ont été mises à jour avec :

1. **Gestion d'erreur détaillée** : Plus de détails sur ce qui ne va pas
2. **Logs améliorés** : Stack trace complète dans les logs
3. **Timestamp** : Pour tracer quand l'erreur s'est produite
4. **Format JSON cohérent** : Toutes les erreurs dans le même format

---

## 🎯 Prochaines étapes

1. **Déployez les 3 fonctions** (via Dashboard ou CLI)
2. **Vérifiez que `OPENAI_API_KEY` est configurée**
3. **Testez dans votre application**
4. **Consultez les logs** pour comprendre l'erreur exacte
5. **Revenez ici** avec le message d'erreur complet si besoin

---

**Date de création :** 4 janvier 2026  
**Fichiers mis à jour :**
- `supabase/functions/generate-quiz/index.ts`
- `supabase/functions/generate-flashcards/index.ts`
- `supabase/functions/chat-ai/index.ts`
