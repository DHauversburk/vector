/**
 * Plain-English tips shown in loading states.
 *
 * Note: the export name `TACTICAL_TIPS` is preserved for backward compat
 * (consumers may still import it). The contents were rewritten in the
 * Sprint 14 streamline pass — military-LARP copy ("Mission Control",
 * "End-to-End Character Escaping for PHI safety") didn't help users
 * understand the app. New copy is short, useful, plain.
 */
export const TACTICAL_TIPS = [
  'Set a 4-digit PIN for faster sign-in next time.',
  'The offline indicator means your changes will sync automatically.',
  'Export appointments to your calendar from the appointment menu.',
  'Tap the help button anytime to reach your clinical team.',
  'Providers can generate up to 14 days of slots at once.',
  'Enable biometric sign-in in Security settings for one-tap access.',
]

/**
 * Returns a random tip.
 */
export const getRandomTip = () => TACTICAL_TIPS[Math.floor(Math.random() * TACTICAL_TIPS.length)]
