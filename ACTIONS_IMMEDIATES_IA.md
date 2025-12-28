# ⚡ Actions Immédiates - Assistant IA Lecteur PDF

## 🔑 Configuration (2 minutes)

### 1️⃣ Ajouter votre clé OpenAI

**Créer/Modifier le fichier `.env`** à la racine du projet :

```env
VITE_OPENAI_API_KEY=sk-VOTRE-CLE-ICI

# Vos variables Supabase existantes
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

**Où obtenir la clé ?**
1. Aller sur https://platform.openai.com/api-keys
2. Créer une nouvelle clé
3. Copier (commence par `sk-...`)
4. Coller dans `.env`

### 2️⃣ Redémarrer le serveur

```powershell
# Arrêter le serveur actuel (Ctrl+C)
# Puis relancer :
cd "C:\Users\HP I5\Downloads\project"
npm run dev
```

---

## 🧪 Tester (5 minutes)

### Test 1 : Ouvrir le chat
```
1. Aller dans Bibliothèque
2. Cliquer sur l'icône Œil (👁️) d'un PDF
3. ✅ Le PDF s'affiche avec le nom original (avec accents) en haut
4. ✅ Bouton flottant violet/bleu à droite
5. Cliquer sur le bouton
6. ✅ Panneau de chat s'ouvre avec animation
7. ✅ Message de bienvenue affiché
```

### Test 2 : Extraction automatique
```
1. Ouvrir un PDF
2. ✅ Toast "Extraction du texte pour l'IA..."
3. Attendre ~5-10 secondes
4. ✅ Toast "IA prête - Le document a été analysé"
```

### Test 3 : Poser une question
```
1. Dans le chat, taper : "Résume ce document"
2. Appuyer sur Entrée ou cliquer Send
3. ✅ "L'IA réfléchit..." affiché
4. ✅ Réponse apparaît en Markdown formaté
```

### Test 4 : Bouton Résumer
```
1. Cliquer sur "Résumer" en haut du chat
2. ✅ Bouton devient "Génération..."
3. ✅ Résumé structuré généré
```

### Test 5 : Upload fichier
```
1. Cliquer sur l'icône Trombone (📎)
2. Sélectionner un autre PDF
3. ✅ Fichier analysé
4. ✅ Peut poser des questions sur les 2 documents
```

---

## ✅ Fonctionnalités disponibles

| Feature | Description | Statut |
|---------|-------------|--------|
| **Chat contextuel** | Questions sur le document | ✅ |
| **Bouton Résumer** | Résumé auto en 1 clic | ✅ |
| **Trombone** | Upload de fichiers additionnels | ✅ |
| **Markdown** | Mise en forme riche | ✅ |
| **Formules math** | Support LaTeX ($$...$$) | ✅ |
| **Glassmorphism** | Design moderne transparent | ✅ |
| **Animations** | Framer Motion fluides | ✅ |
| **Nom avec accents** | Utilise colonne `name` | ✅ |
| **Sécurité** | Utilise `storage_path` | ✅ |

---

## ⚠️ En cas de problème

### "Clé OpenAI manquante"
```
✅ Vérifier que le fichier .env existe
✅ Vérifier que la variable commence par VITE_
✅ Redémarrer le serveur (npm run dev)
```

### "Quota OpenAI épuisé"
```
✅ Aller sur https://platform.openai.com/usage
✅ Vérifier vos crédits
✅ Ajouter un moyen de paiement si nécessaire
```

### Le chat ne s'ouvre pas
```
✅ Vérifier la console navigateur (F12)
✅ Vérifier que toutes les dépendances sont installées
✅ Relancer : npm install
```

---

## 📚 Documentation complète

**`GUIDE_IA_LECTEUR_PDF.md`** : Guide détaillé avec :
- Configuration complète
- Architecture technique
- Personnalisation
- Coûts estimés

---

**Temps de configuration** : 2 minutes  
**Temps de tests** : 5 minutes  
**Difficulté** : Facile ⭐⭐☆☆☆

