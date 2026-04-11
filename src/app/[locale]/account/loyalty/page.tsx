'use client';

import { useState, useEffect } from 'react';

interface LoyaltyData {
  points: number;
  totalSessions: number;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  type: 'earn' | 'redeem' | 'bonus' | 'adjust';
  points: number;
  description: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  earn: 'Castigat',
  redeem: 'Folosit',
  bonus: 'Bonus / Surpriza',
  adjust: 'Ajustare',
};

const typeColors: Record<string, string> = {
  earn: 'text-success',
  redeem: 'text-error',
  bonus: 'text-accent',
  adjust: 'text-warning',
};

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData>({
    points: 0,
    totalSessions: 0,
    transactions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        const res = await fetch('/api/client/loyalty');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setData({
              points: json.data.balance?.balance || 0,
              totalSessions: json.data.balance?.totalEarned || 0,
              transactions: json.data.transactions || [],
            });
          }
        }
      } catch {
        // Handle silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoyalty();
  }, []);

  const stampsFilled = Math.min(data.totalSessions % 10, 10);
  const pointsInRON = data.points * 50;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-text-primary">Puncte de fidelitate</h1>

      {/* Balance */}
      <div className="mb-8 rounded-sm border border-border bg-bg-secondary p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-text-secondary">Balanta ta</p>
          <p className="text-4xl font-bold text-accent">{data.points}</p>
          <p className="text-sm text-text-muted">puncte ({pointsInRON} RON)</p>
        </div>
      </div>

      {/* Visual Loyalty Card */}
      <div className="mb-8 rounded-sm border border-border bg-bg-secondary p-6">
        <h2 className="mb-4 font-heading text-lg text-text-primary">Card de fidelitate</h2>
        <div className="grid grid-cols-5 gap-4 sm:grid-cols-5 md:gap-6">
          {/* 2 rows of 5 = 10 stamps */}
          {Array.from({ length: 10 }, (_, i) => {
            const isFilled = i < stampsFilled;
            const isGift = i === 9;

            return (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-full border-2 transition-all ${
                  isFilled
                    ? 'border-accent bg-accent/20 text-accent shadow-lg shadow-accent/10'
                    : 'border-border bg-bg-primary text-text-muted'
                }`}
              >
                {isGift ? (
                  <svg
                    className={`h-6 w-6 ${isFilled ? 'text-accent' : 'text-text-muted'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                ) : isFilled ? (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-text-muted">
          {stampsFilled}/10 sedinte completate. La fiecare a 10-a sedinta primesti o surpriza!
        </p>
      </div>

      {/* Transaction History */}
      <div className="rounded-sm border border-border bg-bg-secondary">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg text-text-primary">Istoric tranzactii</h2>
        </div>

        {data.transactions.length === 0 ? (
          <p className="p-6 text-center text-text-muted">
            Nu ai inca tranzactii de fidelitate.
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {data.transactions.map((tx) => (
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
  );
}
