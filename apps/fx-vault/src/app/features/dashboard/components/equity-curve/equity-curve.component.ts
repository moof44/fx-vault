import {
  Component,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  AreaData,
  Time,
  AreaSeries,
} from 'lightweight-charts';
import { TradeStore } from '../../../../core/store/trade.store';
import { TRADE_UI_DICT } from '../../../../core/content/trade-ui.dict';

@Component({
  selector: 'app-equity-curve',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equity-curve.component.html',
  styleUrl: './equity-curve.component.scss',
})
export class EquityCurveComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: false })
  chartContainerRef!: ElementRef<HTMLDivElement>;

  readonly store = inject(TradeStore);
  readonly dict = TRADE_UI_DICT;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private chart: IChartApi | null = null;
  private areaSeries: ISeriesApi<'Area'> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const trades = this.store.filteredTrades();
      if (!this.areaSeries) return;

      const sorted = [...trades].sort((a, b) => a.openDate - b.openDate);
      let cumulative = 0;
      const data: AreaData<Time>[] = [];
      let lastTime = 0;

      for (let i = 0; i < sorted.length; i++) {
        const trade = sorted[i];
        cumulative += trade.profit || 0;
        let timeInSec = Math.floor(trade.openDate / 1000);

        if (timeInSec <= lastTime) {
          timeInSec = lastTime + 1;
        }
        lastTime = timeInSec;

        data.push({
          time: timeInSec as Time,
          value: Number(cumulative.toFixed(2)),
        });
      }

      this.areaSeries.setData(data);
      if (data.length > 0 && this.chart) {
        this.chart.timeScale().fitContent();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.chartContainerRef) return;

    const container = this.chartContainerRef.nativeElement;

    this.chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        vertLine: { color: '#38bdf8', labelBackgroundColor: '#0f172a' },
        horzLine: { color: '#38bdf8', labelBackgroundColor: '#0f172a' },
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      height: 300,
    });

    this.areaSeries = this.chart.addSeries(AreaSeries, {
      lineColor: '#38bdf8',
      topColor: 'rgba(56, 189, 248, 0.35)',
      bottomColor: 'rgba(56, 189, 248, 0.0)',
      lineWidth: 2,
    });

    this.resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && this.chart) {
        const width = entries[0].contentRect.width;
        this.chart.applyOptions({ width });
      }
    });
    this.resizeObserver.observe(container);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.remove();
    }
  }
}
