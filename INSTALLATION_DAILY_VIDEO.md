# 🎥 INSTALLATION DAILY.CO - VIDÉO GRATUITE

## 💰 C'EST GRATUIT !

**Daily.co Plan Gratuit :**
- ✅ **10 000 minutes/mois** gratuites
- ✅ Jusqu'à **10 participants** simultanés
- ✅ Vidéo HD + Audio + Partage d'écran
- ✅ **Pas de carte bancaire** requise
- ✅ Pas de logo Daily.co dans la vidéo

---

## ⚡ INSTALLATION EN 5 MINUTES

### 1️⃣ CRÉER COMPTE DAILY.CO (2 minutes)

**Étape A : S'inscrire**
```
1. Aller sur https://dashboard.daily.co/signup
2. Choisir "Sign up with email"
3. Entrer votre email
4. Créer un mot de passe
5. Cliquer "Sign up"
6. Vérifier votre email (cliquer le lien)
```

**Étape B : Récupérer la clé API**
```
1. Se connecter sur https://dashboard.daily.co
2. Cliquer sur "Developers" (dans le menu latéral)
3. Cliquer sur "API Keys"
4. Copier la clé "Default API Key"
```

La clé ressemble à ça :
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

---

### 2️⃣ INSTALLER LES PACKAGES (1 minute)

```bash
# Dans le terminal PowerShell
cd "c:\Users\HP I5\Downloads\project"

# Installer Daily.co
npm install @daily-co/daily-js

# Vérifier l'installation
npm list @daily-co/daily-js
```

**Résultat attendu :**
```
@daily-co/daily-js@0.x.x
```

---

### 3️⃣ AJOUTER LA CLÉ DANS .env (30 secondes)

**Ouvrir le fichier `.env` et ajouter :**

```env
# Supabase (déjà présent)
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase

# Daily.co (AJOUTER CETTE LIGNE)
VITE_DAILY_API_KEY=votre_cle_daily_copiée
```

**Exemple complet :**
```env
VITE_SUPABASE_URL=https://pmjbcxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DAILY_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

### 4️⃣ EXÉCUTER LE SCRIPT SQL (30 secondes)

**Dans Supabase Dashboard :**
```
1. SQL Editor
2. Copier-coller tout le contenu de ADD_DAILY_COLUMN.sql
3. Cliquer RUN
4. Voir le message ✅ "Colonne daily_room_url ajoutée !"
```

---

### 5️⃣ REDÉMARRER L'APPLICATION (30 secondes)

```bash
# Arrêter le serveur (Ctrl+C)

# Relancer
npm run dev
```

**L'application va redémarrer avec la vidéo activée !**

---

## ✅ TESTER LA VIDÉO (2 minutes)

### Test 1 : Vérifier la configuration

1. Ouvrir http://localhost:5173
2. Se connecter
3. Aller dans "Sessions"
4. Créer une nouvelle session
5. Cliquer "Rejoindre"

**Résultat attendu :**
```
✅ "Connexion à la vidéo..." s'affiche
✅ Autorisation caméra/micro demandée
✅ Votre vidéo s'affiche
✅ Les contrôles fonctionnent
```

### Test 2 : Tester les contrôles

**Bouton Micro :**
```
Cliquer → Micro coupé (rouge)
Recliquer → Micro activé (gris)
```

**Bouton Vidéo :**
```
Cliquer → Caméra coupée (rouge)
Recliquer → Caméra activée (gris)
```

**Bouton Partage d'écran :**
```
Cliquer → Sélectionner fenêtre
→ Partage d'écran actif (bleu)
```

### Test 3 : Session multi-participants

**Option A : Avec 2 comptes différents**
```
1. Créer une session avec Compte A
2. Ouvrir en navigation privée
3. Se connecter avec Compte B
4. Rejoindre la même session
5. ✅ Vous voyez les 2 vidéos !
```

**Option B : Avec le même compte (2 onglets)**
```
1. Créer une session
2. Copier l'URL de la session
3. Ouvrir un nouvel onglet
4. Coller l'URL
5. ✅ Vous vous voyez 2 fois !
```

---

## 📊 CE QUI FONCTIONNE

### ✅ Fonctionnalités vidéo

- **Vidéo HD**
  - Qualité automatique (adapte à la connexion)
  - Jusqu'à 10 participants simultanés
  - Grille automatique

- **Audio**
  - Qualité haute définition
  - Suppression d'écho automatique
  - Réduction de bruit

- **Partage d'écran**
  - Partage fenêtre ou écran entier
  - Audio du système inclus
  - Qualité optimisée

- **Contrôles**
  - Activer/désactiver micro
  - Activer/désactiver caméra
  - Démarrer/arrêter partage d'écran
  - Quitter la session

### ✅ Intégration complète

- **Base de données**
  - URL de salle sauvegardée automatiquement
  - Même salle pour tous les participants
  - Persistance entre sessions

- **Interface**
  - Intégration native dans votre app
  - Pas de redirection vers Daily.co
  - Personnalisation complète

- **Chat + Vidéo**
  - Chat texte en parallèle de la vidéo
  - Liste des participants synchronisée
  - Statut vidéo/audio en temps réel

---

## 🆘 DÉPANNAGE

### Erreur : "Missing environment variable"

**Solution :**
```bash
# Vérifier que .env contient VITE_DAILY_API_KEY
type .env

