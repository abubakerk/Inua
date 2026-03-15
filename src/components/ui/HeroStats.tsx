// src/components/ui/HeroStats.tsx
export default function HeroStats() {
  const stats = [
    { value: '5', label: 'Countries' },
    { value: '2,400+', label: 'Active jobs' },
    { value: '800+', label: 'Employers' },
    { value: 'Free', label: 'For seekers' },
  ]
  return (
    <div className="flex justify-center gap-8 mt-8 flex-wrap">
      {stats.map(s => (
        <div key={s.label} className="text-center">
          <div className="text-2xl font-bold text-emerald-700 font-serif">{s.value}</div>
          <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
