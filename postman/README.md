# API Testing with Postman/Newman

This directory contains Postman collections for testing the API endpoints.

## Collections

### critical-api-tests.postman_collection.json

Comprehensive test suite covering critical API endpoints including:

- Questions API (GET, POST, bulk operations)
- User attempts and sessions
- Achievements and progress tracking
- Topic performance analytics
- Weekly analysis
- Error reporting
- File uploads
- Tutor dashboard

## Running Tests

### Local Testing

```bash
# Run all API tests
npm run test:api

# Run with detailed output and JSON report
npm run test:api:verbose

# Run unit tests + API tests
npm run tests
```

### CI/CD Integration

Newman is installed as a dev dependency, making it easy to integrate into CI pipelines:

```bash
newman run postman/collections/critical-api-tests.postman_collection.json
```

## Environment Setup

The tests expect a local development server running at `http://localhost:3000` with:

- PostgreSQL database configured
- Environment variables properly set
- Test data seeded (if required)

## Test Reports

When running with `--reporters json`, test results are saved to:

- `newman-report.json` (ignored by git)

## Maintenance

Update the collection by:

1. Importing into Postman desktop app
2. Making changes
3. Exporting back to this directory

Or use the Postman CLI:

```bash
npm run api
```
