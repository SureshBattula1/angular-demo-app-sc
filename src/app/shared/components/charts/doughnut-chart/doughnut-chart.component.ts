import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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
export class DoughnutChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: DoughnutChartData | null = null;
  @Input() height: string = '250px';
  @Input() responsive: boolean = true;
  @Input() showLegend: boolean = true;
  @Input() showPercentage: boolean = true;
  
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  // Default color scheme (Material Design colors)
  private defaultColors = [
    '#4CAF50', // Green
    '#F44336', // Red
    '#FF9800', // Orange
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#FF5722'  // Deep Orange
  ];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
    }
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
          backgroundColor: this.data.backgroundColor || this.defaultColors,
          borderColor: this.data.borderColor || ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff'],
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
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    this.chart.data.datasets[0].backgroundColor = this.data.backgroundColor || this.defaultColors;
    
    this.chart.update('none');
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

