# 💳 Guide Complet - Système de Paiements Mobile Money

**Date** : 5 janvier 2025  
**Opérateurs** : Airtel Money, Moov Money  
**Statut** : ✅ **PRÊT À UTILISER**

---

## 📋 Table des Matières

1. [Structure de la Table](#structure-de-la-table)
2. [Installation](#installation)
3. [Utilisation](#utilisation)
4. [Fonctions Disponibles](#fonctions-disponibles)
5. [Exemples de Code](#exemples-de-code)
6. [Sécurité](#sécurité)
7. [Tests](#tests)

---

## 🗄️ Structure de la Table

### Colonnes Principales

| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | Identifiant unique | Primary Key, Auto-généré |
| `user_id` | UUID | Référence utilisateur | Foreign Key → auth.users |
| `amount` | NUMERIC(10,2) | Montant du paiement | > 0, max 99999999.99 |
| `tid_submitted` | TEXT | Code TID saisi | UNIQUE, NOT NULL |
| `operator` | TEXT | Opérateur mobile | 'airtel' ou 'moov' |
| `status` | TEXT | Statut du paiement | 'pending', 'confirmed', 'failed', 'cancelled' |
| `created_at` | TIMESTAMP | Date de création | Auto-généré (UTC) |
| `updated_at` | TIMESTAMP | Dernière modification | Auto-mis à jour |
| `confirmed_at` | TIMESTAMP | Date de confirmation | NULL si non confirmé |

### Colonnes Supplémentaires (Optionnelles)

| Colonne | Type | Description |
|---------|------|-------------|
| `phone_number` | TEXT | Numéro de téléphone |
| `reference` | TEXT | Référence personnalisée |
| `error_message` | TEXT | Message d'erreur si échec |
| `metadata` | JSONB | Données additionnelles |

---

## 🚀 Installation

### 1. Exécuter la Migration SQL

**Dans Supabase Dashboard** :
1. Allez dans `SQL Editor`
2. Copiez le contenu de `supabase/migrations/create_payments_table.sql`
3. Cliquez sur `Run`

**Ou via CLI** :
```bash
supabase migration new create_payments_table
# Copier le SQL dans le fichier créé
supabase db push
```

### 2. Vérifier la Création

```sql
-- Vérifier que la table existe
SELECT * FROM public.payments LIMIT 1;

-- Vérifier les indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'payments';

-- Vérifier les policies RLS
SELECT policyname FROM pg_policies WHERE tablename = 'payments';
```

---

## 💻 Utilisation

### Importer les Fonctions

```typescript
import { payments, formatAmount, getStatusLabel } from '../lib/payments';
```

### Créer un Paiement

```typescript
try {
  const payment = await payments.create({
    amount: 5000, // 5000 FCFA
    tid_submitted: 'ABC123456789',
    operator: 'airtel', // ou 'moov'
    phone_number: '+225 07 12 34 56 78',
    reference: 'Abonnement Premium'
  });
  
  console.log('✅ Paiement créé:', payment.id);
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
```

### Récupérer les Paiements

```typescript
// Tous les paiements de l'utilisateur
const allPayments = await payments.getAll();

// Un paiement spécifique
const payment = await payments.getById('uuid-123');

// Par TID
const payment = await payments.getByTid('ABC123456789');
```

### Vérifier si un TID Existe

```typescript
const exists = await payments.tidExists('ABC123456789');
if (exists) {
  alert('Ce code TID a déjà été utilisé');
}
```

### Confirmer un Paiement

```typescript
// ⚠️ À faire depuis une Edge Function sécurisée
await payments.confirm('payment-id');
```

### Annuler un Paiement

```typescript
await payments.cancel('payment-id');
```

### Récupérer les Statistiques

```typescript
const stats = await payments.getStats();
console.log('Total confirmé:', formatAmount(stats.total_amount_confirmed));
```

---

## 📚 Fonctions Disponibles

### Gestion des Paiements

| Fonction | Description | Paramètres | Retour |
|----------|-------------|------------|--------|
| `create()` | Créer un paiement | `CreatePaymentData` | `Payment` |
| `getAll()` | Liste des paiements | - | `Payment[]` |
| `getById()` | Paiement par ID | `paymentId: string` | `Payment \| null` |
| `getByTid()` | Paiement par TID | `tid: string` | `Payment \| null` |
| `tidExists()` | Vérifier TID | `tid: string` | `boolean` |
| `confirm()` | Confirmer | `paymentId: string` | `void` |
| `fail()` | Marquer échoué | `paymentId, errorMsg?` | `void` |
| `cancel()` | Annuler | `paymentId: string` | `void` |
| `getStats()` | Statistiques | - | `PaymentStats` |
| `subscribe()` | Temps réel | `userId, callback` | `unsubscribe` |

### Utilitaires

| Fonction | Description | Exemple |
|----------|-------------|---------|
| `validateTidFormat()` | Valider format TID | `validateTidFormat('ABC123')` → `false` |
| `formatAmount()` | Formater montant | `formatAmount(5000)` → `'5 000 FCFA'` |
| `getOperatorName()` | Nom opérateur | `getOperatorName('airtel')` → `'Airtel Money'` |
| `getStatusLabel()` | Label statut | `getStatusLabel('pending')` → `'En attente'` |
| `getStatusColor()` | Couleur statut | `getStatusColor('confirmed')` → `'green'` |

---

## 🔧 Exemples de Code

### Exemple 1 : Formulaire de Paiement

```typescript
import { useState } from 'react';
import { payments, validateTidFormat, formatAmount } from '../lib/payments';

export function PaymentForm() {
  const [tid, setTid] = useState('');
  const [operator, setOperator] = useState<'airtel' | 'moov'>('airtel');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!validateTidFormat(tid)) {
      alert('Le code TID doit contenir au moins 10 caractères alphanumériques');
      return;
    }
    
    // Vérifier si TID déjà utilisé
    if (await payments.tidExists(tid)) {
      alert('Ce code TID a déjà été utilisé');
      return;
    }
    
    setLoading(true);
    
    try {
      const payment = await payments.create({
        amount: 5000,
        tid_submitted: tid,
        operator: operator
      });
      
      alert(`✅ Paiement créé avec succès ! ID: ${payment.id}`);
      setTid('');
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2">Code TID</label>
        <input
          type="text"
          value={tid}
          onChange={(e) => setTid(e.target.value)}
          placeholder="ABC123456789"
          className="w-full px-4 py-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label className="block mb-2">Opérateur</label>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as 'airtel' | 'moov')}
          className="w-full px-4 py-2 border rounded"
        >
          <option value="airtel">Airtel Money</option>
          <option value="moov">Moov Money</option>
        </select>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Traitement...' : `Payer ${formatAmount(5000)}`}
      </button>
    </form>
  );
}
```

---

### Exemple 2 : Liste des Paiements

```typescript
import { useEffect, useState } from 'react';
import { payments, Payment, formatAmount, getStatusLabel, getStatusColor } from '../lib/payments';

export function PaymentsList() {
  const [userPayments, setUserPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
    
    // S'abonner aux changements en temps réel
    const unsubscribe = payments.subscribe(userId, (payment) => {
      console.log('Nouveau paiement ou mise à jour:', payment);
      loadPayments(); // Recharger la liste
    });
    
    return () => unsubscribe();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await payments.getAll();
      setUserPayments(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mes Paiements</h2>
      
      {userPayments.length === 0 ? (
        <p>Aucun paiement pour le moment</p>
      ) : (
        <div className="space-y-2">
          {userPayments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 border rounded"
              style={{ borderColor: getStatusColor(payment.status) }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{formatAmount(payment.amount)}</p>
                  <p className="text-sm text-gray-600">
                    TID: {payment.tid_submitted}
                  </p>
                  <p className="text-sm text-gray-600">
                    {payment.operator === 'airtel' ? 'Airtel Money' : 'Moov Money'}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: getStatusColor(payment.status) + '20',
                      color: getStatusColor(payment.status)
                    }}
                  >
                    {getStatusLabel(payment.status)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              
              {payment.status === 'pending' && (
                <button
                  onClick={() => payments.cancel(payment.id)}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Annuler
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Exemple 3 : Statistiques

```typescript
import { useEffect, useState } from 'react';
import { payments, PaymentStats, formatAmount } from '../lib/payments';

export function PaymentStats() {
  const [stats, setStats] = useState<PaymentStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await payments.getStats();
    setStats(data);
  };

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-blue-50 rounded">
        <p className="text-sm text-gray-600">Total Paiements</p>
        <p className="text-2xl font-bold">{stats.total_payments}</p>
      </div>
      
      <div className="p-4 bg-green-50 rounded">
        <p className="text-sm text-gray-600">Confirmés</p>
        <p className="text-2xl font-bold">{stats.confirmed_payments}</p>
      </div>
      
      <div className="p-4 bg-orange-50 rounded">
        <p className="text-sm text-gray-600">En attente</p>
        <p className="text-2xl font-bold">{stats.pending_payments}</p>
      </div>
      
      <div className="p-4 bg-purple-50 rounded">
        <p className="text-sm text-gray-600">Montant Total</p>
        <p className="text-2xl font-bold">
          {formatAmount(stats.total_amount_confirmed)}
        </p>
      </div>
    </div>
  );
}
```

---

## 🔒 Sécurité

### Row Level Security (RLS)

Les policies RLS sont activées :

✅ **SELECT** : Les utilisateurs ne voient que leurs propres paiements  
✅ **INSERT** : Les utilisateurs ne peuvent créer que des paiements pour eux-mêmes  
✅ **UPDATE** : Les utilisateurs ne peuvent modifier que leurs paiements `pending`  
❌ **DELETE** : Désactivé par défaut (optionnel)

### Validation

- ✅ TID unique (contrainte base de données)
- ✅ Montant > 0
- ✅ Opérateur limité à 'airtel' ou 'moov'
- ✅ Statut limité aux valeurs valides
- ✅ user_id toujours vérifié

### Recommandations

1. **Ne jamais confirmer un paiement côté client**
   → Utiliser une Edge Function sécurisée

2. **Vérifier le TID avant création**
   ```typescript
   if (await payments.tidExists(tid)) {
     throw new Error('TID déjà utilisé');
   }
   ```

3. **Valider le format du TID**
   ```typescript
   if (!validateTidFormat(tid)) {
     throw new Error('Format TID invalide');
   }
   ```

---

## 🧪 Tests

### Test 1 : Créer un Paiement

```sql
-- Depuis SQL Editor
INSERT INTO public.payments (user_id, amount, tid_submitted, operator)
VALUES (
  auth.uid(),
  5000,
  'TEST123456789',
  'airtel'
);
```

### Test 2 : Vérifier RLS

```sql
-- Essayer de voir les paiements d'un autre utilisateur (devrait échouer)
SELECT * FROM public.payments WHERE user_id != auth.uid();
```

### Test 3 : Trigger updated_at

```sql
-- Mettre à jour un paiement et vérifier que updated_at change
UPDATE public.payments
SET status = 'confirmed'
WHERE id = 'payment-id';

SELECT updated_at FROM public.payments WHERE id = 'payment-id';
```

---

## 📝 Fichiers Créés

1. **supabase/migrations/create_payments_table.sql** - Script SQL complet
2. **src/lib/payments.ts** - Types et fonctions TypeScript
3. **GUIDE_PAIEMENTS.md** - Ce guide (documentation complète)

---

## ✅ Checklist

- [x] Table `payments` créée
- [x] Indexes créés
- [x] Trigger `updated_at` créé
- [x] RLS activé
- [x] Policies créées
- [x] Vue `payment_stats` créée
- [x] Fonctions SQL (`confirm_payment`, `fail_payment`)
- [x] Types TypeScript
- [x] Fonctions helper
- [x] Validation TID
- [x] Formatage montant
- [x] Temps réel (subscriptions)

---

**Date de création** : 5 janvier 2025  
**Statut** : ✅ **PRÊT POUR PRODUCTION**

🎉 **Système de paiements Mobile Money opérationnel !**
