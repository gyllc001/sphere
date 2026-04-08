'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { dealsApi, contentApi, getToken, type Deal, type ContentSubmission } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  agreed: 'Deal Agreed',
  contract_sent: 'Contract Sent',
  signed: 'Contract Signed',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const CONTENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  posted: 'Posted',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
};

const CONTENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-700',
  changes_requested: 'bg-orange-100 text-orange-700',
  approved: 'bg-blue-100 text-blue-700',
  posted: 'bg-purple-100 text-purple-700',
  confirmed: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
};

function StepIndicator({ status }: { status: string }) {
  const displaySteps = ['agreed', 'contract_sent', 'active', 'completed'];
  const displayLabels: Record<string, string> = {
    agreed: 'Deal Agreed',
    contract_sent: 'Contract Sent',
    active: 'Active',
    completed: 'Completed',
  };
  const normalized = status === 'signed' ? 'active' : status;
  const currentIdx = displaySteps.indexOf(normalized);

  return (
    <div className="flex items-center gap-0 mb-6">
      {displaySteps.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold
            ${idx < currentIdx ? 'bg-green-500 text-white' : ''}
            ${idx === currentIdx ? 'bg-blue-600 text-white' : ''}
            ${idx > currentIdx ? 'bg-gray-200 text-gray-500' : ''}
          `}>
            {idx < currentIdx ? '✓' : idx + 1}
          </div>
          <p className={`ml-1 mr-4 text-xs ${idx === currentIdx ? 'font-medium text-blue-600' : 'text-gray-400'}`}>
            {displayLabels[step]}
          </p>
          {idx < displaySteps.length - 1 && (
            <div className={`h-0.5 w-8 mr-4 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ContentWorkflow({
  dealId,
  role,
  token,
}: {
  dealId: string;
  role: 'brand' | 'community';
  token: string;
}) {
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [brief, setBrief] = useState('');
  const [assetUrls, setAssetUrls] = useState('');
  const [changesNote, setChangesNote] = useState('');
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [postUrl, setPostUrl] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  function load() {
    contentApi.list(token, dealId).then(setSubmissions).catch(() => {});
  }

  useEffect(() => { load(); }, [dealId]);

  const latest = submissions[submissions.length - 1] ?? null;
  const isBrand = role === 'brand';
  const isCommunity = role === 'community';

  async function handleSubmit() {
    if (!brief.trim()) return;
    setLoading(true);
    setActionError('');
    try {
      const urls = assetUrls.split('\n').map(u => u.trim()).filter(Boolean);
      await contentApi.submit(token, dealId, { brief: brief.trim(), assetUrls: urls });
      setBrief('');
      setAssetUrls('');
      setShowSubmitForm(false);
      load();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(submissionId: string) {
    setLoading(true);
    setActionError('');
    try {
      await contentApi.approve(token, dealId, submissionId);
      load();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestChanges(submissionId: string) {
    if (!changesNote.trim()) return;
    setLoading(true);
    setActionError('');
    try {
      await contentApi.requestChanges(token, dealId, submissionId, changesNote.trim());
      setChangesNote('');
      setShowChangesForm(false);
      load();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPosted(submissionId: string) {
    setLoading(true);
    setActionError('');
    try {
      await contentApi.markPosted(token, dealId, submissionId, postUrl.trim() || undefined);
      setPostUrl('');
      setShowPostForm(false);
      load();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(submissionId: string) {
    setLoading(true);
    setActionError('');
    try {
      await contentApi.confirm(token, dealId, submissionId);
      load();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDispute(submissionId: string) {
    if (!disputeNote.trim()) return;
    setLoading(true);
    setActionError('');
    try {
      await contentApi.dispute(token, dealId, submissionId, disputeNote.trim());
      setDisputeNote('');
      setShowDisputeForm(false);
      load();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Content Workflow</h2>
        {isBrand && (!latest || latest.status === 'changes_requested') && (
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
          >
            {latest?.status === 'changes_requested' ? 'Resubmit Content' : 'Submit Content'}
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{actionError}</div>
      )}

      {showSubmitForm && (
        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h3 className="font-medium text-sm">Submit Content for Review</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Creative Brief *</label>
            <textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe what you're delivering — messaging, tone, key points..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Asset URLs (one per line)</label>
            <textarea
              value={assetUrls}
              onChange={e => setAssetUrls(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !brief.trim()}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
            <button
              onClick={() => setShowSubmitForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {latest ? (
        <div className="bg-white rounded-lg border p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Submission</p>
              <p className="text-sm font-mono text-gray-500 mt-0.5">{latest.id.slice(0, 8)}…</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CONTENT_STATUS_COLORS[latest.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {CONTENT_STATUS_LABELS[latest.status] ?? latest.status}
            </span>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Brief</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{latest.brief}</p>
          </div>

          {(() => {
            try {
              const urls: string[] = JSON.parse(latest.assetUrls);
              if (urls.length > 0) {
                return (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Assets</p>
                    <ul className="space-y-1">
                      {urls.map((url, i) => (
                        <li key={i}>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{url}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
            } catch {}
            return null;
          })()}

          {latest.changesRequestedNote && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <p className="text-xs font-medium text-orange-700 mb-1">Changes Requested</p>
              <p className="text-sm text-orange-800">{latest.changesRequestedNote}</p>
            </div>
          )}

          {latest.postUrl && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Published Post</p>
              <a href={latest.postUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{latest.postUrl}</a>
            </div>
          )}

          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${latest.brandApproved ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-gray-500">Brand {latest.brandApproved ? 'approved' : 'pending'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${latest.communityApproved ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-gray-500">Community {latest.communityApproved ? 'approved' : 'pending'}</span>
            </div>
          </div>

          {latest.status === 'confirmed' && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
              Content confirmed. Payout has been queued for the community owner.
            </div>
          )}

          {latest.status === 'disputed' && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-xs font-medium text-red-700 mb-1">Under Dispute — Admin Review</p>
              {latest.disputeNote && <p className="text-sm text-red-800">{latest.disputeNote}</p>}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            {isBrand && ['pending_review', 'changes_requested'].includes(latest.status) && !latest.brandApproved && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Mark your approval of this content</p>
                <button onClick={() => handleApprove(latest.id)} disabled={loading}
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
                  Approve Content
                </button>
              </div>
            )}

            {isCommunity && ['pending_review', 'changes_requested'].includes(latest.status) && !latest.communityApproved && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Approve this content for posting</p>
                <button onClick={() => handleApprove(latest.id)} disabled={loading}
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
                  Approve
                </button>
              </div>
            )}

            {isCommunity && ['pending_review', 'approved'].includes(latest.status) && (
              showChangesForm ? (
                <div className="space-y-2">
                  <textarea value={changesNote} onChange={e => setChangesNote(e.target.value)} rows={3}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    placeholder="Describe what changes are needed..." />
                  <div className="flex gap-2">
                    <button onClick={() => handleRequestChanges(latest.id)} disabled={loading || !changesNote.trim()}
                      className="bg-orange-500 text-white text-sm px-3 py-1.5 rounded hover:bg-orange-600 disabled:opacity-50">
                      Send Feedback
                    </button>
                    <button onClick={() => setShowChangesForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowChangesForm(true)} className="text-sm text-orange-600 hover:text-orange-700 underline">
                  Request Changes
                </button>
              )
            )}

            {isCommunity && latest.status === 'approved' && (
              showPostForm ? (
                <div className="space-y-2">
                  <input type="url" value={postUrl} onChange={e => setPostUrl(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                    placeholder="https://... (optional — link to your post)" />
                  <div className="flex gap-2">
                    <button onClick={() => handleMarkPosted(latest.id)} disabled={loading}
                      className="bg-purple-600 text-white text-sm px-3 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50">
                      {loading ? 'Saving...' : 'Mark as Posted'}
                    </button>
                    <button onClick={() => setShowPostForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Published to your channel? Mark it as live.</p>
                  <button onClick={() => setShowPostForm(true)}
                    className="bg-purple-600 text-white text-sm px-3 py-1.5 rounded hover:bg-purple-700">
                    I Have Posted
                  </button>
                </div>
              )
            )}

            {isBrand && latest.status === 'posted' && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Review and confirm the post</p>
                  <p className="text-xs text-gray-400 mt-0.5">Confirming triggers the payout to the community owner.</p>
                </div>
                <button onClick={() => handleConfirm(latest.id)} disabled={loading}
                  className="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Confirming...' : 'Confirm Post'}
                </button>
              </div>
            )}

            {!['confirmed', 'disputed'].includes(latest.status) && (
              showDisputeForm ? (
                <div className="space-y-2">
                  <textarea value={disputeNote} onChange={e => setDisputeNote(e.target.value)} rows={3}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                    placeholder="Describe the dispute..." />
                  <div className="flex gap-2">
                    <button onClick={() => handleDispute(latest.id)} disabled={loading || !disputeNote.trim()}
                      className="bg-red-600 text-white text-sm px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50">
                      File Dispute
                    </button>
                    <button onClick={() => setShowDisputeForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDisputeForm(true)} className="text-xs text-red-500 hover:text-red-700 underline">
                  File a dispute
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-6 text-center text-gray-400 text-sm">
          {isBrand
            ? 'No content submitted yet. Click "Submit Content" to start the workflow.'
            : 'Waiting for the brand to submit content for review.'}
        </div>
      )}
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
  const [activeToken, setActiveToken] = useState<string>('');

  function getActiveAuth(): { token: string; role: 'brand' | 'community' } | null {
    const brandToken = getToken('brand');
    const communityToken = getToken('community');
    if (brandToken) return { token: brandToken, role: 'brand' };
    if (communityToken) return { token: communityToken, role: 'community' };
    return null;
  }

  function loadDeal() {
    const auth = getActiveAuth();
    if (!auth) { router.replace('/'); return; }
    setRole(auth.role);
    setActiveToken(auth.token);
    dealsApi.get(auth.token, id)
      .then(setDeal)
      .catch((err) => setError(err.message));
  }

  useEffect(() => { loadDeal(); }, [id]);

  async function handleNegotiate() {
    const auth = getActiveAuth();
    if (!auth) return;
    setLoading(true); setActionError('');
    try { await dealsApi.negotiate(auth.token, id); loadDeal(); }
    catch (err: any) { setActionError(err.message); }
    finally { setLoading(false); }
  }

  async function handleGenerateContract() {
    const auth = getActiveAuth();
    if (!auth) return;
    setLoading(true); setActionError('');
    try { await dealsApi.generateContract(auth.token, id); loadDeal(); }
    catch (err: any) { setActionError(err.message); }
    finally { setLoading(false); }
  }

  async function handleSign() {
    const auth = getActiveAuth();
    if (!auth) return;
    setLoading(true); setActionError('');
    try { const updated = await dealsApi.sign(auth.token, id); setDeal(updated); }
    catch (err: any) { setActionError(err.message); }
    finally { setLoading(false); }
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
  const isActiveOrBeyond = ['active', 'signed', 'completed'].includes(deal.status);

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
        {deal.status !== 'cancelled' && <StepIndicator status={deal.status} />}

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Deal ID</p>
              <p className="text-sm font-mono text-gray-600">{deal.id}</p>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              ['signed', 'active', 'completed'].includes(deal.status) ? 'bg-green-100 text-green-700' :
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

        {deal.contractText && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold mb-3">Contract</h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded p-4 overflow-auto max-h-80">
              {deal.contractText}
            </pre>
          </div>
        )}

        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{actionError}</div>
        )}

        {isBrand && deal.status === 'agreed' && (
          <div className="bg-white rounded-lg border p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Ready to negotiate?</p>
              <p className="text-xs text-gray-500 mt-0.5">Run the AI negotiation agent to advance this deal</p>
            </div>
            <button onClick={handleNegotiate} disabled={loading}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
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
              <button onClick={handleGenerateContract} disabled={loading}
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50">
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
              <button onClick={handleSign} disabled={loading}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Signing...' : 'Sign Contract'}
              </button>
            </div>
          </>
        )}

        {isActiveOrBeyond && role && activeToken && (
          <ContentWorkflow dealId={deal.id} role={role} token={activeToken} />
        )}

        {deal.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
            <p className="font-semibold text-green-700">Deal Complete</p>
            <p className="text-sm text-green-600 mt-1">Content confirmed and payout queued for the community owner.</p>
          </div>
        )}
      </main>
    </div>
  );
}
