import React from 'react';

interface HistogramChartProps {
  distribution?: Record<string, number>;
  totalCount?: number;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  distribution = {},
}) => {
  const keys = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];
  const counts = keys.map((k) => distribution[k] || 0);
  const maxCount = Math.max(...counts, 1);

  return (
    <div style={{ width: '100%' }}>
      <div className="histogram-container">
        {keys.map((key, index) => {
          const count = counts[index];
          const heightPercent = Math.max(4, Math.round((count / maxCount) * 100));

          return (
            <div key={key} className="histogram-column">
              <div
                className="histogram-bar"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: count > 0 ? '#435465' : '#222a33',
                }}
              />
              <div className="histogram-tooltip">
                {key}★ : {count} {count === 1 ? 'vote' : 'votes'}
              </div>
            </div>
          );
        })}
      </div>
      <div className="histogram-labels">
        <span>0.5★</span>
        <span>★ ★ ★</span>
        <span>5.0★</span>
      </div>
    </div>
  );
};
