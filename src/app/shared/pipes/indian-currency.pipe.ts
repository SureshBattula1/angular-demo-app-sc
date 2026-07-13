import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indianCurrency',
  standalone: true
})
export class IndianCurrencyPipe implements PipeTransform {
  /**
   * Format number in Indian numbering system (lakhs, crores)
   * Example: 1150000 -> "11,50,000.00"
   * Indian system: groups of 2 digits after the first 3 digits from right
   * 
   * @param value - The number to format
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted string in Indian numbering system
   */
  transform(value: number | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.' + '0'.repeat(decimals);
    }

    // Convert to string and split by decimal point
    const numStr = value.toFixed(decimals);
    const parts = numStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '0'.repeat(decimals);

    // Format integer part in Indian numbering system
    // Process from right to left: first 3 digits, then groups of 2
    const len = integerPart.length;
    const formattedParts: string[] = [];
    
    if (len === 0) {
      return '0.' + decimalPart;
    }
    
    // Take first 3 digits from right
    const firstGroupLength = Math.min(3, len);
    const firstGroup = integerPart.slice(-firstGroupLength);
    formattedParts.unshift(firstGroup);
    
    // Then take groups of 2 digits from remaining
    let remaining = integerPart.slice(0, -firstGroupLength);
    while (remaining.length > 0) {
      const groupLength = Math.min(2, remaining.length);
      const group = remaining.slice(-groupLength);
      formattedParts.unshift(group);
      remaining = remaining.slice(0, -groupLength);
    }
    
    const formatted = formattedParts.join(',');

    return formatted + '.' + decimalPart;
  }
}

