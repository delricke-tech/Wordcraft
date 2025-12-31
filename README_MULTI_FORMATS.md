# 🚀 Configuration Multi-Formats - Guide Express

## ⚡ **Installation en 3 étapes (5 minutes)**

### **Étape 1 : Configurer Supabase** 🔧

1. Ouvrez https://supabase.com/dashboard
2. SQL Editor → New query
3. Copiez-collez le contenu de `CONFIGURE_STORAGE_MULTI_FORMATS.sql`
4. Cliquez sur "Run" ▶️
5. ✅ Vérifiez le message de succès

### **Étape 2 : Installer les packages** 📦

Ouvrez un terminal dans votre projet :

```bash
npm install mammoth tesseract.js
```

⏱️ Durée : ~2 minutes

### **Étape 3 : Redémarrer** 🔄

```bash
npm run dev
```

---

## ✅ **Ce qui fonctionne MAINTENANT**

| Type | Sans packages | Avec packages |
|------|---------------|---------------|
| **PDF** | ✅ Tout | ✅ Tout |
| **TXT** | ✅ Tout | ✅ Tout |
| **Images** | ✅ Affichage | ✅ Affichage + OCR |
| **DOCX** | ✅ Upload | ✅ Upload + Extraction |
| **Vidéo** | ✅ Lecteur | ✅ Lecteur |
| **Audio** | ✅ Lecteur | ✅ Lecteur |

---

## 🧪 **Test rapide**

1. **Créez un fichier texte** (test.txt)
   ```
   Ceci est un test.
   L'IA devrait pouvoir lire ce texte !
   ```

2. **Uploadez-le** dans l'application

3. **Résultat attendu** :
   - ✅ Upload réussi
   - ✅ Texte extrait automatiquement
   - ✅ Chat IA s'ouvre automatiquement
   - ✅ Vous pouvez poser des questions

---

## 📚 **Documentation complète**

- **Configuration Supabase** : `SUPABASE_CONFIGURATION_GUIDE.md`
- **Guide utilisateur** : `GUIDE_MULTI_FORMATS.md`
- **Script SQL** : `CONFIGURE_STORAGE_MULTI_FORMATS.sql`

---

## ❓ **FAQ Express**

**Q : Dois-je obligatoirement installer mammoth et tesseract.js ?**
**R :** Non, mais c'est recommandé pour DOCX et OCR.

**Q : Ça fonctionne sans les packages ?**
**R :** Oui ! PDF, TXT, Images, Vidéo et Audio fonctionnent sans packages.

**Q : L'OCR est lent ?**
**R :** Oui, 10-30 secondes. C'est normal.

**Q : Combien de types de fichiers ?**
**R :** 27 types MIME supportés (voir guide complet).

---

## 🎯 **Ordre recommandé**

1. ✅ **Configurez Supabase** (MAINTENANT)
2. ✅ **Testez avec TXT** (sans installer de packages)
3. ✅ **Installez les packages** (si besoin DOCX/OCR)
4. ✅ **Testez tous les formats**

---

## 💡 **Astuce**

Commencez par tester avec un fichier TXT :
- Pas besoin d'installer de packages
- Extraction instantanée
- Vous verrez tout de suite si ça fonctionne !

---

**Bon apprentissage ! 🚀📚**
