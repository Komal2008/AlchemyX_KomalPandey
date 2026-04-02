import { useMemo } from 'react';

export const ActivityHeatmap = () => {
  const data = useMemo(() => {
    return Array.from({ length: 364 }, () => Math.random());
  }, []);
  const columns = Math.ceil(data.length / 7);

  return (
    <div className="w-full overflow-hidden">
      <div
        className="grid w-full gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
        }}
      >
        {data.map((v, i) => (
          <div
            key={i}
            className="aspect-square w-full rounded-sm transition-colors"
            style={{
              backgroundColor: v < 0.1 ? 'hsl(224 29% 14%)' : v < 0.3 ? 'hsl(187 100% 50% / 0.15)' : v < 0.6 ? 'hsl(187 100% 50% / 0.35)' : v < 0.85 ? 'hsl(187 100% 50% / 0.6)' : 'hsl(187 100% 50% / 0.9)',
            }}
            title={`Day ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
