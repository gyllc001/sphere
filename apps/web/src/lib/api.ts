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
  createdAt?: string;
}

export const brandAuth = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    website?: string;
    industry?: string;
    description?: string;
    tosAccepted: boolean;
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

// ── Brand Safety ─────────────────────────────────────────────────────────────

export interface BrandSafetySettings {
  excludedCategories: string[];
  excludedKeywords: string[];
  availableCategories: readonly string[];
}

export const brandSafety = {
  get: (token: string) =>
    request<BrandSafetySettings>('/api/brands/auth/me/safety-settings', { token }),

  update: (token: string, data: { excludedCategories: string[]; excludedKeywords: string[] }) =>
    request<BrandSafetySettings>('/api/brands/auth/me/safety-settings', {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),
};

// ── Community Topics ──────────────────────────────────────────────────────────

export interface CommunityTopics {
  topics: string[];
  availableTopics: readonly string[];
}

export const communityTopics = {
  get: (token: string, communityId: string) =>
    request<CommunityTopics>(`/api/owner/communities/${communityId}/topics`, { token }),

  update: (token: string, communityId: string, topics: string[]) =>
    request<CommunityTopics>(`/api/owner/communities/${communityId}/topics`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ topics }),
    }),
};

// ── Community Auth ───────────────────────────────────────────────────────────

export interface CommunityOwner {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export const communityAuth = {
  register: (data: { name: string; email: string; password: string; bio?: string; tosAccepted: boolean }) =>
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
  notifiedCount?: number;
  interestedCount?: number;
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
    request<{ total: number; byStatus: Record<string, number>; totalNotified: number; totalInterested: number; campaigns: Campaign[] }>(
      '/api/campaigns/dashboard/summary',
      { token }
    ),

  partnerships: (token: string, campaignId: string) =>
    request<Partnership[]>(`/api/campaigns/${campaignId}/partnerships`, { token }),

  listApplications: (token: string, campaignId: string) =>
    request<InboundApplication[]>(`/api/campaigns/${campaignId}/applications`, { token }),

  decideApplication: (
    token: string,
    campaignId: string,
    appId: string,
    decision: 'accept' | 'decline',
    extra?: { note?: string; agreedRateCents?: number }
  ) =>
    request(`/api/campaigns/${campaignId}/applications/${appId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ decision, ...extra }),
    }),

  report: (token: string, campaignId: string) =>
    request<CampaignReport>(`/api/campaigns/${campaignId}/report`, { token }),
};

export interface CampaignReportDeal {
  dealId: string;
  communityName: string;
  platform: string;
  memberCount: number | null;
  niche: string | null;
  ownerName: string;
  agreedRateCents: number;
  dealStatus: string;
  paymentStatus: string | null;
  signatureStatus: string;
  signedContractUrl: string | null;
  deliverables: string | null;
  paidAt: string | null;
  completedAt: string | null;
  dealCreatedAt: string;
}

export interface CampaignReport {
  generatedAt: string;
  campaign: Campaign;
  summary: {
    totalDeals: number;
    activeDeals: number;
    completedDeals: number;
    totalContractedCents: number;
    totalSpentCents: number;
    estimatedTotalReach: number;
  };
  deals: CampaignReportDeal[];
}

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

export interface BrowseCampaign {
  id: string;
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
  brandName: string;
  brandId: string;
  myApplication: { status: string; applicationId: string } | null;
}

export interface CampaignApplication {
  applicationId: string;
  status: string;
  pitch: string;
  proposedRateCents?: number;
  brandNote?: string;
  dealId?: string;
  createdAt: string;
  updatedAt: string;
  communityId: string;
  communityName: string;
  campaignId: string;
  campaignTitle: string;
  campaignNiche?: string;
  campaignBudgetCents?: number;
  campaignStatus: string;
  brandId: string;
  brandName: string;
}

export interface InboundApplication {
  applicationId: string;
  status: string;
  pitch: string;
  proposedRateCents?: number;
  brandNote?: string;
  dealId?: string;
  createdAt: string;
  communityId: string;
  communityName: string;
  communityPlatform: string;
  communityMemberCount: number;
  communityNiche?: string;
  communityDescription?: string;
  ownerName: string;
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

  browseCampaigns: (token: string, filters?: { niche?: string; minBudget?: number; maxBudget?: number }) => {
    const params = new URLSearchParams();
    if (filters?.niche) params.set('niche', filters.niche);
    if (filters?.minBudget) params.set('minBudget', String(filters.minBudget));
    if (filters?.maxBudget) params.set('maxBudget', String(filters.maxBudget));
    const qs = params.toString();
    return request<BrowseCampaign[]>(`/api/owner/browse-campaigns${qs ? `?${qs}` : ''}`, { token });
  },

  apply: (token: string, campaignId: string, data: { communityId: string; pitch: string; proposedRateCents?: number }) =>
    request<CampaignApplication>(`/api/owner/campaigns/${campaignId}/apply`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  myApplications: (token: string) =>
    request<CampaignApplication[]>('/api/owner/my-applications', { token }),
};

export const communityProfileApi = {
  get: (token: string, communityId: string) =>
    request<CommunityProfile>(`/api/campaigns/communities/${communityId}`, { token }),
};

// ── Billing ───────────────────────────────────────────────────────────────────

export interface SubscriptionInfo {
  tier: 'starter' | 'growth' | 'scale' | null;
  status: string | null;
  partnershipLimit: number;
  tierDetails: { name: string; priceMonthCents: number; partnershipLimit: number } | null;
  tiers: Record<string, { name: string; priceMonthCents: number; partnershipLimit: number }>;
}

export const billingApi = {
  getSubscription: (token: string) =>
    request<SubscriptionInfo>('/api/billing/subscription', { token }),

  createCheckoutSession: (token: string, tier: 'starter' | 'growth' | 'scale') =>
    request<{ url: string }>('/api/billing/checkout', {
      method: 'POST',
      token,
      body: JSON.stringify({ tier }),
    }),

  createPortalSession: (token: string) =>
    request<{ url: string }>('/api/billing/portal', { method: 'POST', token }),
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

export interface ScrapedCommunity {
  id: string;
  name: string;
  platform: string;
  handle: string | null;
  url: string | null;
  memberCount: number | null;
  estimatedEngagementRate: string | null;
  description: string | null;
  primaryLanguage: string | null;
  location: string | null;
  nicheTags: string[];
  adminContactEmail: string | null;
  adminContactName: string | null;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  scrapedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapedCommunitiesResponse {
  total: number;
  limit: number;
  offset: number;
  communities: ScrapedCommunity[];
}

export interface ScraperStats {
  total: number;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ScrapedCommunitiesFilters {
  platform?: string;
  verificationStatus?: string;
  niche?: string;
  minMembers?: number;
  maxMembers?: number;
  q?: string;
  limit?: number;
  offset?: number;
}

export const adminApi = {
  bulkImport: (adminKey: string, rows: BulkImportRow[]) =>
    request<BulkImportResult>('/api/admin/communities/bulk-import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminKey}` },
      body: JSON.stringify(rows),
    }),

  getScrapedCommunities: (adminKey: string, filters: ScrapedCommunitiesFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.platform) params.set('platform', filters.platform);
    if (filters.verificationStatus) params.set('verificationStatus', filters.verificationStatus);
    if (filters.niche) params.set('niche', filters.niche);
    if (filters.minMembers != null) params.set('minMembers', String(filters.minMembers));
    if (filters.maxMembers != null) params.set('maxMembers', String(filters.maxMembers));
    if (filters.q) params.set('q', filters.q);
    if (filters.limit != null) params.set('limit', String(filters.limit));
    if (filters.offset != null) params.set('offset', String(filters.offset));
    const qs = params.toString();
    return request<ScrapedCommunitiesResponse>(
      `/api/admin/scraped-communities${qs ? `?${qs}` : ''}`,
      { headers: { Authorization: `Bearer ${adminKey}` } },
    );
  },

  getScraperStats: (adminKey: string) =>
    request<ScraperStats>('/api/admin/scraped-communities/stats', {
      headers: { Authorization: `Bearer ${adminKey}` },
    }),

  runScraper: (adminKey: string) =>
    request<{ message: string; results: { platform: string; inserted: number }[] }>(
      '/api/admin/scraper/run',
      { method: 'POST', headers: { Authorization: `Bearer ${adminKey}` } },
    ),
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

