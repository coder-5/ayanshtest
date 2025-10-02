# Soft Delete Implementation Guide

## Models with Soft Delete
The following models now support soft delete with `deletedAt` timestamp:

1. **Question** - Preserves question content and related attempt history
2. **User** - Preserves user data and analytics
3. **UserAttempt** - Preserves practice history for analytics
4. **PracticeSession** - Preserves session data for progress tracking

## Usage in Application Code

### Querying Active Records
Always filter out soft-deleted records in your queries:

```typescript
// Get active questions only
const activeQuestions = await prisma.question.findMany({
  where: {
    deletedAt: null
  }
});

// Get active user attempts
const activeAttempts = await prisma.userAttempt.findMany({
  where: {
    deletedAt: null,
    userId: "user-id"
  }
});
```

### Soft Delete Implementation
Instead of deleting records, set the `deletedAt` timestamp:

```typescript
// Soft delete a question
await prisma.question.update({
  where: { id: "question-id" },
  data: { deletedAt: new Date() }
});

// Soft delete a user
await prisma.user.update({
  where: { id: "user-id" },
  data: { deletedAt: new Date() }
});
```

### Recovery (Restore)
To restore soft-deleted records:

```typescript
// Restore a question
await prisma.question.update({
  where: { id: "question-id" },
  data: { deletedAt: null }
});
```

### Admin Queries (Include Deleted)
For admin interfaces, you might want to see all records:

```typescript
// Get all questions including deleted ones
const allQuestions = await prisma.question.findMany();

// Get only deleted questions
const deletedQuestions = await prisma.question.findMany({
  where: {
    deletedAt: { not: null }
  }
});
```

## Important Notes

1. **Foreign Key Constraints**: Changed to `onDelete: Restrict` to prevent accidental deletion when related records exist
2. **Analytics Preservation**: User attempts and practice sessions are preserved for historical analytics
3. **Indexes**: Added `deletedAt` indexes for efficient filtering
4. **Application Logic**: Always include `deletedAt: null` filter in your queries unless specifically querying deleted records

## Migration Required
After applying these schema changes, run:
1. `npx prisma db push` or `npx prisma migrate dev`
2. Update all existing queries to filter `deletedAt: null`
3. Update delete operations to set `deletedAt` instead of hard delete