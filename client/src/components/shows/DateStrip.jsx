export default function DateStrip({ days, selected, onSelect }) {
  return (
    <div
      role="group"
      aria-label="Choose a date"
      className="flex gap-3 overflow-x-auto px-1 pb-3 pt-1"
    >
      {days.map((d) => {
        const active = d.value === selected;
        return (
          <button
            key={d.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(d.value)}
            className={`flex w-16 shrink-0 flex-col items-center rounded-xl px-2 py-3 text-xs transition ${
              active
                ? "bg-brand text-white shadow-lg shadow-brand/30"
                : "bg-white text-gray-700 shadow-md hover:-translate-y-0.5 hover:shadow-lg"
            }`}
          >
            <span className="text-xl font-bold">{d.day}</span>
            <span className="font-medium">{d.weekday}</span>
            <span className="text-[10px] uppercase">{d.month}</span>
          </button>
        );
      })}
    </div>
  );
}
