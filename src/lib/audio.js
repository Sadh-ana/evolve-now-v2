// Web Audio API micro-sounds — optional, user-toggleable
let audioEnabled = localStorage.getItem('evolve_audio') === 'true'

export function setAudioEnabled(val) {
  audioEnabled = val
  localStorage.setItem('evolve_audio', val)
}

export function getAudioEnabled() {
  return audioEnabled
}

let ctx = null
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

export function playComplete() {
  if (!audioEnabled) return
  try {
    const c = getCtx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g); g.connect(c.destination)
    o.frequency.setValueAtTime(523, c.currentTime)
    o.frequency.setValueAtTime(659, c.currentTime + 0.1)
    g.gain.setValueAtTime(0.15, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
    o.start(); o.stop(c.currentTime + 0.4)
  } catch {}
}

export function playClick() {
  if (!audioEnabled) return
  try {
    const c = getCtx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g); g.connect(c.destination)
    o.frequency.setValueAtTime(300, c.currentTime)
    g.gain.setValueAtTime(0.08, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1)
    o.start(); o.stop(c.currentTime + 0.1)
  } catch {}
}
export const playSound = playComplete