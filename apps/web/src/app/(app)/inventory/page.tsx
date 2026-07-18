export default function InventoryPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl text-mos-amber">Инвентарь</h1>
      <p className="mt-2 text-mos-muted">COSMETIC / TROPHY / COLLECTIBLE из school.fencing starter pack. Сетка слотов в стиле Ведьмака.</p>
      <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square border border-mos-line/40 bg-mos-stone/30" />
        ))}
      </div>
    </main>
  );
}
