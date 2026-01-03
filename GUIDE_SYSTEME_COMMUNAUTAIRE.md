# 🌐 SYSTÈME COMMUNAUTAIRE COMPLET - GUIDE D'INSTALLATION

## 🎯 OBJECTIF

Transformer WordCraft en une **vraie communauté sociale** comme Facebook où les utilisateurs peuvent :

✅ **Découvrir de nouveaux utilisateurs**  
✅ **Envoyer des demandes de connexion/amis**  
✅ **Voir un feed communautaire** (posts de tous)  
✅ **Suggestions intelligentes** (même école, domaine)  
✅ **Retrouver des connaissances**  
✅ **Rechercher des personnes**  
✅ **Notifications en temps réel**  

---

## 📦 CE QUI A ÉTÉ CRÉÉ

### 1. **Script SQL Complet** 
**Fichier :** `SCRIPT_COMMUNAUTE_SOCIALE.sql`

**Contenu :**
- ✅ Table `connection_requests` (demandes de connexion)
- ✅ Table `connections` (connexions actives/amis)
- ✅ Fonctions RPC : `accept_connection_request`, `reject_connection_request`
- ✅ Fonction `get_user_suggestions` (suggestions personnalisées)
- ✅ Fonction `get_community_feed` (feed de toute la communauté)
- ✅ Fonction `search_users` (recherche d'utilisateurs)
- ✅ Vues : `new_users`, `recently_active_users`, `popular_users`
- ✅ Notifications automatiques pour connexions
- ✅ Amélioration table `profiles` (champs sociaux)

### 2. **Page Découvrir** 
**Fichier :** `src/pages/Discover.tsx`

**Fonctionnalités :**
- ✅ **Suggestions personnalisées** (même école, domaine, amis en commun)
- ✅ **Nouveaux membres** (inscrits récemment)
- ✅ **Recherche en temps réel** (nom, école, domaine)
- ✅ **Demandes de connexion** en attente (accepter/refuser)
- ✅ **Cartes utilisateurs** avec badges (même école, domaine)
- ✅ Bouton "Se connecter" pour envoyer une demande
- ✅ Stats visibles (nombre de connexions)

### 3. **Navigation Mise à Jour**
**Fichiers :** `src/App.tsx`, `src/components/layout/Sidebar.tsx`

**Ajouts :**
- ✅ Route `/discover` ajoutée
- ✅ Icône "Découvrir" (Compass) dans la sidebar
- ✅ Accessible depuis le menu principal

---

## 🚀 INSTALLATION EN 3 ÉTAPES

### ÉTAPE 1 : Exécuter le Script SQL

1. **Ouvrez Supabase Dashboard** : https://supabase.com/dashboard
2. **Allez dans SQL Editor**
3. **Ouvrez le fichier** : `SCRIPT_COMMUNAUTE_SOCIALE.sql`
4. **Copiez TOUT le contenu** (Ctrl+A, Ctrl+C)
5. **Collez dans SQL Editor**
6. **Cliquez sur RUN** (▶️)
7. **Attendez** le message de succès

**Message attendu :**
```
✅ Système communautaire installé avec succès !

📋 Éléments créés :
   - Table connection_requests (demandes de connexion)
   - Table connections (connexions actives)
   - Fonctions : accept_connection_request, reject_connection_request
   - Fonction : get_user_suggestions (suggestions personnalisées)
   - Fonction : get_community_feed (feed communautaire)
   - Fonction : search_users (recherche utilisateurs)
   - Vues : new_users, recently_active_users, popular_users
   - Notifications automatiques pour connexions
```

---

### ÉTAPE 2 : Redémarrer l'Application

```bash
# Dans votre terminal
Ctrl+C  # Arrêter le serveur

npm run dev  # Relancer
```

---

### ÉTAPE 3 : Tester la Page Découvrir

```
http://localhost:5174/discover
```

---

## 🎨 FONCTIONNALITÉS DÉTAILLÉES

### 1. **Suggestions Personnalisées** 🎯

**Algorithme intelligent** qui suggère des utilisateurs basé sur :

```typescript
Score de suggestion :
+50 points → Même institution
+30 points → Même domaine d'étude
+2 points par connexion existante
+0.1 points par vue de profil
```

**Badges affichés :**
- 🔵 **"Même école"** (institution commune)
- 🟣 **"Même domaine"** (study_field commun)
- 🟢 **"X ami(s) en commun"** (connexions mutuelles)

**Exemple de résultat :**
```
┌─────────────────────────┐
│  👤 Jean Dupont         │
│  🎓 Médecine            │
│  📍 Université Paris    │
│                         │
│ 🔵 Même école           │
│ 🟣 Même domaine         │
│ 🟢 3 amis en commun     │
│                         │
│ 👥 12 connexions        │
│ [Se connecter]          │
└─────────────────────────┘
```

---

### 2. **Nouveaux Membres** 🆕

Affiche les **utilisateurs récemment inscrits** (derniers 30 jours).

**Tri :** Par date d'inscription (plus récent en premier)

**Utilité :** 
- Découvrir les nouveaux arrivants
- Être parmi les premiers à se connecter
- Créer une communauté accueillante

---

### 3. **Recherche Intelligente** 🔍

**Recherche en temps réel** dès que vous tapez 3+ caractères.

**Champs recherchés :**
- Nom complet (`full_name`)
- Email
- Domaine d'étude (`study_field`)
- Institution

**Tri des résultats :**
1. Correspondance exacte au début du nom
2. Correspondance partielle dans le nom
3. Correspondance dans autres champs
4. Tri par nombre de connexions (populaires en premier)

**Exemple :**
```
Recherche : "marie"

Résultats :
1. Marie Dubois (début exact)
2. Marie-Claire Martin (début exact)
3. Jean-Marie Lefebvre (partiel)
4. Université Marie Curie (autre champ)
```

---

### 4. **Demandes de Connexion** 💌

**Section spéciale** en haut de la page quand vous avez des demandes en attente.

**Fonctionnalités :**
- ✅ **Accepter** → Crée une connexion active
- ❌ **Refuser** → Rejette la demande
- 🔔 **Notifications automatiques** pour :
  - Réception de demande
  - Acceptation de demande

**Flux complet :**
```
Utilisateur A                    Utilisateur B
    |                                |
    | Clic "Se connecter"           |
    |------------------------------>|
    |                                | Reçoit notification
    |                                | Voir dans "Demandes"
    |                                |
    |                                | Clic "Accepter"
    | Reçoit notification           |<-
    | "B a accepté"                 |
    |                                |
    | Connexion active créée        |
    | Compteur +1 pour les deux     |
```

---

### 5. **Cartes Utilisateurs** 🎴

**Design moderne** avec toutes les infos importantes :

```
Structure :
┌───────────────────┐
│   [Avatar 80px]   │
│                   │
│  Nom Complet      │
│  🎓 Domaine       │
│  📍 Institution   │
│                   │
│  [Badges]         │
│                   │
│  👥 X connexions  │
│                   │
│  [Bouton Action]  │
└───────────────────┘
```

**Boutons selon contexte :**
- **Page Découvrir** → "Se connecter"
- **Demandes reçues** → "Accepter" / "Refuser"
- **Résultats recherche** → "Se connecter"

---

## 🔧 CONFIGURATION AVANCÉE

### Personnaliser les Suggestions

**Modifier le score dans le SQL :**
```sql
-- Dans get_user_suggestions()
CASE WHEN p.institution = ... THEN 100 ELSE 0 END +  -- Augmenter poids école
CASE WHEN p.study_field = ... THEN 50 ELSE 0 END +   -- Augmenter poids domaine
```

### Limiter le Nombre de Suggestions

```typescript
// Dans Discover.tsx
const { data: suggestionsData } = await supabase.rpc('get_user_suggestions', {
  for_user_id: user.id,
  limit_count: 30,  // Changer de 20 à 30
});
```

### Ajouter des Filtres

**Exemple : Filtrer par année d'étude**
```typescript
// Ajouter un dropdown
<select onChange={(e) => setYearFilter(e.target.value)}>
  <option value="">Toutes les années</option>
  <option value="1">1ère année</option>
  <option value="2">2ème année</option>
  ...
</select>

// Filtrer les suggestions
const filtered = suggestions.filter(s => 
  !yearFilter || s.year_of_study === parseInt(yearFilter)
);
```

---

## 📊 DONNÉES DE TEST

### Créer des Utilisateurs de Test

```sql
-- Dans Supabase SQL Editor
INSERT INTO profiles (id, email, full_name, study_field, institution, connections_count)
VALUES
  (gen_random_uuid(), 'user1@test.com', 'Alice Martin', 'Médecine', 'Université Paris', 5),
  (gen_random_uuid(), 'user2@test.com', 'Bob Durand', 'Médecine', 'Université Paris', 12),
  (gen_random_uuid(), 'user3@test.com', 'Claire Lefebvre', 'Informatique', 'Université Lyon', 8),
  (gen_random_uuid(), 'user4@test.com', 'David Bernard', 'Droit', 'Université Bordeaux', 3);
```

### Créer des Connexions de Test

```sql
-- Connecter Alice et Bob
INSERT INTO connections (user_id_1, user_id_2)
VALUES (
  (SELECT id FROM profiles WHERE email = 'user1@test.com'),
  (SELECT id FROM profiles WHERE email = 'user2@test.com')
);
```

---

## ✅ TESTS À EFFECTUER

### 1. Page Découvrir
- [ ] Accéder à `/discover`
- [ ] Voir les suggestions personnalisées
- [ ] Onglet "Nouveaux" affiche les nouveaux membres
- [ ] Cartes utilisateurs affichent les bonnes infos

### 2. Recherche
- [ ] Taper un nom dans la barre de recherche
- [ ] Résultats apparaissent en temps réel
- [ ] Cliquer sur "Se connecter" fonctionne

### 3. Connexions
- [ ] Envoyer une demande de connexion
- [ ] Toast "Demande envoyée"
- [ ] Utilisateur disparaît des suggestions
- [ ] L'autre utilisateur voit la demande
- [ ] Accepter la demande fonctionne
- [ ] Compteur de connexions augmente

### 4. Notifications
- [ ] Notification reçue quand quelqu'un demande connexion
- [ ] Notification reçue quand demande acceptée

---

## 🎯 AMÉLIORER LE FEED

Pour rendre le Feed vraiment communautaire, mettre à jour `src/pages/Feed.tsx` :

### Option 1 : Utiliser la fonction RPC

```typescript
// Dans fetchPosts()
const { data } = await supabase.rpc('get_community_feed', {
  for_user_id: user.id,
  limit_count: 50,
});
```

### Option 2 : Afficher TOUS les posts publics

```typescript
// Déjà fait ! Le Feed actuel montre tous les posts publics
// Pour voir uniquement les connexions :
const { data: connectionsData } = await supabase
  .from('connections')
  .select('user_id_1, user_id_2')
  .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

const connectedUserIds = connectionsData.map(c => 
  c.user_id_1 === user.id ? c.user_id_2 : c.user_id_1
);

const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .in('user_id', connectedUserIds);
```

---

## 🌟 ROADMAP FUTURE

### Phase 2 : Connexions Avancées
- [ ] **Amis proches** (best friends)
- [ ] **Bloquer des utilisateurs**
- [ ] **Suggestions basées sur l'activité** (posts, likes)
- [ ] **"Vous connaissez peut-être"** (amis d'amis)

### Phase 3 : Communauté
- [ ] **Groupes suggérés** (basés sur intérêts)
- [ ] **Événements locaux** (par institution)
- [ ] **Tendances** (sujets populaires)
- [ ] **Leaderboard** (utilisateurs actifs)

### Phase 4 : Gamification
- [ ] **Badges** (première connexion, 10 connexions, etc.)
- [ ] **Niveaux d'utilisateur** (débutant → expert)
- [ ] **Récompenses** (crédits IA, badges)

---

## 📝 NOTES IMPORTANTES

### Confidentialité
- ✅ **RLS activé** sur toutes les tables
- ✅ Utilisateurs voient uniquement leurs connexions/demandes
- ✅ Profils privés possibles (à implémenter)

### Performance
- ✅ **Index sur colonnes critiques** (last_active_at, institution, etc.)
- ✅ **Limites** sur requêtes (20-50 résultats max)
- ✅ **Fonctions SECURITY DEFINER** pour permissions

### Scalabilité
- ✅ **Table connections optimisée** (évite doublons A-B / B-A)
- ✅ **Compteurs dénormalisés** (connections_count)
- ✅ **Vues matérialisées** possibles pour utilisateurs populaires

---

## 🆘 DÉPANNAGE

### Erreur : "function get_user_suggestions does not exist"
**Solution :** Exécuter le script SQL `SCRIPT_COMMUNAUTE_SOCIALE.sql`

### Erreur : "relation connection_requests does not exist"
**Solution :** Exécuter le script SQL complet

### Suggestions vides
**Causes possibles :**
1. Pas assez d'utilisateurs en base
2. Tous les utilisateurs déjà connectés
3. Profil utilisateur incomplet (pas d'institution/domaine)

**Solution :**
- Ajouter des utilisateurs de test
- Remplir institution et study_field dans le profil

### Recherche ne fonctionne pas
**Vérifier :**
- Taper au moins 3 caractères
- Vérifier console pour erreurs
- Vérifier que la fonction `search_users` existe dans Supabase

---

## 🎉 RÉSULTAT FINAL

Votre application WordCraft est maintenant **une vraie communauté sociale** :

✅ **Découverte intelligente** d'utilisateurs  
✅ **Système de connexions/amis**  
✅ **Suggestions personnalisées**  
✅ **Recherche puissante**  
✅ **Feed communautaire**  
✅ **Notifications en temps réel**  

**Les utilisateurs peuvent maintenant se connecter entre eux comme sur Facebook ! 🚀**

---

**Date :** 3 Janvier 2026  
**Version :** 1.0 - Système Communautaire  
**Statut :** ✅ Prêt pour la production (après exécution du script SQL)
