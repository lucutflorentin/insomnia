'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Search, Award, ArrowUpDown, ChevronUp, ChevronDown, Gift, Minus, Plus, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface ClientRow {
  id: number;
  name: string;
  email: string;
  loyaltyPoints: number;
  lastTransactionDate: string | null;
}

interface LoyaltyTransaction {
  id: number;
  type: 'earn' | 'redeem' | 'bonus' | 'adjust';
  points: number;
  description: string;
  createdAt: string;
}

type SortField = 'name' | 'loyaltyPoints' | 'lastTransactionDate';
type SortDir = 'asc' | 'desc';

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

function getTier(points: number): { label: string; variant: 'default' | 'accent' | 'success' | 'error' | 'outline'; color: string } {
  if (points >= 500) return { label: 'Gold', variant: 'accent', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
  if (points >= 100) return { label: 'Silver', variant: 'outline', color: 'bg-gray-400/10 text-gray-300 border border-gray-400/20' };
  return { label: 'Bronze', variant: 'default', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' };
}

export default function AdminLoyaltyPage() {
  const t = useTranslations('admin.loyalty');
  const { showToast } = useToast();

  // All clients list
  const [allClients, setAllClients] = useState<ClientRow[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Selected client detail
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Action forms
  const [activeAction, setActiveAction] = useState<'award' | 'redeem' | 'surprise' | null>(null);
  const [actionPoints, setActionPoints] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [surpriseType, setSurpriseType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all clients on mount
  const fetchAllClients = useCallback(async () => {
    setIsLoadingAll(true);
    try {
      const res = await fetch('/api/admin/loyalty?all=1');
      if (res.ok) {
        const json = await res.json();
        const list = json.success ? json.data : [];
        if (Array.isArray(list)) {
          setAllClients(
            list.map((item: { user: { id: number; name: string; email: string }; loyalty: { balance: number }; transactions: LoyaltyTransaction[] }) => ({
              id: item.user.id,
              name: item.user.name,
              email: item.user.email,
              loyaltyPoints: item.loyalty.balance,
              lastTransactionDate:
                item.transactions.length > 0 ? item.transactions[0].createdAt : null,
            })),
          );
        }
      } else {
        showToast(t('fetchError'), 'error');
      }
    } catch {
      showToast(t('fetchError'), 'error');
    } finally {
      setIsLoadingAll(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchAllClients();
  }, [fetchAllClients]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Filtered and sorted clients
  const displayClients = useMemo(() => {
    let filtered = allClients;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      filtered = allClients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      );
    }

    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortField === 'loyaltyPoints') {
        return (a.loyaltyPoints - b.loyaltyPoints) * dir;
      }
      if (sortField === 'lastTransactionDate') {
        const dateA = a.lastTransactionDate ? new Date(a.lastTransactionDate).getTime() : 0;
        const dateB = b.lastTransactionDate ? new Date(b.lastTransactionDate).getTime() : 0;
        return (dateA - dateB) * dir;
      }
      return 0;
    });
  }, [allClients, filterQuery, sortField, sortDir]);

  // Select a client row to show details
  const selectClient = async (client: ClientRow) => {
    setSelectedClient(client);
    setActiveAction(null);
    setIsLoadingDetails(true);

    try {
      const res = await fetch(`/api/admin/loyalty?search=${encodeURIComponent(client.email)}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.success ? json.data : [];
        const match = list.find((item: { user: { id: string } }) => String(item.user.id) === String(client.id));
        if (match) {
          setTransactions(match.transactions || []);
          setSelectedClient({ ...client, loyaltyPoints: match.loyalty?.balance || client.loyaltyPoints });
        }
      } else {
        showToast(t('fetchError'), 'error');
      }
    } catch {
      showToast(t('fetchError'), 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !activeAction) return;

    if (activeAction === 'award' || activeAction === 'redeem') {
      const parsed = parseInt(actionPoints, 10);
      if (!actionPoints || isNaN(parsed) || parsed < 1) {
        showToast(t('pointsError'), 'error');
        return;
      }
    }

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
        showToast(t('actionSuccess'), 'success');
        setActiveAction(null);
        setActionPoints('');
        setActionDescription('');
        setSurpriseType('');
        // Refresh both the table and the detail view
        fetchAllClients();
        selectClient(selectedClient);
      } else {
        const data = await res.json();
        showToast(data.error || t('actionError'), 'error');
      }
    } catch {
      showToast(t('actionError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-text-muted" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-accent" />
    ) : (
      <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-accent" />
    );
  };

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-accent" />
          <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
        </div>
        <div className="text-sm text-text-muted">
          {allClients.length} {t('totalClients')}
        </div>
      </div>

      {/* Search/Filter bar */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder={t('searchClients')}
          className="w-full rounded-sm border border-border bg-bg-secondary py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Client Table */}
        <div className={`${selectedClient ? 'lg:w-1/2' : 'w-full'} transition-all`}>
          {displayClients.length === 0 ? (
            <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
              <p className="text-text-muted">{t('noClients')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-border bg-bg-secondary">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-text-muted">
                    <th
                      className="cursor-pointer px-4 py-3 select-none hover:text-text-secondary"
                      onClick={() => handleSort('name')}
                    >
                      {t('clientName')} <SortIcon field="name" />
                    </th>
                    {!selectedClient && (
                      <th className="px-4 py-3">{t('email')}</th>
                    )}
                    <th
                      className="cursor-pointer px-4 py-3 text-right select-none hover:text-text-secondary"
                      onClick={() => handleSort('loyaltyPoints')}
                    >
                      {t('points')} <SortIcon field="loyaltyPoints" />
                    </th>
                    <th className="px-4 py-3 text-center">{t('tier')}</th>
                    <th
                      className="cursor-pointer px-4 py-3 select-none hover:text-text-secondary"
                      onClick={() => handleSort('lastTransactionDate')}
                    >
                      {t('lastTransaction')} <SortIcon field="lastTransactionDate" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayClients.map((client) => {
                    const tier = getTier(client.loyaltyPoints);
                    const isSelected = selectedClient?.id === client.id;
                    return (
                      <tr
                        key={client.id}
                        onClick={() => selectClient(client)}
                        className={`cursor-pointer border-b border-border/50 text-sm transition-colors hover:bg-bg-primary ${
                          isSelected ? 'bg-accent/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-text-primary font-medium">{client.name}</td>
                        {!selectedClient && (
                          <td className="px-4 py-3 text-text-muted text-xs">{client.email}</td>
                        )}
                        <td className="px-4 py-3 text-right font-semibold text-accent">
                          {client.loyaltyPoints}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.color}`}>
                            {tier.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-text-muted text-xs">
                          {client.lastTransactionDate
                            ? new Date(client.lastTransactionDate).toLocaleDateString('ro-RO')
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Client Detail Panel */}
        {selectedClient && (
          <div className="lg:w-1/2 space-y-4">
            {/* Client Balance Card */}
            <div className="rounded-sm border border-border bg-bg-secondary p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{selectedClient.name}</h2>
                  <p className="text-sm text-text-muted">{selectedClient.email}</p>
                  <div className="mt-2">
                    {(() => {
                      const tier = getTier(selectedClient.loyaltyPoints);
                      return (
                        <Badge className={tier.color}>
                          <Award className="mr-1 h-3 w-3" />
                          {tier.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-accent">{selectedClient.loyaltyPoints}</p>
                    <p className="text-xs text-text-muted">{t('points')}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedClient(null);
                      setTransactions([]);
                      setActiveAction(null);
                    }}
                    className="mt-1 rounded-sm p-1 text-text-muted hover:text-text-primary hover:bg-bg-primary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeAction === 'award' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveAction(activeAction === 'award' ? null : 'award')}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t('award')}
              </Button>
              <Button
                variant={activeAction === 'redeem' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveAction(activeAction === 'redeem' ? null : 'redeem')}
              >
                <Minus className="mr-1 h-3.5 w-3.5" />
                {t('redeem')}
              </Button>
              <Button
                variant={activeAction === 'surprise' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveAction(activeAction === 'surprise' ? null : 'surprise')}
              >
                <Gift className="mr-1 h-3.5 w-3.5" />
                {t('awardSurprise')}
              </Button>
            </div>

            {/* Action Form */}
            {activeAction && (
              <form
                onSubmit={handleSubmitAction}
                className="rounded-sm border border-border bg-bg-secondary p-4 space-y-3"
              >
                <h3 className="font-heading text-base text-text-primary">
                  {activeAction === 'award' && t('award')}
                  {activeAction === 'redeem' && t('redeem')}
                  {activeAction === 'surprise' && t('awardSurprise')}
                </h3>

                {(activeAction === 'award' || activeAction === 'redeem') && (
                  <Input
                    label={t('points')}
                    type="number"
                    value={actionPoints}
                    onChange={(e) => setActionPoints(e.target.value)}
                    min="1"
                    required
                  />
                )}

                {activeAction === 'surprise' && (
                  <Select
                    label={t('surpriseType')}
                    options={surpriseOptions}
                    value={surpriseType}
                    onChange={(e) => setSurpriseType(e.target.value)}
                    placeholder={t('selectSurprise')}
                    required
                  />
                )}

                <Input
                  label={t('description')}
                  type="text"
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  required
                />

                <div className="flex gap-2">
                  <Button type="submit" size="sm" isLoading={isSubmitting}>
                    {t('submit')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveAction(null)}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            )}

            {/* Transaction History */}
            <div className="rounded-sm border border-border bg-bg-secondary">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-heading text-base text-text-primary">{t('transactions')}</h2>
              </div>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="p-4 text-center text-sm text-text-muted">
                  {t('noTransactions')}
                </p>
              ) : (
                <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3">
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
    </div>
  );
}
