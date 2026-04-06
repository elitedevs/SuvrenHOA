export type PlanTier = 'starter' | 'professional' | 'enterprise';

export type PlanFeature =
  | 'basic_governance'
  | 'treasury_management'
  | 'document_storage'
  | 'community_forum'
  | 'maintenance_tracking'
  | 'health_score'
  | 'advanced_reports'
  | 'custom_branding'
  | 'api_access'
  | 'white_label'
  | 'priority_support'
  | 'bulk_operations';

type PlanConfig = {
  name: string;
  maxProperties: number;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  description: string;
};

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  starter: {
    name: 'Starter',
    maxProperties: 50,
    monthlyPrice: 49,
    annualPrice: 470,
    description: 'For small communities getting started with modern governance',
    features: [
      'basic_governance',
      'treasury_management',
      'document_storage',
      'community_forum',
      'maintenance_tracking',
    ],
  },
  professional: {
    name: 'Professional',
    maxProperties: 200,
    monthlyPrice: 129,
    annualPrice: 1238,
    description: 'For growing communities that need advanced tools',
    features: [
      'basic_governance',
      'treasury_management',
      'document_storage',
      'community_forum',
      'maintenance_tracking',
      'health_score',
      'advanced_reports',
      'custom_branding',
      'priority_support',
      'bulk_operations',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    maxProperties: Infinity,
    monthlyPrice: 249,
    annualPrice: 2390,
    description: 'For large communities and management companies',
    features: [
      'basic_governance',
      'treasury_management',
      'document_storage',
      'community_forum',
      'maintenance_tracking',
      'health_score',
      'advanced_reports',
      'custom_branding',
      'api_access',
      'white_label',
      'priority_support',
      'bulk_operations',
    ],
  },
};

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  basic_governance: 'Governance & Voting',
  treasury_management: 'Treasury Management',
  document_storage: 'Document Storage',
  community_forum: 'Community Forum',
  maintenance_tracking: 'Maintenance Tracking',
  health_score: 'Community Health Score',
  advanced_reports: 'Advanced Reports & Analytics',
  custom_branding: 'Custom Branding',
  api_access: 'API Access',
  white_label: 'White-Label Option',
  priority_support: 'Priority Support',
  bulk_operations: 'Bulk Operations',
};

export function isFeatureAvailable(plan: PlanTier, feature: PlanFeature): boolean {
  return PLAN_CONFIGS[plan].features.includes(feature);
}

export function getPropertyLimit(plan: PlanTier): number {
  return PLAN_CONFIGS[plan].maxProperties;
}

export function isWithinPropertyLimit(plan: PlanTier, currentCount: number): boolean {
  return currentCount < PLAN_CONFIGS[plan].maxProperties;
}

/** Grace period: 7 days after payment failure before read-only */
export const GRACE_PERIOD_DAYS = 7;

/** Trial duration: 60 days */
export const TRIAL_DURATION_DAYS = 60;
