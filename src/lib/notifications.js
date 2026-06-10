export function requestPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    return Notification.requestPermission()
  }
  return Promise.resolve(Notification.permission)
}

export function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg' })
  }
}

export function scheduleDailyReminder(title, body, hour = 20, minute = 0) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  const delay = target.getTime() - now.getTime()
  const id = setTimeout(() => {
    notify(title, body)
    scheduleDailyReminder(title, body, hour, minute) // reschedule tomorrow
  }, delay)
  return id
}

export function cancelReminder(id) {
  clearTimeout(id)
}