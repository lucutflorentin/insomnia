'use client';

import { useState, useEffect, useCallback } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

interface Client {
  id: number;
  name: string;
  email: string;
  loyaltyPoints: number;
}

interface LoyaltyTransaction {
  id: number;
  type: 'earn' | 'redeem' | 'bonus' | 'adjust';
  points: number;
  description: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  earn: 'Castigat',
  redeem: 'Folosit',
  bonus: 'Bonus / Surpriza P10',
  adjust: 'Ajustare',
};

const typeColors: Record<string, string> = {
  earn: 'text-success',
  redeem: 'text-error',
  bonus: 'text-accent',
  adjust: 'text-warning',
};

const surpriseOptions = [
  { value: 'tatuaj-gratuit-mic', label: 'Tatuaj gratuit mic' },
  { value: 'merch', label: 'Merch' },
  { value: 'discount-custom', label: 'Discount custom' },
  { value: 'altul', label: 'Altul' },
];

export default function AdminLoyaltyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Action forms
  const [activeAction, setActiveAction] = useState<'award' | 'redeem' | 'surprise' | null>(null);
  const [actionPoints, setActionPoints] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [surpriseType, setSurpriseType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const searchClients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/loyalty?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.success ? json.data : [];
        setSearchResults(
          Array.isArray(list)
            ? list.map((item: { user: { id: number; name: string; email: string }; loyalty: { balance: number }; transactions: LoyaltyTransaction[] }) => ({
                id: item.user.id,
                name: item.user.name,
                email: item.user.email,
                loyaltyPoints: item.loyalty.balance,
              }))
            : [],
        );
      }
    } catch {
      // Handle silently
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchClients(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchClients]);

  const selectClient = async (client: Client) => {
    setSelectedClient(client);
    setSearchResults([]);
    setSearchQuery(client.name);
    setIsLoadingDetails(true);

    try {
      // Refetch client data via search to get full transactions
      const res = await fetch(`/api/admin/loyalty?search=${encodeURIComponent(client.email)}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.success ? json.data : [];
        const match = list.find((item: { user: { id: string } }) => String(item.user.id) === String(client.id));
        if (match) {
          setTransactions(match.transactions || []);
          setSelectedClient({ ...client, loyaltyPoints: match.loyalty?.balance || client.loyaltyPoints });
        }
      }
    } catch {
      // Handle silently
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !activeAction) return;

    setActionError('');
    setActionSuccess('');
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        userId: Number(selectedClient.id),
        description: actionDescription,
      };

      if (activeAction === 'award') {
        body.type = 'adjust';
        body.points = parseInt(actionPoints, 10);
      } else if (activeAction === 'redeem') {
        body.type = 'redeem';
        body.points = -Math.abs(parseInt(actionPoints, 10));
      } else if (activeAction === 'surprise') {
        body.type = 'bonus';
        body.points = 1;
        body.description = `Surpriza P10: ${surpriseType} - ${actionDescription}`;
      }

      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setActionSuccess('Actiune realizata cu succes.');
        setActiveAction(null);
        setActionPoints('');
        setActionDescription('');
        setSurpriseType('');
        // Refresh client data
        selectClient(selectedClient);
      } else {
        const data = await res.json();
        setActionError(data.error || 'Eroare la procesare.');
      }
    } catch {
      setActionError('Eroare de conexiune.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-text-primary">Fidelitate</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Input
          label="Cauta client (nume sau email)"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedClient(null);
          }}
          placeholder="Cauta dupa nume sau email..."
        />
        {isSearching && (
          <div className="absolute right-3 top-9">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && !selectedClient && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-sm border border-border bg-bg-secondary shadow-xl">
            {searchResults.map((client) => (
              <button
                key={client.id}
                onClick={() => selectClient(client)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-bg-primary"
              >
                <div>
                  <p className="text-text-primary">{client.name}</p>
                  <p className="text-xs text-text-muted">{client.email}</p>
                </div>
                <span className="text-xs text-accent">{client.loyaltyPoints} puncte</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Client Details */}
      {selectedClient && (
        <div className="space-y-6">
          {/* Client Balance Card */}
          <div className="rounded-sm border border-border bg-bg-secondary p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{selectedClient.name}</h2>
                <p className="text-sm text-text-muted">{selectedClient.email}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-accent">{selectedClient.loyaltyPoints}</p>
                <p className="text-xs text-text-muted">puncte</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={activeAction === 'award' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setActiveAction(activeAction === 'award' ? null : 'award');
                setActionError('');
                setActionSuccess('');
              }}
            >
              Acorda puncte
            </Button>
            <Button
              variant={activeAction === 'redeem' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setActiveAction(activeAction === 'redeem' ? null : 'redeem');
                setActionError('');
                setActionSuccess('');
              }}
            >
              Foloseste puncte
            </Button>
            <Button
              variant={activeAction === 'surprise' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setActiveAction(activeAction === 'surprise' ? null : 'surprise');
                setActionError('');
                setActionSuccess('');
              }}
            >
              Acorda surpriza P10
            </Button>
          </div>

          {/* Action Form */}
          {activeAction && (
            <form
              onSubmit={handleSubmitAction}
              className="rounded-sm border border-border bg-bg-secondary p-6 space-y-4"
            >
              <h3 className="font-heading text-lg text-text-primary">
                {activeAction === 'award' && 'Acorda puncte'}
                {activeAction === 'redeem' && 'Foloseste puncte'}
                {activeAction === 'surprise' && 'Acorda surpriza P10'}
              </h3>

              {(activeAction === 'award' || activeAction === 'redeem') && (
                <Input
                  label="Puncte"
                  type="number"
                  value={actionPoints}
                  onChange={(e) => setActionPoints(e.target.value)}
                  min="1"
                  required
                />
              )}

              {activeAction === 'surprise' && (
                <Select
                  label="Tip surpriza"
                  options={surpriseOptions}
                  value={surpriseType}
                  onChange={(e) => setSurpriseType(e.target.value)}
                  placeholder="Selecteaza tipul surprizei..."
                  required
                />
              )}

              <Input
                label="Descriere"
                type="text"
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                placeholder="Motiv / detalii..."
                required
              />

              {actionError && (
                <div className="rounded-sm border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  {actionSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" isLoading={isSubmitting}>
                  Confirma
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setActiveAction(null);
                    setActionError('');
                    setActionSuccess('');
                  }}
                >
                  Anuleaza
                </Button>
              </div>
            </form>
          )}

          {/* Transaction History */}
          <div className="rounded-sm border border-border bg-bg-secondary">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-heading text-lg text-text-primary">Istoric tranzactii</h2>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="p-6 text-center text-text-muted">
                Nu exista tranzactii pentru acest client.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm text-text-primary">{tx.description}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`text-xs font-medium ${typeColors[tx.type] || 'text-text-muted'}`}>
                          {typeLabels[tx.type] || tx.type}
                        </span>
                        <span className="text-xs text-text-muted">
                          {new Date(tx.createdAt).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === 'redeem' ? 'text-error' : 'text-success'
                      }`}
                    >
                      {tx.type === 'redeem' ? '-' : '+'}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
