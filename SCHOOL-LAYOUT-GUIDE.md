# 🎓 School Management System - Layout Guide

Complete guide for the responsive school management system with Angular Material components.

## ✅ What's Been Created

### 🏗️ **Layout Components**
- ✅ **Sidebar Component** - Collapsible navigation with icons and tooltips
- ✅ **Top Navigation** - Search bar, language selector, notifications, profile menu
- ✅ **Main Layout** - Responsive layout wrapper with mobile support
- ✅ **Student List Page** - Complete table with search, pagination, and actions

### 📱 **Responsive Features**
- ✅ **Mobile-First Design** - Works on all screen sizes
- ✅ **Sidebar Toggle** - Collapses to icons only on desktop
- ✅ **Mobile Menu** - Full overlay on mobile devices
- ✅ **Responsive Tables** - Horizontal scroll on small screens

### 🎨 **Angular Material Integration**
- ✅ **Shared Module** - All Material components in one place
- ✅ **Material Theme** - Custom theme with school colors
- ✅ **Material Components** - Buttons, forms, tables, menus, icons

---

## 🚀 How to Run

1. **Install Dependencies** (if not already done):
   ```bash
   cd ui-app
   npm install
   ```

2. **Start Development Server**:
   ```bash
   ng serve
   ```

3. **Open Browser**:
   ```
   http://localhost:4200
   ```

---

## 📁 File Structure

```
ui-app/src/app/
├── components/
│   ├── sidebar/
│   │   ├── sidebar.component.ts
│   │   ├── sidebar.component.html
│   │   └── sidebar.component.css
│   └── top-nav/
│       ├── top-nav.component.ts
│       ├── top-nav.component.html
│       └── top-nav.component.css
├── layout/
│   ├── main-layout.component.ts
│   ├── main-layout.component.html
│   └── main-layout.component.css
├── pages/
│   ├── dashboard/
│   ├── students/
│   ├── teachers/
│   ├── departments/
│   ├── subjects/
│   ├── invoices/
│   ├── accounts/
│   ├── holidays/
│   └── fees/
├── shared/
│   ├── shared.module.ts
│   └── material.module.ts
├── app.component.ts
└── app.routes.ts
```

---

## 🎯 Key Features

### 🔧 **Sidebar Navigation**
- **Logo**: PreSkool with pencil icon
- **Main Menu**: Dashboard, Students, Teachers, Departments, Subjects, Invoices
- **Management**: Accounts, Holiday, Fees
- **Collapsible**: Shows only icons when collapsed
- **Tooltips**: Show menu names on hover when collapsed
- **Submenu**: Students section has expandable submenu

### 🔍 **Top Navigation**
- **Search Bar**: Global search functionality
- **Language Selector**: Dropdown with flag icons
- **Notifications**: Badge with notification count
- **Fullscreen Toggle**: Enter/exit fullscreen mode
- **Profile Menu**: User avatar with dropdown menu

### 📊 **Student List Page**
- **Search Controls**: Search by ID, Name, Phone
- **Table Features**: Sortable columns, checkboxes, actions
- **Pagination**: Page size selector, navigation controls
- **Responsive**: Mobile-friendly table with horizontal scroll
- **Actions**: Edit, Delete buttons for each student

---

## 📱 Responsive Breakpoints

### 🖥️ **Desktop (≥ 769px)**
- Full sidebar with text and icons
- Sidebar can be collapsed to icons only
- Full table view with all columns
- Horizontal layout for search controls

### 📱 **Tablet (≤ 768px)**
- Sidebar becomes overlay on mobile
- Table shows horizontal scroll
- Search controls stack vertically
- Profile details hidden, avatar only

### 📱 **Mobile (≤ 480px)**
- Search bar hidden to save space
- Compact action buttons
- Single column layout
- Optimized touch targets

---

## 🎨 Customization

### 🎨 **Colors**
Edit `src/styles.css` to change colors:
```css
:root {
  --primary-color: #3f51b5;    /* Main brand color */
  --accent-color: #ff4081;     /* Accent color */
  --success-color: #4caf50;    /* Success color */
  --warning-color: #ff9800;    /* Warning color */
  --error-color: #f44336;      /* Error color */
}
```

