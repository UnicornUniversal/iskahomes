'use client'

import React from 'react'

export default function ReportDataCard({
  title,
  value,
  hint,
  change,
  tone = 'default',
}) {
  const warn = tone === 'warn'
  const changeValue = Number(change?.change_percentage)
  const hasChange = Number.isFinite(changeValue)
  const up = changeValue >= 0

  return (
    <article className={`min-w-0 border-t pt-4 ${warn ? 'border-primary_red/50' : 'border-primary_color/20'}`}>
      <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${warn ? 'text-primary_red/80' : 'text-primary_color/50'}`}>
        {title}
      </p>
      <p className={`mt-2 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] sm:text-[2rem] ${warn ? 'text-primary_red' : 'text-primary_color'}`}>
        {value}
      </p>
      {(hint || hasChange) && (
        <p className="mt-2 text-[12px] leading-5 text-primary_color/50">
          {hint}
          {hasChange ? (
            <span className={`ml-2 font-medium ${up ? 'text-primary_green' : 'text-primary_red'}`}>
              {up ? '↑' : '↓'} {Math.abs(changeValue).toFixed(1)}%
            </span>
          ) : null}
        </p>
      )}
    </article>
  )
}
