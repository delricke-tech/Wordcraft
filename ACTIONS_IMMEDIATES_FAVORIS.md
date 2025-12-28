# ⭐ Système de Favoris - Actions Immédiates

## 🚀 Pour activer le système (3 étapes)

### 1️⃣ Appliquer la migration SQL
```
1. Ouvrir https://app.supabase.com
2. Menu → SQL Editor → New query
3. Copier le contenu de : supabase/migrations/20251228_add_is_favorite.sql
4. Coller et cliquer sur "Run"
5. Vérifier le message de succès
```

### 2️⃣ Vérifier (optionnel mais recommandé)
```sql
-- Exécuter dans SQL Editor :
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'documents' AND column_name = 'is_favorite';
```
**Attendu** : Une ligne avec `is_favorite | boolean | false`

### 3️⃣ Tester l'application
```powershell
# Si le serveur n'est pas lancé :
cd "C:\Users\HP I5\Downloads\project"
npm run dev
```

**Dans le navigateur :**
- ✅ Cliquer sur une étoile → notification "Ajouté aux favoris"
- ✅ Cliquer sur le bouton "Favoris" → seuls les favoris s'affichent
- ✅ Compteur de favoris visible dans le bouton

---

## 📋 Fichiers importants

| Fichier | Description |
|---------|-------------|
| `supabase/migrations/20251228_add_is_favorite.sql` | **À EXÉCUTER** : Migration BDD |
| `GUIDE_SYSTEME_FAVORIS.md` | Guide complet utilisateur |
| `RESUME_TECHNIQUE_FAVORIS.md` | Documentation technique détaillée |
| `supabase/migrations/VERIFICATION_FAVORIS.sql` | Script de tests SQL |

---

## ✨ Fonctionnalités disponibles

- ⭐ **Icône étoile** sur chaque document (grille + liste)
- 🔍 **Bouton "Favoris"** avec compteur dans la barre de filtres
- 🏷️ **Badge "Favoris uniquement"** quand le filtre est actif
- 🔔 **Notifications** "Ajouté/Retiré des favoris"
- 🚫 **AUCUNE modification** de `storage_path` ou `name` (règle respectée ✅)

---

## ⚠️ En cas de problème

### Problème : Erreur "column is_favorite does not exist"
**Solution** : La migration n'a pas été appliquée → Retour à l'étape 1️⃣

### Problème : L'étoile ne change pas de couleur
**Solution** : Rafraîchir la page (Ctrl+R) ou vider le cache (Ctrl+Shift+R)

### Problème : Notification "Erreur" au clic
**Solution** : Vérifier dans la console (F12) et consulter `GUIDE_SYSTEME_FAVORIS.md` section "Dépannage"

---

## 📞 Support

- **Guide complet** : Lire `GUIDE_SYSTEME_FAVORIS.md`
- **Documentation technique** : Lire `RESUME_TECHNIQUE_FAVORIS.md`
- **Vérification SQL** : Utiliser `VERIFICATION_FAVORIS.sql`

---

**Temps d'activation** : ~5 minutes  
**Difficulté** : Facile  
**Statut** : ✅ Prêt à utiliser

