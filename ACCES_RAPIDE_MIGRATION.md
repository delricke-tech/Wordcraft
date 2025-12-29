# ⚡ Accès Rapide - Migration PDF

## 🎯 URL Directe

```
http://localhost:5173/migration-pdf
```

## 🚀 En 3 Clics

1. **Ouvrez** → http://localhost:5173/migration-pdf
2. **Cliquez** → "Lancer la migration"
3. **Attendez** → La progression s'affiche en temps réel

## ✅ Résultat

Après la migration, vérifiez dans Supabase :

```sql
SELECT COUNT(*) 
FROM documents 
WHERE extracted_text IS NOT NULL;
```

**L'IA peut maintenant répondre ! 🎉**

---

**Temps total : 2-5 secondes par document**

