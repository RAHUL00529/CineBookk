import ReelIcon from "../layout/ReelIcon.jsx";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-b-[50%/28px] bg-gradient-to-r from-[#161a33] via-[#2a1c44] to-brand/80 text-white">
      {/* Decorative only: hidden from screen readers, hidden on small screens */}
      <ReelIcon className="absolute -right-6 -top-10 hidden h-56 w-56 rotate-12 text-white/15 sm:block" />
      <div className="relative mx-auto max-w-6xl px-4 py-9">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Your Next <span className="text-brand">Movie</span> Awaits
        </h1>
        <p className="mt-1 text-gray-200">Book tickets, enjoy the show!</p>
      </div>
    </section>
  );
}
