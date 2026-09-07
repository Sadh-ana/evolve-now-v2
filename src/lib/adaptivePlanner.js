// Deterministic, explainable rules — no AI call, instant, free, and always
// reproducible. This is what actually reshapes the day, not a chatbot
// pretending to. Extend this as you learn what your archetypes need.
export function getAdaptivePlan({ mood = 3, energy = 3, archetype = '' }) {
  const isADHD = archetype === 'adhd'
  const isBurnout = archetype === 'burnout-prone'
  const isPerfectionist = archetype === 'perfectionist'

  if (energy <= 2) {
    return {
      mode: 'low',
      protectedHabitCount: isBurnout ? 1 : 2,
      taskLimit: isADHD ? 3 : 2,
      headline: 'Low energy today — plan adjusted',
      advice: isADHD
        ? 'Break everything into 10-minute chunks. Pick 3 tiny tasks, not big ones.'
        : 'Only your top habits are protected today. Aim for 2 tasks max, not the full list.',
    }
  }
  if (mood <= 2 && isBurnout) {
    return {
      mode: 'recovery',
      protectedHabitCount: 1,
      taskLimit: 1,
      headline: 'Recovery mode active',
      advice: 'One habit, one task, nothing else. Rest counts as progress today.',
    }
  }
  if (energy >= 4 && mood >= 4) {
    return {
      mode: 'high',
      protectedHabitCount: 99,
      taskLimit: 8,
      headline: 'Good energy — good day to push',
      advice: isPerfectionist
        ? 'Time-box your hardest task to 90 minutes. Done beats perfect today.'
        : 'Tackle your hardest task first while your energy is high.',
    }
  }
  return {
    mode: 'normal',
    protectedHabitCount: 99,
    taskLimit: 5,
    headline: 'Standard day',
    advice: 'Steady pace — work through your list in priority order.',
  }
}