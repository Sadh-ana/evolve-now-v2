// Analytics helper — tracks key conversion events
// Supports GA4 and Plausible out of the box

export function trackEvent(eventName, props = {}) {
  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, props)
  }
  // Plausible
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props })
  }
  // Dev logging
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, props)
  }
}

export const events = {
  CTA_START_FREE: 'cta_start_free',
  CTA_BEGIN_JOURNEY: 'cta_begin_journey',
  CTA_GET_STARTED: 'cta_get_started',
  CTA_SEE_HOW: 'cta_see_how',
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
}