import dynamic from 'next/dynamic';

// Import Plotly in a dynamic fashion so it only loads on the client. Plotly
// cannot be rendered on the server due to the lack of a DOM. Using
// dynamic(() => import(...), { ssr: false }) ensures the chart only loads
// once the page has hydrated.
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// This component visualizes a simple backtest showing how our scanner
// outperforms the S&P 500 over a simulated 60 day period. The values are
// synthetic and mirror those used in the provided backend.
export default function ComparisonChart() {
  const days = Array.from({ length: 60 }, (_, i) => i + 1);
  const ourEquity = days.map((d) => 10000 * (1 + 0.287 * d / 59));
  const spyEquity = days.map((d) => 10000 * (1 + 0.062 * d / 59));

  return (
    <Plot
      data={[
        {
          x: days,
          y: ourEquity,
          type: 'scatter',
          mode: 'lines',
          line: { color: 'green', width: 3 },
          name: 'Our Scanner',
        },
        {
          x: days,
          y: spyEquity,
          type: 'scatter',
          mode: 'lines',
          line: { color: 'gray', width: 2, dash: 'dash' },
          name: 'S&P 500 (SPY)',
        },
      ]}
      layout={{
        title: 'Account Growth Over Time (Simulated $10K)',
        xaxis: { title: 'Days' },
        yaxis: { title: 'Account Value ($)' },
        paper_bgcolor: '#F3F4F6',
        plot_bgcolor: '#F3F4F6',
        height: 300,
        margin: { t: 40, b: 40, l: 40, r: 20 },
      }}
      useResizeHandler
      style={{ width: '100%', height: '300px' }}
    />
  );
}