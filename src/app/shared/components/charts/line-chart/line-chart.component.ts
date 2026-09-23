import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
  }[];
}

@Component({
  selector: 'app-line-chart',
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
export class LineChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: LineChartData | null = null;
  @Input() height: string = '300px';
  @Input() responsive: boolean = true;
  @Input() showLegend: boolean = true;
  @Input() showGrid: boolean = true;
  
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
      type: 'line',
      data: {
        labels: this.data.labels,
        datasets: this.data.datasets.map(dataset => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.borderColor || '#4CAF50',
          backgroundColor: dataset.backgroundColor || 'rgba(76, 175, 80, 0.1)',
          tension: dataset.tension ?? 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2
        }))
      },
      options: {
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
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: this.showGrid,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
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
      borderColor: dataset.borderColor || '#4CAF50',
      backgroundColor: dataset.backgroundColor || 'rgba(76, 175, 80, 0.1)',
      tension: dataset.tension ?? 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2
    }));
    
    this.chart.update('none'); // Update without animation for better performance
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

