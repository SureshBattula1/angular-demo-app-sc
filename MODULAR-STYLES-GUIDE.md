# Modular Styles Guide 🎨

Complete guide to using the modular CSS system with Angular Material in your application.

## 📁 File Structure

```
ui-app/
├── src/
│   ├── styles/
│   │   ├── theme.scss          # Angular Material custom theme
│   │   ├── buttons.css         # Button styles module
│   │   ├── cards.css          # Card styles module
│   │   ├── tables.css         # Table styles module
│   │   ├── modals.css         # Modal/Dialog styles module
│   │   └── forms.css          # Form styles module
│   └── styles.css             # Main global styles (imports all modules)
└── angular.json               # Angular Material theme configured
```

---

## 🎨 Angular Material Theme

### Location: `src/styles/theme.scss`

The Angular Material theme is configured with:
- **Primary Color**: Indigo
- **Accent Color**: Pink  
- **Warn Color**: Red

### Quick Theme Change

To change the theme colors, edit `src/styles/theme.scss`:

```scss
// Change primary color (line 13)
$app-primary: mat.m2-define-palette(mat.$m2-indigo-palette, 500, 300, 700);

// Available Material palettes:
// mat.$m2-blue-palette, mat.$m2-purple-palette, mat.$m2-teal-palette,
// mat.$m2-green-palette, mat.$m2-orange-palette, etc.
```

### Custom Font Family

Update font in theme.scss line 24:
```scss
$font-family: 'Your-Font-Name, "Helvetica Neue", Arial, sans-serif',
```

---

## 🔘 Buttons Module (`buttons.css`)

### Basic Usage

```html
<!-- Primary Button -->
<button class="btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn-secondary">Secondary Action</button>

<!-- Outlined Button -->
<button class="btn-outlined">Outlined</button>

<!-- Text Button -->
<button class="btn-text">Text Only</button>
```

### Button Variants

```html
<!-- Semantic Buttons -->
<button class="btn-success">Success</button>
<button class="btn-warning">Warning</button>
<button class="btn-error">Error</button>
<button class="btn-info">Info</button>

<!-- Icon Button -->
<button class="btn-icon">
  <mat-icon>favorite</mat-icon>
</button>

<!-- FAB (Floating Action Button) -->
<button class="btn-fab">
  <mat-icon>add</mat-icon>
</button>
```

### Button Sizes

```html
<button class="btn-primary btn-small">Small</button>
<button class="btn-primary btn-medium">Medium</button>
<button class="btn-primary btn-large">Large</button>
```

### Button States

```html
<!-- Disabled -->
<button class="btn-primary" disabled>Disabled</button>

<!-- Loading -->
<button class="btn-primary btn-loading">Loading</button>

<!-- Full Width -->
<button class="btn-primary btn-block">Full Width</button>
```

### Button Groups

```html
<div class="btn-group">
  <button class="btn-primary">Left</button>
  <button class="btn-primary">Middle</button>
  <button class="btn-primary">Right</button>
</div>
```

---

## 🃏 Cards Module (`cards.css`)

### Basic Card

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-subtitle">Card subtitle</p>
  </div>
  <div class="card-body">
    <p class="card-content">Card content goes here.</p>
  </div>
  <div class="card-footer">
    <button class="btn-text">Action</button>
  </div>
</div>
```

### Card Variants

```html
<!-- Outlined Card -->
<div class="card card-outlined">Content</div>

<!-- Elevated Card -->
<div class="card card-elevated">Content</div>

<!-- Colored Cards -->
<div class="card card-primary">Primary Card</div>
<div class="card card-accent">Accent Card</div>
<div class="card card-success">Success Card</div>
```

### Card with Image

```html
<div class="card">
  <img src="image.jpg" class="card-image-top" alt="Image">
  <div class="card-body">
    <h3 class="card-title">Title</h3>
    <p class="card-content">Content</p>
  </div>
</div>
```

### Special Cards

```html
<!-- Stats Card -->
<div class="card card-stats">
  <div class="card-stats-icon">
    <mat-icon>people</mat-icon>
  </div>
  <div class="card-stats-content">
    <div class="card-stats-value">1,234</div>
    <div class="card-stats-label">Total Users</div>
  </div>
</div>

<!-- Profile Card -->
<div class="card card-profile">
  <img src="avatar.jpg" class="card-profile-avatar" alt="Avatar">
  <h3 class="card-profile-name">John Doe</h3>
  <p class="card-profile-role">Developer</p>
</div>

<!-- Pricing Card -->
<div class="card card-pricing">
  <div class="card-pricing-header">
    <h3>Premium Plan</h3>
  </div>
  <div class="card-pricing-price">$99</div>
  <ul class="card-pricing-features">
    <li>Feature 1</li>
    <li>Feature 2</li>
    <li>Feature 3</li>
  </ul>
