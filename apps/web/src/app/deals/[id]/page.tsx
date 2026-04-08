'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { dealsApi, getToken, type Deal } from '@/lib/api';

const STATUS_STEPS = ['agreed', 'contract_sent', 'signed', 'completed'];

const STATUS_LABELS: Record<string, string> = {
  agreed: 'Deal Agreed',
  contract_sent: 'Contract Sent',
  signed: 'Contract Signed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function StepIndicator({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0 mb-6">
      {STATUS_STEPS.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold
            ${idx < currentIdx ? 'bg-green-500 text-white' : ''}
            ${idx === currentIdx ? 'bg-blue-600 text-white' : ''}
            ${idx > currentIdx ? 'bg-gray-200 text-gray-500' : ''}
          `}>
            {idx < currentIdx ? '✓' : idx + 1}
          </div>
          <p className={`ml-1 mr-4 text-xs ${idx === currentIdx ? 'font-medium text-blue-600' : 'text-gray-400'}`}>
            {STATUS_LABELS[step]}
          </p>
          {idx < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 w-8 mr-4 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DealPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'brand' | 'community' | null>(null);

  function getActiveToken(): { token: string; role: 'brand' | 'community' } | null {
    const brandToken = getToken('brand');
    const communityToken = getToken('community');
    if (brandToken) return { token: brandToken, role: 'brand' };
    if (communityToken) return { token: communityToken, role: 'community' };
    return null;
  }

  function loadDeal() {
    const auth = getActiveToken();
    if (!auth) {
      router.replace('/');
      return;
    }
    setRole(auth.role);
    dealsApi.get(auth.token, id)
      .then(setDeal)
      .catch((err) => setError(err.message));
  }

  useEffect(() => { loadDeal(); }, [id]);

  async function handleNegotiate() {
    const auth = getActiveToken();
    if (!auth) return;
    setLoading(true);
    setActionError('');
    try {
      await dealsApi.negotiate(auth.token, id);
      loadDeal();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateContract() {
    const auth = getActiveToken();
    if (!auth) return;
    setLoading(true);
    setActionError('');
    try {
      await dealsApi.generateContract(auth.token, id);
      loadDeal();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    const auth = getActiveToken();
    if (!auth) return;
    setLoading(true);
    setActionError('');
    try {
      const updated = await dealsApi.sign(auth.token, id);
      setDeal(updated);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        {error || 'Loading deal...'}
      </div>
    );
  }

  const isBrand = role === 'brand';
  const isCommunity = role === 'community';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        {isBrand ? (
          <Link href="/brand/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
        ) : (
          <Link href="/community/opportunities" className="text-sm text-gray-500 hover:text-gray-800">← Opportunities</Link>
        )}
        <h1 className="text-lg font-semibold">Deal Tracking</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Progress */}
        {deal.status !== 'cancelled' && <StepIndicator status={deal.status} />}

        {/* Deal summary */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Deal ID</p>
              <p className="text-sm font-mono text-gray-600">{deal.id}</p>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              deal.status === 'signed' || deal.status === 'completed' ? 'bg-green-100 text-green-700' :
              deal.status === 'cancelled' ? 'bg-red-100 text-red-600' :
              'bg-blue-100 text-blue-700'
            }`}>
              {STATUS_LABELS[deal.status] || deal.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Agreed Rate</p>
              <p className="font-semibold text-lg">${(deal.agreedRateCents / 100).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Created</p>
              <p>{new Date(deal.createdAt).toLocaleDateString()}</p>
            </div>
            {deal.signedAt && (
              <div>
                <p className="text-gray-400 text-xs">Signed</p>
                <p>{new Date(deal.signedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contract text */}
        {deal.contractText && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold mb-3">Contract</h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded p-4 overflow-auto max-h-80">
              {deal.contractText}
            </pre>
          </div>
        )}

        {/* Actions */}
        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{actionError}</div>
        )}

        {isBrand && deal.status === 'agreed' && (
          <div className="bg-white rounded-lg border p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Ready to negotiate?</p>
              <p className="text-xs text-gray-500 mt-0.5">Run the AI negotiation agent to advance this deal</p>
            </div>
            <button
              onClick={handleNegotiate}
              disabled={loading}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run AI Negotiation'}
            </button>
          </div>
        )}

        {isBrand && deal.status === 'agreed' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>Contract signing — beta notice:</strong> Contract signing is facilitated directly by the Sphere team during beta. Our team will reach out to finalize agreements. Full e-signature integration is coming soon.
            </div>
            <div className="bg-white rounded-lg border p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Generate Contract</p>
                <p className="text-xs text-gray-500 mt-0.5">Create and send the contract to the community owner</p>
              </div>
              <button
                onClick={handleGenerateContract}
                disabled={loading}
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate & Send Contract'}
              </button>
            </div>
          </>
        )}

        {isCommunity && deal.status === 'contract_sent' && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>Contract signing — beta notice:</strong> The Sphere team will follow up with you directly to finalize this agreement. Full e-signature integration is coming soon.
            </div>
            <div className="bg-white rounded-lg border p-5 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Sign Contract</p>
                <p className="text-xs text-gray-500 mt-0.5">Review the contract above and sign to confirm the deal</p>
              </div>
              <button
                onClick={handleSign}
                disabled={loading}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Signing...' : 'Sign Contract'}
              </button>
            </div>
          </>
        )}

        {deal.status === 'signed' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>Payment — beta notice:</strong> Your first transactions are facilitated directly by the Sphere team. Full payment integration (Stripe) is coming soon. Our team will be in touch to process payment.
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
              <p className="font-semibold text-green-700">Deal Signed</p>
              <p className="text-sm text-green-600 mt-1">The contract has been signed. The Sphere team will follow up on payment processing.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
