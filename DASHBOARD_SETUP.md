# Dashboard Setup Guide

## Overview
A mobile-responsive dashboard for the School Management System with real-time API integration.

## Features
- ✅ Mobile-first responsive design
- ✅ Real-time data from Laravel API
- ✅ Role-based statistics (Admin, Teacher, Student, Parent)
- ✅ Global color scheme following Material Design
- ✅ Animated card transitions
- ✅ Recent attendance tracking
- ✅ Upcoming exams display
- ✅ Top performers leaderboard
- ✅ Quick action buttons

## Color Scheme
The dashboard follows a green/teal color palette defined in `_variables.scss`:
- **Primary**: `#00897b` (Teal)
- **Accent**: `#4caf50` (Green)
- **Success**: `#4caf50`
- **Warning**: `#ff9800`
- **Error**: `#f44336`
- **Info**: `#2196f3`

## API Endpoints Used
- `GET /api/dashboard/stats` - Main dashboard statistics
- `GET /api/dashboard/attendance` - Recent attendance data
- `GET /api/dashboard/top-performers` - Top performing students
- `GET /api/dashboard/upcoming-exams` - Upcoming exam schedule
- `GET /api/dashboard/low-attendance` - Students with low attendance

## Running the Application

### Backend (Laravel)
```bash
cd laravel-demo-app-sc
php artisan serve
```
The API will be available at `http://localhost:8000`

### Frontend (Angular)
```bash
cd ui-app
npm install  # First time only
ng serve
```
The app will be available at `http://localhost:4200`

## Login Credentials
Use these credentials to test different dashboard views:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@myschool.com | Admin@123 |
| Branch Admin | manager@myschool.com | Manager@123 |
| Teacher | teacher@myschool.com | Teacher@123 |
| Student | student@myschool.com | Student@123 |
| Parent | parent@myschool.com | Parent@123 |

## Responsive Breakpoints
- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 992px (2 columns)
- **Desktop**: 992px - 1200px (3-4 columns)
- **Large Desktop**: > 1200px (4 columns)

## Components Structure
```
dashboard/
├── dashboard.component.ts    # Main component logic
├── dashboard.component.html  # Template
├── dashboard.component.scss  # Styles (mobile-responsive)
├── dashboard.service.ts      # API service
└── dashboard.routes.ts       # Routing configuration
```

## Customization

### Adding New Stats Cards
1. Update the API endpoint in Laravel's `DashboardController`
2. Add the stat to the `DashboardStats` interface in `dashboard.service.ts`
3. Add a new stat card in `dashboard.component.html`
4. Add corresponding styles in `dashboard.component.scss`

### Changing Colors
Update the color variables in `src/styles/assets/_variables.scss`:
```scss
$primary-color: #00897b;  // Change this
$accent-color: #4caf50;   // And this
```

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips
1. Dashboard data is cached on the client
2. Loading states prevent multiple API calls
3. Images and icons are optimized
4. CSS animations use GPU acceleration

## Troubleshooting

### API Connection Issues
- Check that Laravel server is running on port 8000
- Verify `environment.ts` has correct API URL
- Check browser console for CORS errors

### No Data Showing
- Ensure database is seeded with test data
- Check that you're logged in with proper credentials
- Verify API endpoints in browser DevTools

### Style Issues
- Clear browser cache
- Run `ng serve` with `--poll` flag if styles don't update
- Check for SCSS compilation errors

## Future Enhancements
- [ ] Real-time notifications using WebSockets
- [ ] Export dashboard data to PDF/Excel
- [ ] Customizable widget layout (drag & drop)
- [ ] Dark mode support
- [ ] Advanced filtering options
- [ ] Chart visualizations for trends