# Si absent, ajouter la ligne
echo VITE_DAILY_API_KEY=votre_cle >> .env

# Redémarrer
npm run dev
```

---

### Erreur : "Cannot find module @daily-co/daily-js"

**Solution :**
```bash
# Réinstaller
npm install @daily-co/daily-js

# Si ça ne marche pas, nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

---

### La vidéo ne s'affiche pas

**Vérifications :**
```
1. F12 → Console → Chercher les erreurs
2. Vérifier que VITE_DAILY_API_KEY est dans .env
3. Vérifier que npm install a été exécuté
4. Redémarrer npm run dev
5. Autoriser caméra/micro dans le navigateur
```

---

### Caméra/Micro ne marche pas

**Sur Chrome/Edge :**
```
1. Cliquer sur l'icône 🔒 à gauche de l'URL
2. Autoriser Caméra et Micro
3. Rafraîchir la page (F5)
```

**Sur Firefox :**
```
1. Cliquer sur l'icône caméra barrée
2. Autoriser temporairement ou toujours
3. Rafraîchir la page
```

---

### Message "Mode sans vidéo"

**Causes possibles :**
```
1. VITE_DAILY_API_KEY non configurée
   → Ajouter dans .env

2. Clé API invalide
   → Vérifier qu'elle est complète (pas coupée)

3. npm run dev pas redémarré
   → Ctrl+C puis npm run dev
```

---

## 💡 ASTUCES

### Pour développer/tester

**Tester seul (sans 2ème compte) :**
```
1. Créer une session
2. Rejoindre normalement
3. Ouvrir un 2ème onglet
4. Aller dans la même session
5. Vous vous voyez 2 fois (normal)
```

**Désactiver la vidéo temporairement :**
```
# Commenter la ligne dans .env
# VITE_DAILY_API_KEY=...

# Ou supprimer la ligne
# Le chat fonctionnera toujours
```

### Limites du plan gratuit

**10 000 minutes/mois = :**
```
- 333 heures de 1 personne
- 166 heures de 2 personnes
- 83 heures de 3 personnes
- 33 heures de 10 personnes

Exemple : 50 sessions de 30 min avec 4 participants = 6 000 minutes
→ Toujours dans le gratuit !
```

**Si vous dépassez :**
```
Daily.co vous envoie un email
Vous pouvez :
- Passer au plan payant (~0.01€/minute)
- Ou limiter l'utilisation
```

---

## 📱 COMPATIBILITÉ

### Navigateurs supportés

✅ **Complètement supportés :**
- Chrome (Desktop + Mobile)
- Edge (Desktop + Mobile)
- Safari (Desktop + Mobile iOS 15+)
- Firefox (Desktop + Mobile)

⚠️ **Partiellement supportés :**
- Opera (Desktop)
- Brave (Desktop)

❌ **Non supportés :**
- Internet Explorer (obsolète)
- Navigateurs très anciens

### Appareils

✅ **Ordinateurs :**
- Windows 10/11
- macOS
- Linux

✅ **Mobiles/Tablettes :**
- iOS 15+ (iPhone/iPad)
- Android 8+

---

## 🎓 ALLER PLUS LOIN (Optionnel)

### Enregistrement des sessions

Daily.co permet d'enregistrer les sessions (payant) :

```typescript
// Démarrer l'enregistrement
await dailyCall.startRecording();

// Arrêter l'enregistrement
await dailyCall.stopRecording();

// L'enregistrement est disponible dans le dashboard Daily.co
```

**Coût :** ~0.01€ par minute enregistrée

### Personnalisation avancée

**Changer la disposition :**
```typescript
// Vue grille
await dailyCall.setInputDevices({
  videoEnabled: true,
  audioEnabled: true
});

// Vue présentateur
await dailyCall.setActiveSpeakerMode(true);
```

**Ajouter des effets :**
- Flou d'arrière-plan
- Fond virtuel
- Filtres beauté

Voir : https://docs.daily.co/reference/daily-js

---

## ✅ CHECKLIST COMPLÈTE

### Installation
- [ ] Compte Daily.co créé
- [ ] Clé API récupérée
- [ ] Package installé (`npm install @daily-co/daily-js`)
- [ ] Clé ajoutée dans `.env`
- [ ] Script SQL exécuté (`ADD_DAILY_COLUMN.sql`)
- [ ] Application redémarrée

### Tests
- [ ] Session créée
- [ ] Session rejointe
- [ ] Vidéo s'affiche
- [ ] Audio fonctionne
- [ ] Micro activé/désactivé
- [ ] Caméra activée/désactivée
- [ ] Partage d'écran fonctionne
- [ ] Chat fonctionne en parallèle
- [ ] Plusieurs participants testés

---

## 🎉 RÉSULTAT FINAL

**Vous avez maintenant :**
- ✅ Vidéo HD multi-participants
- ✅ Audio haute qualité
- ✅ Partage d'écran
- ✅ Chat en temps réel
- ✅ Gestion participants
- ✅ Interface professionnelle
- ✅ **100% GRATUIT** (jusqu'à 10 000 min/mois)

**Total temps d'installation : ~5 minutes**

**Questions ?** Je suis là pour vous aider ! 🚀