</div>
```

### Card Grid Layout

```html
<div class="card-grid">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>
```

---

## 📊 Tables Module (`tables.css`)

### Basic Table

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th class="table-cell-numeric">Age</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td class="table-cell-numeric">25</td>
        <td>
          <span class="table-cell-status status-success">Active</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Table Variants

```html
<!-- Striped Table -->
<table class="table table-striped">...</table>

<!-- Bordered Table -->
<table class="table table-bordered">...</table>

<!-- Compact Table -->
<table class="table table-compact">...</table>

<!-- Selectable Rows -->
<table class="table table-selectable">...</table>
```

### With Toolbar & Search

```html
<div class="table-container">
  <div class="table-toolbar">
    <div class="table-search">
      <input type="text" placeholder="Search...">
      <span class="table-search-icon">🔍</span>
    </div>
    <div class="table-filters">
      <button class="btn-outlined btn-small">Filter</button>
    </div>
  </div>
  <table class="table">
    <!-- table content -->
  </table>
  <div class="table-pagination">
    <div class="table-pagination-info">Showing 1-10 of 100</div>
    <div class="table-pagination-controls">
      <button class="table-pagination-button">Previous</button>
      <button class="table-pagination-button active">1</button>
      <button class="table-pagination-button">2</button>
      <button class="table-pagination-button">Next</button>
    </div>
  </div>
</div>
```

### Sortable Headers

```html
<th class="table-header-sortable">Name</th>
<th class="table-header-sortable sort-asc">Email</th>
<th class="table-header-sortable sort-desc">Date</th>
```

### Table Cell Types

```html
<!-- Avatar Cell -->
<td class="table-cell-avatar">
  <img src="avatar.jpg" alt="User">
  <span>John Doe</span>
</td>

<!-- Actions Cell -->
<td class="table-cell-actions">
  <button class="btn-icon"><mat-icon>edit</mat-icon></button>
  <button class="btn-icon"><mat-icon>delete</mat-icon></button>
</td>

<!-- Status Badge -->
<td>
  <span class="table-cell-status status-success">Active</span>
  <span class="table-cell-status status-warning">Pending</span>
  <span class="table-cell-status status-error">Inactive</span>
</td>
```

---

## 🪟 Modals Module (`modals.css`)

### Basic Modal

```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Modal Title</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here.</p>
    </div>
    <div class="modal-footer">
      <button class="btn-text">Cancel</button>
      <button class="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Modal Sizes

```html
<div class="modal modal-small">Small Modal</div>
<div class="modal modal-medium">Medium Modal</div>
<div class="modal modal-large">Large Modal</div>
<div class="modal modal-fullscreen">Fullscreen Modal</div>
```

### Modal Variants

```html
<!-- Alert Modal -->
<div class="modal modal-alert">
  <div class="modal-header">
    <h2 class="modal-title">Alert!</h2>
  </div>
  <div class="modal-body">Alert message</div>
</div>

<!-- Success Modal -->
<div class="modal modal-success">...</div>

<!-- Warning Modal -->
<div class="modal modal-warning">...</div>
```

### Confirmation Modal

```html
<div class="modal modal-confirm">
  <div class="modal-body">
    <div class="modal-confirm-icon danger">⚠️</div>
    <h3 class="modal-confirm-message">Are you sure?</h3>
    <p class="modal-confirm-description">This action cannot be undone.</p>
  </div>
  <div class="modal-footer">
    <button class="btn-text">Cancel</button>
    <button class="btn-error">Delete</button>
  </div>
</div>
```

### Bottom Sheet Modal

```html
<div class="modal modal-bottom-sheet">
  <div class="modal-bottom-sheet-handle"></div>
  <div class="modal-header">
    <h2 class="modal-title">Bottom Sheet</h2>
  </div>
  <div class="modal-body">Content</div>
</div>
```

### Side Panel Modal

```html
<div class="modal modal-side-panel">
  <div class="modal-header">
    <h2 class="modal-title">Side Panel</h2>
    <button class="modal-close">×</button>
  </div>
  <div class="modal-body">Content</div>
</div>
```

---

## 📝 Forms Module (`forms.css`)

### Basic Form

```html
<form class="form">
  <div class="form-group">
    <label class="form-label">Name</label>
    <input type="text" class="form-control" placeholder="Enter name">
  </div>
  
  <div class="form-group">
    <label class="form-label required">Email</label>
    <input type="email" class="form-control" placeholder="Enter email">
    <small class="form-text">We'll never share your email.</small>
  </div>
  
  <button type="submit" class="btn-primary">Submit</button>
</form>
```

### Form Input Sizes

```html
<input type="text" class="form-control form-control-sm" placeholder="Small">
<input type="text" class="form-control" placeholder="Default">
<input type="text" class="form-control form-control-lg" placeholder="Large">
```

