export default function DateStrip({ days, selected, onSelect }) {
  return (
    <div
      role="group"
      aria-label="Choose a date"
      className="flex gap-2 overflow-x-auto py-1"
    >
      {days.map((d) => {
        const active = d.value === selected;
        return (
          <button
            key={d.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(d.value)}
            className={`flex w-14 shrink-0 flex-col items-center rounded-lg border px-2 py-2 ${
              active
                ? "border-ink bg-ink text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <span className="text-base font-bold">{d.day}</span>
            <span className="text-xs">{d.weekday}</span>
            <span className="text-[10px]">{d.month}</span>
          </button>
        );
      })}
    </div>
  );
}
