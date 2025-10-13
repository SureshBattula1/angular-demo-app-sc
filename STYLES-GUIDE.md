# Global Styles Guide

## 🎨 Color Customization

All color codes are defined in `src/styles.css` using CSS variables. To change any color across the entire application, simply update the values in the `:root` section.

### Primary Colors
Located in `styles.css` lines 7-11:
```css
--primary-color: #3f51b5;      /* Main brand color */
--primary-light: #7986cb;      /* Lighter variant */
--primary-dark: #303f9f;       /* Darker variant */
--primary-contrast: #ffffff;   /* Text color on primary */
```

### Accent Colors
Located in `styles.css` lines 13-17:
```css
--accent-color: #ff4081;
--accent-light: #ff79b0;
--accent-dark: #c60055;
--accent-contrast: #ffffff;
```

### Semantic Colors
Located in `styles.css` lines 33-48:
```css
/* Success */
--success-color: #4caf50;
--success-light: #81c784;
--success-dark: #388e3c;

/* Warning */
--warning-color: #ff9800;
--warning-light: #ffb74d;
--warning-dark: #f57c00;

/* Error */
--error-color: #f44336;
--error-light: #e57373;
--error-dark: #d32f2f;

/* Info */
--info-color: #2196f3;
--info-light: #64b5f6;
--info-dark: #1976d2;
```

### Neutral/Gray Scale
Located in `styles.css` lines 19-31:
```css
--white: #ffffff;
--black: #000000;
--gray-50: #fafafa;
--gray-100: #f5f5f5;
--gray-200: #eeeeee;
--gray-300: #e0e0e0;
--gray-400: #bdbdbd;
--gray-500: #9e9e9e;
--gray-600: #757575;
--gray-700: #616161;
--gray-800: #424242;
--gray-900: #212121;
```

### Text Colors
Located in `styles.css` lines 55-59:
```css
--text-primary: rgba(0, 0, 0, 0.87);
--text-secondary: rgba(0, 0, 0, 0.60);
--text-disabled: rgba(0, 0, 0, 0.38);
--text-hint: rgba(0, 0, 0, 0.38);
```

---

## 🔤 Font Family Customization

The global font family is defined in `styles.css` line 103:
```css
font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

### To Change Font:
1. Update the font-family in `styles.css` line 103
2. If using Google Fonts, add the import at the top of `styles.css`:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=YourFont:wght@300;400;500;700&display=swap');
   ```

---

## 🚀 How to Use in Components

### Using Color Variables

#### In CSS Files:
```css
.my-component {
  color: var(--primary-color);
  background-color: var(--success-color);
  border-color: var(--gray-300);
}
```

#### Using Utility Classes in HTML:
```html
<!-- Text Colors -->
<div class="text-primary">Primary text</div>
<div class="text-success">Success text</div>
<div class="text-error">Error text</div>

<!-- Background Colors -->
<div class="bg-primary">Primary background</div>
<div class="bg-success">Success background</div>
```

### Typography Classes

```html
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<p class="body-1">Body text</p>
<p class="caption">Caption text</p>
<p class="subtitle-1">Subtitle</p>
```

### Spacing Utilities

```html
<!-- Margin -->
<div class="m-md">Margin medium</div>
<div class="mt-lg">Margin top large</div>
<div class="mb-sm">Margin bottom small</div>

<!-- Padding -->
<div class="p-lg">Padding large</div>
<div class="pt-md">Padding top medium</div>
```

---

## 📦 Available Utility Classes

### Layout
- **Flexbox**: `d-flex`, `flex-row`, `flex-column`, `justify-center`, `align-center`
- **Grid**: `d-grid`, `grid-cols-2`, `grid-cols-3`, `grid-cols-4`
- **Display**: `d-block`, `d-inline`, `d-none`

### Spacing
- **Margin**: `m-xs`, `m-sm`, `m-md`, `m-lg`, `m-xl`
- **Padding**: `p-xs`, `p-sm`, `p-md`, `p-lg`, `p-xl`
- **Directional**: `mt-*`, `mb-*`, `pt-*`, `pb-*`

### Visual
- **Shadows**: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- **Borders**: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`

### Responsive
- **Hide**: `hide-xs`, `hide-sm`, `hide-md`, `hide-lg`

---

## 🎯 Quick Theme Change Example

Want to change your app from blue to purple theme?

**Just update these 3 lines in `styles.css`:**
```css
--primary-color: #9c27b0;      /* Purple */
--primary-light: #ba68c8;      /* Light purple */
--primary-dark: #7b1fa2;       /* Dark purple */
```

**That's it!** All components using `var(--primary-color)` will automatically update! 🎉

---

## 📝 Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Use utility classes** for common patterns
3. **Keep custom styles minimal** - prefer utilities when possible
4. **Update colors in one place** - the `:root` section in `styles.css`
5. **Test color changes** across all components after updates

---

## 🔍 Quick Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `--primary-color` | Main brand color | Buttons, links |
| `--accent-color` | Secondary accent | Highlights, FABs |
| `--success-color` | Positive actions | Success messages |
| `--error-color` | Errors & warnings | Error states |
| `--text-primary` | Main text | Body content |
| `--gray-*` | Neutral tones | Borders, backgrounds |
| `--spacing-*` | Consistent spacing | Margins, padding |
| `--shadow-*` | Elevation | Cards, modals |

---

## 🎨 Color Palette Preview

Your current color scheme:
- **Primary**: Indigo (#3f51b5)
- **Accent**: Pink (#ff4081)
- **Success**: Green (#4caf50)
- **Warning**: Orange (#ff9800)
- **Error**: Red (#f44336)
- **Info**: Blue (#2196f3)

To preview all colors, check the CSS variables in `src/styles.css` starting at line 6.