### 🎨 **Material Theme**
Edit `src/styles/theme.scss` to change Material theme:
```scss
$app-primary: mat.m2-define-palette(mat.$m2-indigo-palette);
$app-accent: mat.m2-define-palette(mat.$m2-pink-palette);
$app-warn: mat.m2-define-palette(mat.$m2-red-palette);
```

### 🏢 **School Branding**
1. **Logo**: Update in `sidebar.component.html`
2. **School Name**: Change "PreSkool" to your school name
3. **Colors**: Update CSS variables for your brand colors
4. **Favicon**: Replace `public/favicon.ico`

---

## 🔧 Adding New Pages

### 1. **Create Component**
```bash
ng generate component pages/your-page
```

### 2. **Add Route**
Update `app.routes.ts`:
```typescript
{
  path: 'your-page',
  loadComponent: () => import('./pages/your-page/your-page.component').then(m => m.YourPageComponent)
}
```

### 3. **Add Menu Item**
Update `sidebar.component.ts`:
```typescript
{
  name: 'Your Page',
  icon: 'your_icon',
  route: '/your-page'
}
```

---

## 📋 Available Material Icons

Use these Material icons in your components:
- `dashboard` - Dashboard
- `school` - Students
- `person` - Teachers
- `business` - Departments
- `book` - Subjects
- `description` - Invoices
- `account_balance_wallet` - Accounts
- `palm_tree` - Holidays
- `attach_money` - Fees
- `edit` - Edit actions
- `delete` - Delete actions
- `add` - Add new items
- `search` - Search functionality
- `notifications` - Notifications
- `fullscreen` - Fullscreen toggle

---

## 🎯 Usage Examples

### 📊 **Creating a Data Table**
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
          <button mat-icon-button><mat-icon>edit</mat-icon></button>
          <button mat-icon-button><mat-icon>delete</mat-icon></button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 🔍 **Adding Search Controls**
```html
<div class="search-controls">
  <mat-form-field appearance="outline">
    <mat-label>Search</mat-label>
    <input matInput placeholder="Search...">
  </mat-form-field>
  <button mat-raised-button color="primary">SEARCH</button>
</div>
```

### 📱 **Responsive Cards**
```html
<div class="card-grid">
  <div class="card">
    <h3 class="card-title">Title</h3>
    <p class="card-content">Content</p>
  </div>
</div>
```

---

## 🚀 Next Steps

1. **Customize Colors**: Update CSS variables to match your school colors
2. **Add Real Data**: Connect to your backend API
3. **Add Forms**: Create forms for adding/editing students
4. **Add Authentication**: Implement login/logout functionality
5. **Add More Pages**: Create detailed pages for each module
6. **Add Charts**: Include dashboard charts and statistics
7. **Add File Upload**: Implement image upload for student photos

---

## 📚 Documentation Links

- **Modular Styles**: See `MODULAR-STYLES-GUIDE.md`
- **Quick Reference**: See `STYLES-QUICK-REFERENCE.md`
- **Global Styles**: See `STYLES-GUIDE.md`
- **Setup Complete**: See `SETUP-COMPLETE.md`

---

## 🎓 School Management Features

### 👥 **Student Management**
- ✅ Student list with search and pagination
- ✅ Student profile with avatar
- ✅ Parent information
- ✅ Class assignment
- ✅ Contact details

### 👨‍🏫 **Teacher Management**
- 🔄 Teacher list (placeholder created)
- 🔄 Teacher profiles
- 🔄 Department assignment
- 🔄 Subject assignment

### 🏢 **Administrative**
- 🔄 Department management
- 🔄 Subject management
- 🔄 Fee structure
- 🔄 Holiday calendar
- 🔄 Invoice generation

---

## 🎉 Ready to Use!

Your school management system is now ready with:
- ✅ **Responsive Layout** - Works on all devices
- ✅ **Professional Design** - Clean, modern interface
- ✅ **Angular Material** - Consistent UI components
- ✅ **Modular CSS** - Easy to customize and maintain
- ✅ **Navigation** - Intuitive sidebar and top navigation
- ✅ **Sample Data** - Student list with real-looking data

Start building your school management features! 🚀

---

## 🆘 Need Help?

1. **Check the console** for any errors
2. **Verify imports** - Make sure SharedModule is imported
3. **Check routes** - Ensure all routes are properly configured
4. **Review CSS** - Check if styles are loading correctly
5. **Angular Material** - Verify Material theme is included

Happy coding! 🎓✨
