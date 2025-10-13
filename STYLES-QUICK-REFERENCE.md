# Styles Quick Reference Cheat Sheet 🚀

## 🎨 Color Variables

```css
/* Primary Colors */
var(--primary-color)
var(--primary-light)
var(--primary-dark)

/* Semantic Colors */
var(--success-color)
var(--warning-color)
var(--error-color)
var(--info-color)

/* Gray Scale */
var(--gray-50) to var(--gray-900)

/* Text Colors */
var(--text-primary)
var(--text-secondary)
var(--text-disabled)
```

---

## 🔘 Buttons

| Class | Description |
|-------|-------------|
| `.btn-primary` | Primary button |
| `.btn-secondary` | Secondary/accent button |
| `.btn-outlined` | Outlined button |
| `.btn-text` | Text-only button |
| `.btn-icon` | Icon button |
| `.btn-fab` | Floating action button |
| `.btn-success` | Success button |
| `.btn-warning` | Warning button |
| `.btn-error` | Error/danger button |
| `.btn-small` | Small size |
| `.btn-large` | Large size |
| `.btn-block` | Full width |
| `.btn-loading` | Loading state |

---

## 🃏 Cards

| Class | Description |
|-------|-------------|
| `.card` | Basic card |
| `.card-outlined` | Outlined variant |
| `.card-elevated` | Elevated with shadow |
| `.card-primary` | Primary colored |
| `.card-header` | Card header section |
| `.card-title` | Card title |
| `.card-body` | Card content area |
| `.card-footer` | Card footer |
| `.card-image` | Full-width image |
| `.card-stats` | Statistics card |
| `.card-profile` | Profile card |
| `.card-pricing` | Pricing card |
| `.card-grid` | Grid layout for cards |

---

## 📊 Tables

| Class | Description |
|-------|-------------|
| `.table` | Basic table |
| `.table-striped` | Striped rows |
| `.table-bordered` | With borders |
| `.table-compact` | Less padding |
| `.table-selectable` | Clickable rows |
| `.table-responsive` | Mobile responsive |
| `.table-cell-numeric` | Right-aligned numbers |
| `.table-cell-status` | Status badge |
| `.table-header-sortable` | Sortable header |
| `.table-toolbar` | Search/filter bar |
| `.table-pagination` | Pagination controls |

---

## 🪟 Modals

| Class | Description |
|-------|-------------|
| `.modal-overlay` | Modal backdrop |
| `.modal` | Basic modal |
| `.modal-small` | Small size (400px) |
| `.modal-large` | Large size (800px) |
| `.modal-fullscreen` | Full screen |
| `.modal-alert` | Alert modal (red) |
| `.modal-success` | Success modal (green) |
| `.modal-warning` | Warning modal (orange) |
| `.modal-confirm` | Confirmation dialog |
| `.modal-bottom-sheet` | Bottom sheet |
| `.modal-side-panel` | Side panel |

---

## 📝 Forms

| Class | Description |
|-------|-------------|
| `.form-control` | Input field |
| `.form-label` | Field label |
| `.form-control-sm` | Small input |
| `.form-control-lg` | Large input |
| `.is-valid` | Valid state (green) |
| `.is-invalid` | Invalid state (red) |
| `.form-check` | Checkbox/radio wrapper |
| `.custom-checkbox` | Custom checkbox |
| `.custom-radio` | Custom radio |
| `.form-switch` | Toggle switch |
| `.form-file` | File upload |
| `.input-group` | Input with prefix/suffix |
| `.form-floating` | Floating label |

---

## 📐 Layout Utilities

### Flexbox
```html
<div class="d-flex justify-center align-center">
  Content
</div>
```

| Class | Description |
|-------|-------------|
| `.d-flex` | Display flex |
| `.flex-row` | Row direction |
| `.flex-column` | Column direction |
| `.justify-center` | Center horizontally |
| `.justify-between` | Space between |
| `.align-center` | Center vertically |
| `.align-start` | Align top |

