'use client';
import { useEffect } from 'react';

export default function VitalsReporter() {
  useEffect(() => {
    // CLS
    let clsValue = 0;
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        // ignore if occurred during recent input (Web Vitals rule)
        if (!entry.hadRecentInput) clsValue += entry.value || 0;
      }
    });
    try { clsObs.observe({ type: 'layout-shift', buffered: true as any }); } catch {}

    // LCP (take the last reported)
    let lcpValue = 0;
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      if (last) lcpValue = last.renderTime || last.loadTime || last.startTime || 0;
    });
    try { lcpObs.observe({ type: 'largest-contentful-paint', buffered: true as any }); } catch {}

    // Basic input metric (first-input delay-ish)
    let fidValue = 0;
    const fidObs = new PerformanceObserver((list) => {
      const first = list.getEntries()[0] as any;
      if (first) fidValue = first.processingStart - first.startTime;
    });
    try { fidObs.observe({ type: 'first-input', buffered: true as any }); } catch {}

    const send = (name: string, value: number) => {
      const body = JSON.stringify({ name, value, ts: Date.now(), path: location.pathname });
      // Prefer beacon (non-blocking); fallback to fetch keepalive
      if (navigator.sendBeacon) navigator.sendBeacon('/api/vitals', body);
      else fetch('/api/vitals', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    };

    // Send once after load + on visibility change (catch final LCP)
    const finalize = () => {
      send('LCP', lcpValue);
      send('CLS', Number(clsValue.toFixed(4)));
      send('FID', Math.max(0, Math.round(fidValue)));
    };
    window.addEventListener('load', finalize, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') finalize();
    });

    return () => {
      try { clsObs.disconnect(); } catch {}
      try { lcpObs.disconnect(); } catch {}
      try { fidObs.disconnect(); } catch {}
    };
  }, []);

  return null;
}