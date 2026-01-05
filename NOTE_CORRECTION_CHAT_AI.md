# 🔧 Correction finale - Edge Function chat-ai

## Problème identifié

L'Edge Function `chat-ai` retourne `{ message: "..." }` alors que le frontend attend `{ content: "..." }`.

## Solution

Modifier l'Edge Function pour retourner `content` au lieu de `message`.

### Code à déployer

**Dashboard Supabase → Edge Functions → chat-ai → Edit**

Remplacez la ligne de retour (vers la fin) :

```typescript
// ❌ ANCIEN CODE (ligne ~140)
return new Response(
  JSON.stringify({ content }),
  { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200 
  },
)
```

Par :

```typescript
// ✅ NOUVEAU CODE
return new Response(
  JSON.stringify({ content }),  // Déjà correct !
  { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200 
  },
)
```

**Note :** En fait, le code de l'Edge Function que j'ai donné retourne déjà `content`. Le problème vient peut-être d'une ancienne version déployée.

### Action recommandée

1. **Re-déployez** l'Edge Function `chat-ai` avec le code complet que j'ai donné précédemment
2. **OU** gardez la correction frontend qui accepte les deux formats (`data?.message || data?.content`)

La correction frontend actuelle fonctionne avec les deux formats, donc **pas besoin de re-déployer** si ça marche maintenant !
