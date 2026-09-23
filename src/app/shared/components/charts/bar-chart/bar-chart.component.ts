import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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
export class BarChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: BarChartData | null = null;
  @Input() height: string = '300px';
  @Input() responsive: boolean = true;
  @Input() showLegend: boolean = true;
  @Input() horizontal: boolean = false;
  @Input() stacked: boolean = false; // Enable stacked mode
  
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

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

    const config: ChartConfiguration = {
      type: this.horizontal ? 'bar' : 'bar',
      data: {
        labels: this.data.labels,
        datasets: this.data.datasets.map(dataset => ({
          label: dataset.label,
          data: dataset.data,
          backgroundColor: dataset.backgroundColor || '#2196F3',
          borderColor: dataset.borderColor || '#1976D2',
          borderWidth: 1,
          borderRadius: this.horizontal ? 6 : 4,
          barPercentage: this.horizontal ? 0.7 : 0.8, // Reduce bar width for spacing
          categoryPercentage: this.horizontal ? 0.8 : 0.9 // Add space between categories
        }))
      },
      options: {
        indexAxis: this.horizontal ? 'y' : 'x',
        responsive: this.responsive,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.showLegend,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 4,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null || context.parsed.x !== null) {
                  const value = context.parsed.y || context.parsed.x;
                  label += '$' + value.toLocaleString();
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
            grid: {
              color: this.horizontal ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              display: !this.horizontal // Hide grid on Y-axis for horizontal charts
            },
            ticks: {
              font: {
                size: this.horizontal ? 12 : 11
              },
              // For horizontal charts, Y-axis shows labels (not numbers)
              ...(this.horizontal ? {
                autoSkip: false,
                padding: 10
              } : {
                stepSize: 1,
                callback: function(value: any) {
                  return Number.isInteger(value) ? value : null;
                }
              })
            }
          },
          x: {
            stacked: this.stacked,
            grid: {
              display: this.horizontal, // Show grid on X-axis for horizontal charts
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: this.horizontal ? 11 : 10
              },
              // For horizontal charts, X-axis shows numbers
              ...(this.horizontal ? {
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
    this.chart.data.datasets = this.data.datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor || '#2196F3',
      borderColor: dataset.borderColor || '#1976D2',
      borderWidth: 1,
      borderRadius: 4
    }));
    
    this.chart.update('none');
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

