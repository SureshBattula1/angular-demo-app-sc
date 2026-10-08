import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ThemeService } from '../../../../core/services/theme.service';
import { chartGridColor, chartTextColor, chartTooltipColor } from '../chart-theme';

Chart.register(...registerables);

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [style.height]="height">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      height: 300px;
    }
    
    canvas {
      max-height: 100%;
    }
  `]
})
export class BarChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data: BarChartData | null = null;
  @Input() height = '300px';
  @Input() responsive = true;
  @Input() showLegend = true;
  @Input() horizontal = false;
  @Input() stacked = false; // Enable stacked mode
  /** Shown before tooltip values. Empty by default so counts are not labeled as currency. */
  @Input() valuePrefix = '';
  /** Integer tick steps. Turn off for large currency amounts. */
  @Input() countAxis = true;
  /** Draw each bar's value, including 0, so empty columns stay visible. */
  @Input() showValues = false;
  
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      this.themeService.currentTheme();
      this.applyThemeChrome();
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['data']) {
      return;
    }
    if (changes['data'].firstChange) {
      if (this.canvasRef) {
        this.createChart();
      }
      return;
    }
    const prev = changes['data'].previousValue as BarChartData | null;
    const curr = changes['data'].currentValue as BarChartData | null;
    if (JSON.stringify(prev) === JSON.stringify(curr)) {
      return;
    }
    if (!this.chart) {
      this.createChart();
      return;
    }
    this.updateChart();
  }

  private createChart(): void {
    if (!this.canvasRef || !this.data) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: this.horizontal ? 'bar' : 'bar',
      data: {
        labels: this.data.labels,
        datasets: this.data.datasets.map(dataset => this.barDataset(dataset))
      },
      plugins: this.showValues ? [this.valueLabelPlugin()] : [],
      options: {
        indexAxis: this.horizontal ? 'y' : 'x',
        responsive: this.responsive,
        maintainAspectRatio: false,
        layout: {
          padding: { top: this.showValues && !this.horizontal ? 16 : 0 }
        },
        plugins: {
          legend: {
            display: this.showLegend,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              color: chartTextColor(),
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: chartTooltipColor(),
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12,
            cornerRadius: 4,
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const value = this.horizontal ? context.parsed.x : context.parsed.y;
                if (value !== null && value !== undefined) {
                  label += this.valuePrefix + Number(value).toLocaleString('en-IN');
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            stacked: this.stacked,
            suggestedMax: !this.horizontal && this.allValuesZero() ? 1 : undefined,
            grid: {
              color: chartGridColor(),
              display: !this.horizontal // Hide grid on Y-axis for horizontal charts
            },
            ticks: {
              color: chartTextColor(),
              font: {
                size: this.horizontal ? 12 : 11
              },
              // For horizontal charts, Y-axis shows labels (not numbers)
              ...(this.horizontal ? {
                autoSkip: false,
                padding: 10
              } : this.countAxis ? {
                stepSize: 1,
                callback: function(value: any) {
                  return Number.isInteger(value) ? value : null;
                }
              } : {})
            }
          },
          x: {
            stacked: this.stacked,
            grid: {
              display: this.horizontal, // Show grid on X-axis for horizontal charts
              color: chartGridColor()
            },
            suggestedMax: this.horizontal && this.allValuesZero() ? 1 : undefined,
            ticks: {
              color: chartTextColor(),
              font: {
                size: this.horizontal ? 11 : 10
              },
              // For horizontal charts, X-axis shows numbers
              ...(this.horizontal && this.countAxis ? {
                callback: function(value: any) {
                  return Number.isInteger(value) ? value : null;
                }
              } : {
                maxRotation: 45,
                minRotation: 45,
                autoSkip: false
              })
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart || !this.data) return;

    this.chart.data.labels = this.data.labels;
    this.chart.data.datasets = this.data.datasets.map(dataset => this.barDataset(dataset));

    const valueScale = this.horizontal ? this.chart.options.scales?.['x'] : this.chart.options.scales?.['y'];
    if (valueScale) {
      valueScale.suggestedMax = this.allValuesZero() ? 1 : undefined;
    }

    this.chart.update('none');
  }

  private barDataset(dataset: BarChartData['datasets'][number]) {
    return {
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor || chartTooltipColor(),
      borderColor: dataset.borderColor || dataset.backgroundColor || chartTooltipColor(),
      borderWidth: 0,
      borderRadius: 3,
      barPercentage: 0.55,
      categoryPercentage: 0.62,
      maxBarThickness: this.horizontal ? 12 : 18
    };
  }

  private allValuesZero(): boolean {
    const values = this.data?.datasets.flatMap(dataset => dataset.data) || [];
    return values.length > 0 && values.every(value => Number(value) === 0);
  }

  private valueLabelPlugin() {
    const valuePrefix = this.valuePrefix;
    const horizontal = this.horizontal;
    return {
      id: 'barValueLabels',
      afterDatasetsDraw(chart: Chart) {
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = '11px sans-serif';
        ctx.fillStyle = chartTextColor();
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (meta.hidden) {
            return;
          }
          meta.data.forEach((element, index) => {
            const raw = dataset.data[index];
            const value = typeof raw === 'number' ? raw : 0;
            const formatted = Math.abs(value).toLocaleString('en-IN');
            const text = value < 0 ? `-${valuePrefix}${formatted}` : `${valuePrefix}${formatted}`;
            const pos = element.tooltipPosition(false);
            const x = pos.x ?? 0;
            const y = pos.y ?? 0;
            if (horizontal) {
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, x + 4, y);
            } else {
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(text, x, Math.max(12, y - 2));
            }
          });
        });
        ctx.restore();
      }
    };
  }

  private applyThemeChrome(): void {
    if (!this.chart) {
      return;
    }
    const text = chartTextColor();
    const grid = chartGridColor();
    const legend = this.chart.options.plugins?.legend?.labels;
    if (legend) {
      legend.color = text;
    }
    const tooltip = this.chart.options.plugins?.tooltip;
    if (tooltip) {
      tooltip.backgroundColor = chartTooltipColor();
      tooltip.titleColor = '#ffffff';
      tooltip.bodyColor = '#ffffff';
    }
    for (const axis of ['x', 'y'] as const) {
      const scale = this.chart.options.scales?.[axis];
      if (!scale) {
        continue;
      }
      if (scale.ticks) {
        scale.ticks.color = text;
      }
      if (scale.grid) {
        scale.grid.color = grid;
      }
    }
    this.chart.update('none');
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

