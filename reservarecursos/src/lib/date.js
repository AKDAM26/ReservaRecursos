export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d, days) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthLabel(d, locale = 'es-ES') {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    d,
  )
}

// Semana empieza en lunes (España): 0=lunes...6=domingo
export function weekdayIndexMondayFirst(d) {
  const js = d.getDay() // 0=domingo..6=sábado
  return (js + 6) % 7
}

export function getMonthGrid(monthDate) {
  const y = monthDate.getFullYear()
  const m = monthDate.getMonth()

  const first = new Date(y, m, 1)
  const firstIndex = weekdayIndexMondayFirst(first)
  const gridStart = addDays(first, -firstIndex)

  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const date = addDays(gridStart, i)
    const inMonth = date.getMonth() === m
    cells.push({ date, inMonth })
  }

  return cells
}

