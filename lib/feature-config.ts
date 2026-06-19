/**
 * Feature Config — Types & Defaults
 *
 * File ini TIDAK menggunakan 'use server' karena dipakai
 * di client components (onboarding, settings) dan server actions.
 */

export type FeatureConfig = {
  enableInventory: boolean
  enablePayables: boolean
  enableReceivables: boolean
  enableBudget: boolean
  enableGoals: boolean
  enableTelegram: boolean
  enableTeam: boolean
  goalContributionAsExpense: boolean
}

/** Default config berdasarkan accountType */
export function getDefaultFeatureConfig(accountType: 'personal' | 'business'): FeatureConfig {
  if (accountType === 'personal') {
    return {
      enableInventory: false,
      enablePayables: false,
      enableReceivables: false,
      enableBudget: true,
      enableGoals: true,
      enableTelegram: true,
      enableTeam: false,
      goalContributionAsExpense: false,
    }
  }
  // Business defaults
  return {
    enableInventory: false,   // opt-in, tidak semua bisnis butuh
    enablePayables: true,
    enableReceivables: true,
    enableBudget: true,
    enableGoals: true,
    enableTelegram: true,
    enableTeam: false,        // opt-in
    goalContributionAsExpense: false,
  }
}
