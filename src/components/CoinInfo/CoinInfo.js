import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { HistoricalChart } from '../../config/api';
import { CryptoState } from '../../CryptoContext';
import { chartDays } from '../../config/data';
import { useTheme } from '../../theme/ThemeContext';
import gsap from 'gsap';
import './CoinInfo.css';

const CoinInfo = ({ coin }) => {
  const [historicData, setHistoricData] = useState(null);
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currency } = CryptoState();
  const { theme } = useTheme();
  const chartRef = useRef(null);

  const isDark = theme === 'dark';
  const chartColors = {
    grid: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    axis: isDark ? '#8993A4' : '#94A3B8',
    tooltipBg: isDark ? 'rgba(13,17,24,0.97)' : 'rgba(255,255,255,0.98)',
    tooltipTitle: isDark ? '#8993A4' : '#64748B',
    tooltipBody: isDark ? '#F5F7FA' : '#111827',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
  };

  const fetchData = useCallback(() => {
    if (!coin || !coin.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    axios.get(HistoricalChart(coin.id, days, currency))
      .then(({ data }) => {
        if (!cancelled) setHistoricData(data.prices);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load chart data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [coin, days, currency]);

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, [fetchData]);

  const handleDayChange = (val) => {
    if (val !== days && chartRef.current) {
      gsap.to(chartRef.current, {
        opacity: 0.3, duration: 0.15, ease: 'power2.out',
        onComplete: () => {
          setDays(val);
          gsap.to(chartRef.current, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        },
      });
    } else {
      setDays(val);
    }
  };

  const isPositive = historicData && historicData.length >= 2
    ? historicData[historicData.length - 1][1] >= historicData[0][1]
    : true;

  const lineColor = isPositive ? '#00D6A3' : '#FF5570';

  const gradientPlugin = {
    id: 'gradientPlugin',
    beforeDraw(chart) {
      const ctx = chart.ctx;
      const area = chart.chartArea;
      if (!area) return;
      const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
      gradient.addColorStop(0, isPositive ? 'rgba(0,214,163,0.30)' : 'rgba(255,85,112,0.30)');
      gradient.addColorStop(0.5, isPositive ? 'rgba(0,214,163,0.08)' : 'rgba(255,85,112,0.08)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      chart.data.datasets[0].backgroundColor = gradient;
    },
  };

  const crosshairPlugin = {
    id: 'crosshairPlugin',
    afterDraw(chart) {
      if (!chart.tooltip._active || !chart.tooltip._active.length) return;
      const ctx = chart.ctx;
      const x = chart.tooltip._active[0].element.x;
      const area = chart.chartArea;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, area.top);
      ctx.lineTo(x, area.bottom);
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    },
  };

  const shadowPlugin = {
    id: 'shadowPlugin',
    beforeDatasetsDraw(chart) {
      chart.ctx.shadowColor = lineColor;
      chart.ctx.shadowBlur = isDark ? 8 : 4;
    },
    afterDatasetsDraw(chart) {
      chart.ctx.shadowColor = 'transparent';
      chart.ctx.shadowBlur = 0;
    },
  };

  return (
    <div className="coininfo">
      <div className="coininfo__chart-wrap" ref={chartRef}>
        {loading && (
          <div className="coininfo__loading">
            <div className="coininfo__spinner" />
          </div>
        )}
        {error && (
          <div className="coininfo__error">
            {error} <button onClick={fetchData}>Retry</button>
          </div>
        )}
        {!loading && !error && historicData && (
          <Line
            plugins={[gradientPlugin, crosshairPlugin, shadowPlugin]}
            data={{
              labels: historicData.map(([ts]) => {
                const d = new Date(ts);
                if (days === 1) {
                  const h = d.getHours();
                  const m = String(d.getMinutes()).padStart(2, '0');
                  return h > 12 ? `${h - 12}:${m} PM` : `${h}:${m} AM`;
                }
                return d.toLocaleDateString();
              }),
              datasets: [{
                data: historicData.map(([, price]) => price),
                label: `Price (${days}D) in ${currency}`,
                borderColor: lineColor,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: isDark ? '#0D1118' : '#fff',
                pointHoverBorderWidth: 2,
                fill: true,
                tension: 0.4,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: chartColors.tooltipBg,
                  titleColor: chartColors.tooltipTitle,
                  bodyColor: chartColors.tooltipBody,
                  borderColor: chartColors.tooltipBorder,
                  borderWidth: 1,
                  padding: 12,
                  callbacks: {
                    title: (items) => {
                      if (!items.length) return '';
                      const ts = historicData[items[0].dataIndex]?.[0];
                      if (!ts) return '';
                      const d = new Date(ts);
                      if (days === 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    },
                    label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: chartColors.axis, maxTicksLimit: 8, font: { size: 11 } },
                  border: { display: false },
                },
                y: {
                  position: 'right',
                  grid: { color: chartColors.grid },
                  ticks: { color: chartColors.axis, font: { size: 11 }, callback: v => v.toLocaleString() },
                  border: { display: false },
                },
              },
            }}
          />
        )}
      </div>

      <div className="coininfo__controls">
        {chartDays.map(d => (
          <button
            key={d.value}
            className={`day-btn ${days === d.value ? 'active' : ''}`}
            onClick={() => handleDayChange(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoinInfo;
