const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getToken(role: 'brand' | 'community'): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`sphere_token_${role}`);
}

export function setToken(role: 'brand' | 'community', token: string) {
  localStorage.setItem(`sphere_token_${role}`, token);
}

export function clearToken(role: 'brand' | 'community') {
  localStorage.removeItem(`sphere_token_${role}`);
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ── Brand Auth ──────────────────────────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  email: string;
  slug: string;
  website?: string;
  industry?: string;
  description?: string;
}

export const brandAuth = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    website?: string;
    industry?: string;
    description?: string;
  }) =>
    request<{ token: string; brand: Brand }>('/api/brands/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; brand: Brand }>('/api/brands/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<Brand>('/api/brands/auth/me', { token }),
};

// ── Community Auth ───────────────────────────────────────────────────────────

export interface CommunityOwner {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}

export const communityAuth = {
  register: (data: { name: string; email: string; password: string; bio?: string }) =>
    request<{ token: string; owner: CommunityOwner }>('/api/communities/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; owner: CommunityOwner }>('/api/communities/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<CommunityOwner>('/api/communities/auth/me', { token }),
};

// ── Campaigns ────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  brief: string;
  objectives?: string;
  targetAudience?: string;
  niche?: string;
  minCommunitySize?: number;
  budgetCents?: number;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Partnership {
  requestId: string;
  status: string;
  matchScore?: number;
  matchRationale?: string;
  proposedRateCents?: number;
  message?: string;
  communityId: string;
  communityName: string;
  communityPlatform: string;
  communityMemberCount: number;
  communityAdminDiscordUserId?: string;
  communityAdminPhone?: string;
  communityAdminFacebookPageId?: string;
  ownerName: string;
  deal: Deal | null;
}

export const campaigns = {
  create: (token: string, data: Partial<Campaign>) =>
    request<Campaign>('/api/campaigns', { method: 'POST', token, body: JSON.stringify(data) }),

  list: (token: string) =>
    request<Campaign[]>('/api/campaigns', { token }),

  get: (token: string, id: string) =>
    request<Campaign>(`/api/campaigns/${id}`, { token }),

  dashboard: (token: string) =>
    request<{ total: number; byStatus: Record<string, number>; campaigns: Campaign[] }>(
      '/api/campaigns/dashboard/summary',
      { token }
    ),

  partnerships: (token: string, campaignId: string) =>
    request<Partnership[]>(`/api/campaigns/${campaignId}/partnerships`, { token }),
};

// ── Community Portal ──────────────────────────────────────────────────────────

export interface Community {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  platform: string;
  platformUrl?: string;
  niche?: string;
  description?: string;
  memberCount: number;
  engagementRate?: string;
  baseRate?: number;
  adminDiscordUserId?: string;
  adminPhone?: string;
  adminFacebookPageId?: string;
  vertical?: string;
  contentTypesAccepted?: string; // JSON array string
  topicsExcluded?: string; // JSON array string
  verificationStatus?: string;
  status: string;
}

export interface CommunityProfile {
  id: string;
  name: string;
  platform: string;
  platformUrl?: string;
  niche?: string;
  description?: string;
  memberCount: number;
  engagementRate?: string;
  vertical?: string;
  contentTypesAccepted?: string;
  topicsExcluded?: string;
  verificationStatus: string;
  status: string;
  baseRate?: number;
  ownerName: string;
  createdAt: string;
}

export interface Opportunity {
  requestId: string;
  requestStatus: string;
  matchScore?: number;
  matchRationale?: string;
  proposedRateCents?: number;
  message?: string;
  initiatedByAi: boolean;
  createdAt: string;
  communityId: string;
  communityName: string;
  campaignId: string;
  campaignTitle: string;
  campaignBrief: string;
  campaignNiche?: string;
  brandId: string;
  brandName: string;
}

export const communityPortal = {
  createCommunity: (token: string, data: Partial<Community> & { contentTypesAccepted?: string[]; topicsExcluded?: string[] }) =>
    request<Community>('/api/owner/communities', { method: 'POST', token, body: JSON.stringify(data) }),

  updateCommunity: (token: string, id: string, data: Partial<Community> & { contentTypesAccepted?: string[]; topicsExcluded?: string[] }) =>
    request<Community>(`/api/owner/communities/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),

  listCommunities: (token: string) =>
    request<Community[]>('/api/owner/communities', { token }),

  listOpportunities: (token: string) =>
    request<Opportunity[]>('/api/owner/opportunities', { token }),

  respond: (
    token: string,
    requestId: string,
    action: 'accept' | 'decline' | 'counter',
    extra?: { reason?: string; counterRateCents?: number; message?: string }
  ) =>
    request(`/api/owner/opportunities/${requestId}/respond`, {
      method: 'POST',
      token,
      body: JSON.stringify({ action, ...extra }),
    }),
};

export const communityProfileApi = {
  get: (token: string, communityId: string) =>
    request<CommunityProfile>(`/api/campaigns/communities/${communityId}`, { token }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface BulkImportRow {
  communityName: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  platform: string;
  vertical?: string;
  size?: number;
  rateCents?: number;
  adminDiscordUserId?: string;
  adminFacebookPageId?: string;
  status?: string;
}

export interface BulkImportResult {
  total: number;
  succeeded: number;
  failed: number;
  results: { success: boolean; row: number; communityId?: string; ownerId?: string; error?: string }[];
}

export const adminApi = {
  bulkImport: (adminKey: string, rows: BulkImportRow[]) =>
    request<BulkImportResult>('/api/admin/communities/bulk-import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminKey}` },
      body: JSON.stringify(rows),
    }),
};

