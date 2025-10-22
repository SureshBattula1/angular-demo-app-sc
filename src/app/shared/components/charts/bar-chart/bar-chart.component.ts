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
          borderRadius: 4
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
            cornerRadius: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11
              },
              stepSize: 1, // Force whole numbers
              callback: function(value) {
                return Number.isInteger(value) ? value : null; // Only show integers
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              },
              maxRotation: 45, // Rotate labels for better visibility
              minRotation: 45,
              autoSkip: false // Show all labels
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

