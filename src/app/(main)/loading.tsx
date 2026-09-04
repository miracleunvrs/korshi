export default function MainLoading() {
  return (
    <div className="animate-pulse px-4 py-6 sm:px-6" aria-label="Загрузка раздела" aria-busy="true">
      <div className="h-3 w-28 rounded-full bg-stone-200" />
      <div className="mt-3 h-8 w-56 max-w-[80%] rounded-xl bg-stone-200" />
      <div className="mt-2 h-4 w-72 max-w-full rounded-full bg-stone-100" />
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 rounded-[24px] bg-stone-100" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-32 rounded-[28px] border border-stone-100 bg-white shadow-sm" />
        ))}
      </div>
      <span className="sr-only">Загружаем данные…</span>
    </div>
  );
}