// ── Deals ─────────────────────────────────────────────────────────────────────

export interface Deal {
  id: string;
  partnershipRequestId: string;
  campaignId: string;
  communityId: string;
  agreedRateCents: number;
  status: string;
  contractText?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const dealsApi = {
  get: (token: string, id: string) =>
    request<Deal>(`/api/deals/${id}`, { token }),

  negotiate: (token: string, id: string) =>
    request(`/api/deals/${id}/negotiate`, { method: 'POST', token }),

  generateContract: (token: string, id: string) =>
    request<{ contractText: string; status: string }>(`/api/deals/${id}/contract`, {
      method: 'POST',
      token,
    }),

  sign: (token: string, id: string) =>
    request<Deal>(`/api/deals/${id}/sign`, { method: 'PATCH', token }),
};

// ── Content Submissions ───────────────────────────────────────────────────────

export type ContentSubmissionStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'approved'
  | 'posted'
  | 'confirmed'
  | 'disputed';

export interface ContentSubmission {
  id: string;
  dealId: string;
  brief: string;
  assetUrls: string; // JSON array string
  status: ContentSubmissionStatus;
  brandApproved: number;
  communityApproved: number;
  changesRequestedNote?: string;
  postUrl?: string;
  postedAt?: string;
  confirmedAt?: string;
  payoutQueuedAt?: string;
  disputedAt?: string;
  disputeNote?: string;
  createdAt: string;
  updatedAt: string;
}

export const contentApi = {
  list: (token: string, dealId: string) =>
    request<ContentSubmission[]>(`/api/deals/${dealId}/content`, { token }),

  submit: (token: string, dealId: string, data: { brief: string; assetUrls?: string[] }) =>
    request<ContentSubmission>(`/api/deals/${dealId}/content`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  approve: (token: string, dealId: string, submissionId: string) =>
    request<ContentSubmission>(`/api/deals/${dealId}/content/${submissionId}/approve`, {
      method: 'POST',
      token,
    }),

  requestChanges: (token: string, dealId: string, submissionId: string, note: string) =>
    request<ContentSubmission>(`/api/deals/${dealId}/content/${submissionId}/request-changes`, {
      method: 'POST',
      token,
      body: JSON.stringify({ note }),
    }),

  markPosted: (token: string, dealId: string, submissionId: string, postUrl?: string) =>
    request<ContentSubmission>(`/api/deals/${dealId}/content/${submissionId}/posted`, {
      method: 'POST',
      token,
      body: JSON.stringify({ postUrl }),
    }),

  confirm: (token: string, dealId: string, submissionId: string) =>
    request<{ submission: ContentSubmission; payoutQueued: boolean; message: string }>(
      `/api/deals/${dealId}/content/${submissionId}/confirm`,
      { method: 'POST', token }
    ),

  dispute: (token: string, dealId: string, submissionId: string, note: string) =>
    request<{ submission: ContentSubmission; message: string }>(
      `/api/deals/${dealId}/content/${submissionId}/dispute`,
      { method: 'POST', token, body: JSON.stringify({ note }) }
    ),
};
