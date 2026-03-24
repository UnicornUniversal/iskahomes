export const analyticsPalette = {
  primary: '#0f766e',
  primarySoft: 'rgba(15, 118, 110, 0.14)',
  secondary: '#0ea5e9',
  secondarySoft: 'rgba(14, 165, 233, 0.14)',
  violet: '#6366f1',
  violetSoft: 'rgba(99, 102, 241, 0.14)',
  emerald: '#10b981',
  emeraldSoft: 'rgba(16, 185, 129, 0.14)',
  amber: '#f59e0b',
  amberSoft: 'rgba(245, 158, 11, 0.16)',
  rose: '#ef4444',
  roseSoft: 'rgba(239, 68, 68, 0.14)',
  slate: '#17637C',
  slateSoft: 'rgba(100, 116, 139, 0.14)',
  grid: 'rgba(148, 163, 184, 0.16)',
  border: 'rgba(226, 232, 240, 0.95)',
  tooltipBg: '#0f172a',
  tooltipText: '#e2e8f0'
}

export const analyticsClasses = {
  section:
    'default_bg2 rounded-[28px] bg-white/20 p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.32)] backdrop-blur sm:p-7',
  subPanel: 'default_bg2 rounded-3xl bg-white/20 p-5',
  statCard: 'default_bg2 rounded-3xl bg-white/20 p-4 shadow-sm',
  compactCard: 'default_bg2 rounded-2xl bg-white/20 p-4 shadow-sm',
  iconWrap:
    'flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset',
  eyebrow:
    'inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary_color',
  title: 'text-xl font-semibold text-primary_color',
  subtitle: 'text-sm leading-6 text-primary_color/70',
  metricLabel: 'text-sm font-medium text-primary_color/70',
  metricValue: 'text-2xl font-semibold tracking-tight text-primary_color',
  empty:
    'default_bg2 rounded-3xl bg-white/20 px-6 py-10 text-center text-sm text-primary_color/70'
}

export function formatPercent(value, digits = 1) {
  const numeric = Number(value || 0)
  return `${numeric.toFixed(digits)}%`
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

export function baseChartOptions(overrides = {}) {
  const {
    legendPosition = 'top',
    showLegend = true,
    yMax,
    yTitle,
    xTitle,
    secondaryAxis,
    stacked = false
  } = overrides

  const scales = {
    x: {
      stacked,
      grid: { display: false },
      border: { display: false },
      ticks: { color: analyticsPalette.slate, font: { size: 11 } },
      ...(xTitle
        ? {
            title: {
              display: true,
              text: xTitle,
              color: analyticsPalette.slate
            }
          }
        : {})
    },
    y: {
      stacked,
      beginAtZero: true,
      border: { display: false },
      grid: { color: analyticsPalette.grid },
      ticks: { color: analyticsPalette.slate, font: { size: 11 } },
      ...(typeof yMax === 'number' ? { max: yMax } : {}),
      ...(yTitle
        ? {
            title: {
              display: true,
              text: yTitle,
              color: analyticsPalette.slate
            }
          }
        : {})
    }
  }

  if (secondaryAxis) {
    scales.y1 = {
      type: 'linear',
      display: true,
      position: 'right',
      beginAtZero: true,
      border: { display: false },
      grid: { drawOnChartArea: false },
      ticks: { color: analyticsPalette.slate, font: { size: 11 } },
      ...(typeof secondaryAxis.max === 'number' ? { max: secondaryAxis.max } : {}),
      ...(secondaryAxis.title
        ? {
            title: {
              display: true,
              text: secondaryAxis.title,
              color: analyticsPalette.slate
            }
          }
        : {})
    }
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
          padding: 18,
          color: analyticsPalette.slate,
          font: { size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: analyticsPalette.tooltipBg,
        titleColor: '#f8fafc',
        bodyColor: analyticsPalette.tooltipText,
        padding: 12,
        cornerRadius: 12
      }
    },
    elements: {
      line: {
        tension: 0.35
      }
    },
    scales
  }
}
