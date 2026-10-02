import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ThemeService } from '../../../../core/services/theme.service';
import { chartCssVar, chartSurfaceColor, chartTextColor, chartTooltipColor } from '../chart-theme';

Chart.register(...registerables);

export interface DoughnutChartData {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
}

@Component({
  selector: 'app-doughnut-chart',
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
      height: 250px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    canvas {
      max-height: 100%;
      max-width: 100%;
    }
  `]
})
export class DoughnutChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data: DoughnutChartData | null = null;
  @Input() height = '250px';
  @Input() responsive = true;
  @Input() showLegend = true;
  @Input() showPercentage = true;
  
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      this.themeService.currentTheme();
      this.applyThemeChrome();
    });
  }

  private themePalette(): string[] {
    return [
      chartCssVar('--success-color', '#16A34A'),
      chartCssVar('--error-color', '#DC2626'),
      chartCssVar('--warning-color', '#F59E0B'),
      chartCssVar('--info-color', '#2563EB'),
      chartCssVar('--primary-color', '#1E88E5'),
      chartCssVar('--accent-color', '#00B8D9')
    ];
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
    const prev = changes['data'].previousValue as DoughnutChartData | null;
    const curr = changes['data'].currentValue as DoughnutChartData | null;
    if (this.sameChartData(prev, curr)) {
      return;
    }
    if (!this.chart) {
      this.createChart();
      return;
    }
    this.updateChart();
  }

  private sameChartData(a: DoughnutChartData | null, b: DoughnutChartData | null): boolean {
    if (a === b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private createChart(): void {
    if (!this.canvasRef || !this.data) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: this.data.labels,
        datasets: [{
          data: this.data.data,
          backgroundColor: this.data.backgroundColor || this.themePalette(),
          borderColor: this.data.borderColor || this.sliceBorders(this.data.data.length),
          borderWidth: 2
        }]
      },
      options: {
        responsive: this.responsive,
        maintainAspectRatio: false,
        elements: {
          arc: {
            borderWidth: 2
          }
        },
        cutout: '60%',
        plugins: {
          legend: {
            display: this.showLegend,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              color: chartTextColor(),
              font: {
                size: 12
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets[0].data) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i] as number;
                    const total = (data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                    
                    return {
                      text: this.showPercentage 
                        ? `${label}: ${percentage}%` 
                        : `${label}: ${value}`,
                      fillStyle: (data.datasets[0].backgroundColor as string[])[i],
                      fontColor: chartTextColor(),
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
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
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
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
    this.chart.data.datasets[0].data = this.data.data;
    this.chart.data.datasets[0].backgroundColor = this.data.backgroundColor || this.themePalette();
    this.chart.data.datasets[0].borderColor = this.data.borderColor || this.sliceBorders(this.data.data.length);
    this.applyThemeChrome();
  }

  private sliceBorders(count: number): string[] {
    return Array.from({ length: count }, () => chartSurfaceColor());
  }

  private applyThemeChrome(): void {
    if (!this.chart) {
      return;
    }
    const legend = this.chart.options.plugins?.legend?.labels;
    if (legend) {
      legend.color = chartTextColor();
    }
    const tooltip = this.chart.options.plugins?.tooltip;
    if (tooltip) {
      tooltip.backgroundColor = chartTooltipColor();
      tooltip.titleColor = '#ffffff';
      tooltip.bodyColor = '#ffffff';
    }
    this.chart.update('none');
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

