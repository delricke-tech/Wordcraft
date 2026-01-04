# ⚡ ACTIVATION EXPRESS - MODE VIDÉO PAYANT

## 🎯 VOUS AVEZ PAYÉ DAILY.CO → 3 ACTIONS MAINTENANT

---

## 1️⃣ COPIER VOTRE CLÉ API (30 secondes)

1. Ouvrez https://dashboard.daily.co
2. Cliquez sur **"Developers"** dans le menu
3. Cliquez sur **"API Keys"**
4. **Copiez** votre clé (long code)

---

## 2️⃣ MODIFIER .ENV (30 secondes)

Ouvrez le fichier `.env` à la racine du projet et ajoutez/décommentez :

```bash
VITE_DAILY_API_KEY=collez_votre_cle_ici
```

**⚠️ PAS DE # DEVANT LA LIGNE !**

**Sauvegardez** le fichier (`Ctrl + S`)

---

## 3️⃣ EXÉCUTER SQL + REDÉMARRER (2 minutes)

### A. SQL (1 minute)
1. https://supabase.com/dashboard → Votre projet
2. **SQL Editor** → **New query**
3. Copiez-collez ceci :

```sql
-- Ajouter colonne pour la vidéo
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS daily_room_url text;

CREATE INDEX IF NOT EXISTS idx_study_sessions_daily_url 
ON study_sessions(daily_room_url) 
WHERE daily_room_url IS NOT NULL;
```

4. Cliquez **RUN** (F5)
5. ✅ **Success !**

### B. Redémarrer (1 minute)
```powershell
# Dans le terminal
Ctrl + C
npm run dev
```

**Attendez 10 secondes**, puis **rafraîchissez** le navigateur (`F5`)

---

## ✅ TESTER

1. **Sessions** → **Créer une session**
2. **Rejoindre**
3. 🎥 **Votre caméra s'active !**

---

## 🎉 C'EST FAIT !

**Vidéo HD avec Daily.co Premium activée !**

### Ce qui fonctionne maintenant :
- ✅ Vidéo HD multi-participants
- ✅ Audio haute qualité
- ✅ Partage d'écran
- ✅ Enregistrement (selon votre plan)
- ✅ Minutes illimitées

---

## 🆘 PROBLÈME ?

### "Mode sans vidéo" s'affiche toujours ?
1. Vérifiez `.env` → `VITE_DAILY_API_KEY=...` (sans `#`)
2. Redémarrez : `Ctrl+C` puis `npm run dev`
3. Rafraîchissez : `F5`

### Erreur "Daily API" ?
→ Vérifiez que la clé est correcte sur dashboard.daily.co

### Pas de caméra ?
→ Autorisez l'accès caméra/micro dans votre navigateur

---

**RÉSUMÉ : Clé API → .env → SQL → Redémarrer → VIDÉO ! 🚀**