// ── Messages ──────────────────────────────────────────────────────────────────

export interface ConversationSummary {
  id: string;
  subject: string | null;
  status: string;
  dealId: string | null;
  brandId: string;
  communityOwnerId: string;
  brandName: string;
  ownerName: string;
  brandLastReadAt: string | null;
  ownerLastReadAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderType: 'brand' | 'community_owner' | 'system';
  senderId: string | null;
  body: string;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: Message[];
}

export const messagesApi = {
  listConversations: (token: string) =>
    request<ConversationSummary[]>('/api/messages/conversations', { token }),

  getConversation: (token: string, id: string) =>
    request<ConversationDetail>(`/api/messages/conversations/${id}`, { token }),

  startConversation: (
    token: string,
    body: {
      communityOwnerId?: string;
      brandId?: string;
      dealId?: string;
      subject?: string;
      initialMessage: string;
    },
  ) =>
    request<{ conversationId: string; message: Message }>(
      '/api/messages/conversations',
      { method: 'POST', token, body: JSON.stringify(body) },
    ),

  sendMessage: (token: string, conversationId: string, messageBody: string) =>
    request<Message>(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      token,
      body: JSON.stringify({ body: messageBody }),
    }),

  markRead: (token: string, conversationId: string) =>
    request<{ ok: boolean }>(`/api/messages/conversations/${conversationId}/read`, {
      method: 'POST',
      token,
    }),
};

// ── Disputes ──────────────────────────────────────────────────────────────────

export interface Dispute {
  id: string;
  dealId: string;
  openedBy: 'brand' | 'community_owner';
  reason: string;
  status: string;
  resolvedByAdminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export const disputesApi = {
  open: (token: string, dealId: string, reason: string) =>
    request<Dispute>('/api/disputes', {
      method: 'POST',
      token,
      body: JSON.stringify({ dealId, reason }),
    }),

  get: (token: string, id: string) =>
    request<Dispute & { comments: any[] }>(`/api/disputes/${id}`, { token }),

  addComment: (token: string, id: string, body: string) =>
    request('/api/disputes/${id}/comments', {
      method: 'POST',
      token,
      body: JSON.stringify({ body }),
    }),
};

// ── Deal Feedback ─────────────────────────────────────────────────────────────

export interface DealFeedbackPayload {
  dealQuality: number;
  easeOfUse: number;
  repeatIntent: 'yes' | 'no' | 'maybe';
  openText?: string;
}

export interface DealFeedbackResponse extends DealFeedbackPayload {
  id: string;
  dealId: string;
  userId: string;
  userRole: string;
  submittedAt: string;
}

export const feedbackApi = {
  getMyFeedback: (token: string, dealId: string) =>
    request<DealFeedbackResponse | null>(`/api/deals/${dealId}/feedback/me`, { token }),

  submit: (token: string, dealId: string, data: DealFeedbackPayload) =>
    request<DealFeedbackResponse>(`/api/deals/${dealId}/feedback`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),
};
