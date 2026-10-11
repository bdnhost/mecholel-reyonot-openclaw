export interface UserProfileInput {
  professionField: string;
  customField?: string;
  targetClients: string;
  sellableSkills: string[];
  recurringProcesses: string;
  clientAccess: 'exists' | 'partial' | 'none';
  weeklyHours: '5-10' | '10-20' | '20+';
  budget: '0-100' | '100-500' | '500-2000';
  businessModel: 'one_off_service' | 'retainer' | 'productized_service' | 'internal_savings';
  validationDays: 7 | 14 | 30;
  languageRegion: 'israel' | 'global';
  excludedAreas?: string;
  dataSensitivity: 'standard' | 'sensitive';
}

export interface DimensionScore {
  score: number; // 0 - 5
  explanation: string;
}

export interface IdeaScores {
  userSkillsFit: DimensionScore; // 20%
  buyerAccess: DimensionScore; // 20%
  problemUrgency: DimensionScore; // 20%
  fastValidation: DimensionScore; // 15%
  techFeasibility: DimensionScore; // 10%
  initialCostsRisk: DimensionScore; // 10%
  dataRisk: DimensionScore; // 5%
  weightedTotal: number;
}

export interface DemandExperiment {
  timeframeDays: number;
  targetMetric: string;
  steps: string[];
}

export interface EconomicEstimate {
  potentialRevenue: string;
  directCosts: string;
  laborHours: string;
  platformFees: string;
  netMarginNote: string;
  statusLabel: 'אומדן' | 'הנחה' | 'דיווח משתמש' | 'נתון מאומת';
}

export interface IdeaItem {
  id: string;
  title: string;
  oneLineValue: string;
  targetCustomer: {
    whoPays: string;
    businessType: string;
    role: string;
  };
  painPoint: {
    currentAction: string;
    costAndFriction: string;
  };
  initialOffer: string;
  openClawRole: {
    automatedSteps: string[];
    suggestedIntegrations: string[];
  };
  humanInTheLoop: string[];
  demandExperiment: DemandExperiment;
  pricingHypothesis: {
    range: string;
    drivers: string;
    disclaimer: string;
  };
  economicEstimate: EconomicEstimate;
  successAndStopMetrics: {
    successSignals: string[];
    stopOrPivotSignals: string[];
  };
  securityAndRisks: {
    permissionsRisk: string;
    privacyNotes: string;
    platformDependency: string;
    hallucinationRisk: string;
  };
  confidence: {
    level: 'נמוכה' | 'בינונית' | 'גבוהה';
    reason: string;
  };
  scores: IdeaScores;
  disqualificationCheck: {
    passed: boolean;
    reason?: string;
  };
  // Local user testing feedback
  userFeedback?: {
    relevance: 'relevant' | 'not_relevant' | null;
    testedWithClient: 'tested' | 'not_tested' | null;
    notes: string;
    updatedAt?: string;
  };
}

export interface OutreachPackage {
  whatsappMessage: string;
  coldEmail: string;
  interviewQuestions: string[];
  pilotProposal: {
    objective: string;
    scope: string;
    humanOversight: string;
    pilotPrice: string;
  };
}
