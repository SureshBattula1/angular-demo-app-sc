# Environment Configuration Guide

This Angular application supports multiple environments for different deployment scenarios.

## Available Environments

### 1. Local/Default (`environment.ts`)
- **Purpose**: Local development on your machine
- **API URL**: `http://localhost:8000/api`
- **Debug Tools**: Enabled
- **Log Level**: Debug

### 2. Development (`environment.development.ts`)
- **Purpose**: Development builds and testing
- **API URL**: `http://localhost:8000/api`
- **Debug Tools**: Enabled
- **Log Level**: Debug

### 3. Testing (`environment.testing.ts`)
- **Purpose**: Testing/Staging environment
- **API URL**: `https://test-api.yourdomain.com/api` (Update this URL)
- **Debug Tools**: Enabled
- **Log Level**: Info
- **Optimizations**: Enabled

### 4. Production (`environment.production.ts`)
- **Purpose**: Production deployment
- **API URL**: `https://api.yourdomain.com/api` (Update this URL)
- **Debug Tools**: Disabled
- **Log Level**: Error
- **Optimizations**: Full

## Usage Commands

### Development/Local
```bash
# Serve with local environment (default)
ng serve

# Or explicitly specify development
ng serve --configuration=development
```

### Testing
```bash
# Serve with testing environment
ng serve --configuration=testing

# Build for testing environment
ng build --configuration=testing
```

### Production
```bash
# Build for production
ng build --configuration=production

# Or simply
ng build
```

## Configuration Details

Each environment file includes the following properties:

- `production`: Boolean flag indicating if it's a production build
- `environment`: String identifier for the environment name
- `apiUrl`: Backend API base URL
- `appName`: Application name (can vary per environment)
- `version`: Application version
- `enableDebugTools`: Enable/disable Angular debug tools
- `logLevel`: Logging level (debug, info, warn, error)

## Customization

### Updating API URLs

Before deploying to testing or production, update the `apiUrl` in:
- `src/environments/environment.testing.ts`
- `src/environments/environment.production.ts`

### Adding New Environment Variables

To add new configuration variables:

1. Add the property to all environment files
2. Use it in your code by importing the environment:

```typescript
import { environment } from '../environments/environment';

console.log(environment.apiUrl);
```

### Creating a New Environment

1. Create a new file: `src/environments/environment.{name}.ts`
2. Add the configuration in `angular.json` under `projects.ui-app.architect.build.configurations`
3. Add the serve configuration under `projects.ui-app.architect.serve.configurations`

## Environment File Replacement

Angular uses file replacement during build time. The base `environment.ts` is replaced with the appropriate environment file based on the build configuration:

- **Development**: `environment.ts` → `environment.development.ts`
- **Testing**: `environment.ts` → `environment.testing.ts`
- **Production**: `environment.ts` → `environment.production.ts`

This is configured in `angular.json` under the `fileReplacements` section.

## Best Practices

1. **Never commit sensitive data**: Use environment variables or secure vaults for sensitive information
2. **Keep environment files in sync**: Ensure all environment files have the same structure
3. **Use environment for configuration only**: Don't use it for feature flags that need runtime changes
4. **Test each environment**: Validate builds for each environment before deployment
5. **Document custom properties**: Add comments for any custom properties you add

## Deployment

### Testing Environment
```bash
ng build --configuration=testing
# Deploy dist/ui-app to your testing server
```

### Production Environment
```bash
ng build --configuration=production
# Deploy dist/ui-app to your production server
```

## Troubleshooting

### Issue: Wrong API URL being used
- Check that you're using the correct `--configuration` flag
- Verify the `fileReplacements` in `angular.json` are correct
- Clear the Angular build cache: `rm -rf .angular/cache`

### Issue: Environment variables not updating
- Stop the development server and restart it
- Rebuild the application
- Check for typos in the configuration name

## Security Notes

- The `environment.*.ts` files are included in the final bundle
- Never store API keys, secrets, or passwords in these files
- These files should be committed to version control
- For sensitive data, use server-side configuration or secure environment variables