### Input with Icon

```html
<div class="form-control-icon">
  <span class="icon-left">🔍</span>
  <input type="text" class="form-control" placeholder="Search...">
</div>

<div class="form-control-icon has-icon-right">
  <input type="password" class="form-control" placeholder="Password">
  <span class="icon-right">👁️</span>
</div>
```

### Form Validation States

```html
<!-- Valid -->
<input type="text" class="form-control is-valid">
<div class="valid-feedback">Looks good!</div>

<!-- Invalid -->
<input type="text" class="form-control is-invalid">
<div class="invalid-feedback">Please provide a valid value.</div>
```

### Checkbox & Radio

```html
<!-- Standard Checkbox -->
<div class="form-check">
  <input type="checkbox" class="form-check-input" id="check1">
  <label class="form-check-label" for="check1">Option 1</label>
</div>

<!-- Custom Checkbox -->
<label class="custom-checkbox">
  <input type="checkbox">
  <span class="checkmark"></span>
  <span>Custom Checkbox</span>
</label>

<!-- Custom Radio -->
<label class="custom-radio">
  <input type="radio" name="option">
  <span class="radiomark"></span>
  <span>Option 1</span>
</label>
```

### Toggle Switch

```html
<label class="form-switch">
  <input type="checkbox">
  <span class="switch-slider"></span>
  <span>Enable notifications</span>
</label>
```

### File Upload

```html
<div class="form-file">
  <input type="file">
  <div class="form-file-label">
    <div class="form-file-icon">📁</div>
    <p>Click to upload or drag and drop</p>
  </div>
</div>
```

### Input Groups

```html
<div class="input-group">
  <div class="input-group-prepend">$</div>
  <input type="number" class="form-control" placeholder="Amount">
  <div class="input-group-append">.00</div>
</div>
```

### Floating Labels

```html
<div class="form-floating">
  <input type="text" class="form-control" placeholder=" ">
  <label>Full Name</label>
</div>
```

### Form Layouts

```html
<!-- Inline Form -->
<form class="form-inline">
  <div class="form-group">
    <input type="text" class="form-control" placeholder="Search...">
  </div>
  <button class="btn-primary">Search</button>
</form>

<!-- Form Row (2 columns) -->
<div class="form-row">
  <div class="form-group">
    <label class="form-label">First Name</label>
    <input type="text" class="form-control">
  </div>
  <div class="form-group">
    <label class="form-label">Last Name</label>
    <input type="text" class="form-control">
  </div>
</div>
```

---

## 🎯 Quick Color Change

### Global Colors (in `src/styles.css`)

```css
:root {
  --primary-color: #3f51b5;     /* Change to any color */
  --accent-color: #ff4081;      /* Change to any color */
  --success-color: #4caf50;     /* Change to any color */
  /* ... etc */
}
```

### Material Theme Colors (in `src/styles/theme.scss`)

```scss
$app-primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$app-accent: mat.m2-define-palette(mat.$m2-pink-palette);
$app-warn: mat.m2-define-palette(mat.$m2-red-palette);
```

---

## 🚀 Integration with Angular Material

These custom styles work seamlessly with Angular Material components:

```html
<!-- Use Material components with custom styles -->
<mat-card class="card">
  <mat-card-header>
    <mat-card-title>Title</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <button mat-raised-button color="primary">Material Button</button>
    <button class="btn-primary">Custom Button</button>
  </mat-card-content>
</mat-card>
```

---

## 📱 Responsive Design

All modules include responsive utilities:

```html
<!-- Hide on mobile -->
<div class="hide-xs">Hidden on mobile</div>

<!-- Responsive table -->
<table class="table table-responsive">...</table>

<!-- Card grid (auto-responsive) -->
<div class="card-grid">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
</div>
```

---

## ✅ Best Practices

1. **Use CSS Variables** - Always reference colors via `var(--primary-color)` instead of hardcoded values
2. **Modular Approach** - Each module is independent and can be customized separately
3. **Combine Classes** - You can combine utility classes: `class="btn-primary btn-large btn-block"`
4. **Angular Material First** - Use Material components when available, custom styles for special cases
5. **Maintain Consistency** - Stick to the design system defined in these modules

---

## 🔧 Customization

Each module can be customized independently:

1. **Colors**: Edit CSS variables in `styles.css`
2. **Material Theme**: Edit `styles/theme.scss`
3. **Buttons**: Edit `styles/buttons.css`
4. **Cards**: Edit `styles/cards.css`
5. **Tables**: Edit `styles/tables.css`
6. **Modals**: Edit `styles/modals.css`
7. **Forms**: Edit `styles/forms.css`

All changes will be reflected globally across your application! 🎉