### Grid
```html
<div class="d-grid grid-cols-3 gap-md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

| Class | Description |
|-------|-------------|
| `.d-grid` | Display grid |
| `.grid-cols-2` | 2 columns |
| `.grid-cols-3` | 3 columns |
| `.grid-cols-4` | 4 columns |
| `.gap-sm` | Small gap |
| `.gap-md` | Medium gap |
| `.gap-lg` | Large gap |

---

## 📏 Spacing

### Margin
```html
<div class="m-md">All sides</div>
<div class="mt-lg">Top only</div>
<div class="mb-sm">Bottom only</div>
```

| Class | Value |
|-------|-------|
| `.m-xs` | 4px |
| `.m-sm` | 8px |
| `.m-md` | 16px |
| `.m-lg` | 24px |
| `.m-xl` | 32px |

### Padding
Use same pattern: `.p-xs`, `.p-sm`, `.p-md`, `.p-lg`, `.p-xl`

---

## 🎨 Text & Colors

### Text Colors
```html
<p class="text-primary">Primary text</p>
<p class="text-success">Success text</p>
<p class="text-error">Error text</p>
```

| Class | Color |
|-------|-------|
| `.text-primary` | Primary color |
| `.text-accent` | Accent color |
| `.text-success` | Green |
| `.text-warning` | Orange |
| `.text-error` | Red |
| `.text-muted` | Gray |

### Background Colors
```html
<div class="bg-primary">Primary background</div>
```

| Class | Background |
|-------|------------|
| `.bg-primary` | Primary color |
| `.bg-success` | Green |
| `.bg-warning` | Orange |
| `.bg-error` | Red |
| `.bg-white` | White |

---

## 🌈 Visual Utilities

### Shadows
```html
<div class="shadow-md">Content</div>
```

| Class | Shadow |
|-------|--------|
| `.shadow-sm` | Small |
| `.shadow-md` | Medium |
| `.shadow-lg` | Large |
| `.shadow-xl` | Extra large |
| `.shadow-none` | No shadow |

### Border Radius
```html
<div class="rounded-lg">Content</div>
```

| Class | Radius |
|-------|--------|
| `.rounded-sm` | 4px |
| `.rounded-md` | 8px |
| `.rounded-lg` | 12px |
| `.rounded-full` | Full circle |

---

## 📱 Responsive

| Class | Breakpoint | Hidden When |
|-------|------------|-------------|
| `.hide-xs` | < 600px | Mobile |
| `.hide-sm` | 600-959px | Tablet |
| `.hide-md` | 960-1279px | Desktop |
| `.hide-lg` | ≥ 1280px | Large screens |

---

## 🎯 Common Patterns

### Card with Button
```html
<div class="card">
  <h3 class="card-title">Title</h3>
  <p class="card-content">Content here</p>
  <div class="card-actions">
    <button class="btn-primary">Action</button>
  </div>
</div>
```

### Form Group
```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-control">
  <small class="form-text">Help text</small>
</div>
```

### Modal Template
```html
<div class="modal-overlay">
  <div class="modal modal-medium">
    <div class="modal-header">
      <h2 class="modal-title">Title</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">Content</div>
    <div class="modal-footer">
      <button class="btn-text">Cancel</button>
      <button class="btn-primary">OK</button>
    </div>
  </div>
</div>
```

### Table with Actions
```html
<div class="table-container">
  <table class="table table-striped">
    <thead>
      <tr>
        <th>Name</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td class="table-cell-actions">
          <button class="btn-icon">✏️</button>
          <button class="btn-icon">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🔄 Quick Theme Change

### Change Primary Color (CSS)
Edit `src/styles.css`:
```css
--primary-color: #9c27b0;  /* Purple */
```

### Change Material Theme (SCSS)
Edit `src/styles/theme.scss`:
```scss
$app-primary: mat.m2-define-palette(mat.$m2-purple-palette);
```

---

## 📦 Import Order

In `src/styles.css`:
```css
@import './styles/buttons.css';
@import './styles/cards.css';
@import './styles/tables.css';
@import './styles/modals.css';
@import './styles/forms.css';
```

In `angular.json`:
```json
"styles": [
  "@angular/material/prebuilt-themes/indigo-pink.css",
  "src/styles/theme.scss",
  "src/styles.css"
]
```

---

## 🚀 Pro Tips

1. **Combine Classes**: `class="btn-primary btn-large btn-block"`
2. **Use Variables**: Always use `var(--primary-color)` in custom CSS
3. **Mobile First**: Test responsive classes on mobile
4. **Consistent Spacing**: Use spacing utilities instead of custom margins
5. **Semantic Colors**: Use `.text-success`, `.bg-error` for meaning

---

## 📚 Full Documentation

- **Detailed Guide**: See `MODULAR-STYLES-GUIDE.md`
- **Global Styles**: See `STYLES-GUIDE.md`
- **Theme Config**: See `src/styles/theme.scss`
- **Variables**: See `src/styles.css` (lines 6-90)

