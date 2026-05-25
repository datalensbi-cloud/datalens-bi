import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

interface EChartsChartProps {
  option: EChartsOption;
  className?: string;
  ariaLabel?: string;
}

/**
 * Lightweight ECharts wrapper. We use vanilla echarts (not echarts-for-react)
 * for tighter control over lifecycle and easier integration with re-renders
 * triggered by chart config changes.
 */
export function EChartsChart({ option, className, ariaLabel = 'Chart' }: EChartsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, true);
    }
  }, [option]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={cn('h-full w-full', className)}
    />
  );
}
