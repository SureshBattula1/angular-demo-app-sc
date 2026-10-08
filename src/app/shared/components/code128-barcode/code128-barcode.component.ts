import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarcodeBar {
  x: number;
  width: number;
}

const PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'                                 // 100-106
];

const START_B = 104;
const STOP = 106;

@Component({
  selector: 'app-code128-barcode',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="barcode-wrapper" [class]="containerClass">
      <svg
        [attr.viewBox]="'0 0 ' + totalWidth + ' ' + totalHeight"
        [attr.width]="svgWidth"
        [attr.height]="svgHeight"
        xmlns="http://www.w3.org/2000/svg"
        class="barcode-svg"
        preserveAspectRatio="xMidYMid meet">
        <rect
          *ngFor="let bar of bars"
          [attr.x]="bar.x"
          y="0"
          [attr.width]="bar.width"
          [attr.height]="height"
          fill="#000000" />
        <text
          *ngIf="showText"
          [attr.x]="totalWidth / 2"
          [attr.y]="height + fontSize + 2"
          text-anchor="middle"
          fill="#111827"
          [attr.font-size]="fontSize"
          font-family="monospace, monospace"
          font-weight="600"
          letter-spacing="1">
          {{ displayCode }}
        </text>
      </svg>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      line-height: 0;
    }
    .barcode-wrapper {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      max-width: 100%;
    }
    .barcode-svg {
      display: block;
      max-width: 100%;
      height: auto;
    }
  `]
})
export class Code128BarcodeComponent implements OnChanges {
  @Input() code = '';
  @Input() height = 36;
  @Input() scale = 1.4;
  @Input() showText = true;
  @Input() fontSize = 11;
  @Input() quietZone = 8;
  @Input() containerClass = '';

  bars: BarcodeBar[] = [];
  totalWidth = 100;
  totalHeight = 50;
  svgWidth = '100%';
  svgHeight = 'auto';

  get displayCode(): string {
    return this.code || 'NO-BARCODE';
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.generate();
  }

  generate(): void {
    const raw = (this.code || '').trim() || 'BC-0000';
    const codes: number[] = [START_B];
    let checksum = START_B;

    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i);
      // Map ASCII 32..126 to symbol index 0..94
      const symbolIdx = (charCode >= 32 && charCode <= 126) ? charCode - 32 : 0;
      codes.push(symbolIdx);
      checksum += symbolIdx * (i + 1);
    }

    codes.push(checksum % 103);
    codes.push(STOP);

    const bars: BarcodeBar[] = [];
    let currentX = this.quietZone;

    for (const symbolIdx of codes) {
      const pattern = PATTERNS[symbolIdx] || PATTERNS[0];
      for (let j = 0; j < pattern.length; j++) {
        const width = parseInt(pattern[j], 10) * this.scale;
        const isBar = j % 2 === 0; // Even index = bar, odd index = space
        if (isBar) {
          bars.push({ x: currentX, width });
        }
        currentX += width;
      }
    }

    currentX += this.quietZone;
    this.bars = bars;
    this.totalWidth = Math.ceil(currentX);
    this.totalHeight = this.height + (this.showText ? this.fontSize + 6 : 0);
    this.svgWidth = `${this.totalWidth}px`;
    this.svgHeight = `${this.totalHeight}px`;
  }
}
