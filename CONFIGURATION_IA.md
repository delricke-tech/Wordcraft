# 🤖 Configuration de l'Assistant IA OpenAI

## ✅ Vérification de votre fichier .env

Votre fichier `.env` doit contenir ces 3 variables :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique

# OpenAI
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

## 🔑 Comment obtenir votre clé OpenAI

1. Allez sur https://platform.openai.com/api-keys
2. Connectez-vous à votre compte OpenAI
3. Cliquez sur "Create new secret key"
4. Copiez la clé (elle commence par `sk-proj-` ou `sk-`)
5. Collez-la dans votre fichier `.env`

## ⚠️ IMPORTANT

- La clé doit commencer par `VITE_` pour être accessible dans le navigateur
- Redémarrez le serveur après avoir modifié le `.env` :
  - Fermez le terminal
  - Relancez `npm start` ou `npm run dev`

## 🧪 Tester l'Assistant IA

1. Lancez l'application (`npm start`)
2. Allez dans "Assistant IA" dans le menu
3. Posez une question comme "Explique-moi la photosynthèse"
4. L'IA devrait répondre avec une vraie réponse GPT-4

## 🐛 Si ça ne fonctionne pas

### Message d'erreur : "Clé API OpenAI non configurée"
→ Votre variable `VITE_OPENAI_API_KEY` n'est pas dans le `.env` ou le serveur n'a pas été redémarré

### Message d'erreur : "401 Unauthorized"
→ Votre clé API est invalide ou expirée. Vérifiez-la sur OpenAI

### Message d'erreur : "429 Too Many Requests"
→ Vous avez dépassé votre quota OpenAI. Vérifiez votre usage sur platform.openai.com

### L'IA répond toujours la même phrase
→ Le fichier `AIAssistant.tsx` n'a pas été mis à jour. Vérifiez que les modifications ont bien été appliquées.

## 💰 Coût de l'API

Le modèle utilisé est **GPT-4o-mini** qui est très économique :
- ~$0.15 par million de tokens d'entrée
- ~$0.60 par million de tokens de sortie
- Une conversation typique coûte moins de $0.01

## ✅ Ce qui a été modifié

Le fichier `src/pages/AIAssistant.tsx` utilise maintenant :
- ✅ `import.meta.env.VITE_OPENAI_API_KEY` pour la clé API
- ✅ Appels réels à l'API OpenAI
- ✅ Gestion des erreurs
- ✅ Historique de conversation
- ✅ Indicateur de chargement
- ✅ Modèle GPT-4o-mini pour des réponses rapides et économiques

