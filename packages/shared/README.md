# @qapp/shared

Shared TypeScript types, Zod validation schemas, and constants for QApp monorepo.

## Purpose

This package ensures type safety and validation consistency between frontend and backend:

- **Types**: API contracts, user models, question models
- **Schemas**: Zod validation (client-side + server-side)
- **Constants**: Shared enums (semesters, levels, limits)

## Usage

### In Frontend (apps/frontend)

```typescript
import { createQuestionSchema, type QuestionCard } from '@qapp/shared';

// Type-safe API response
const response: QuestionCard = await fetchQuestion(id);

// Client-side validation
const result = createQuestionSchema.safeParse(formData);
if (!result.success) {
  console.error(result.error.issues);
}
```

### In Backend API Routes

```typescript
import { createQuestionSchema, type CreateQuestionInput } from '@qapp/shared';

// Server-side validation
export async function POST(request: Request) {
  const body = await request.json();
  const validated = createQuestionSchema.parse(body); // Throws if invalid
  
  // TypeScript knows validated has correct types
  const question = await db.insert(questions).values(validated);
  return Response.json({ success: true, data: question });
}
```

## Development

```bash
# Build package (generates dist/ with .js and .d.ts files)
pnpm build

# Watch mode (auto-rebuild on changes)
pnpm dev

# Clean build artifacts
pnpm clean
```

## Key Files

- `src/types/api.types.ts` - API request/response contracts
- `src/types/question.types.ts` - Question model types
- `src/types/user.types.ts` - User model types
- `src/schemas/question.schema.ts` - Question validation (Zod)
- `src/schemas/user.schema.ts` - User validation (Zod)
- `src/constants/index.ts` - Shared constants

## Architecture Benefits

1. **Single Source of Truth**: Change validation in one place, applies everywhere
2. **Type Safety**: TypeScript catches mismatches at compile time
3. **No Drift**: Frontend and backend always use identical validation
4. **DRY Principle**: No duplicated validation logic

## References

- ENGAGEMENT_AND_FEATURES.md lines 504-532 (validation schemas)
- Untrack INITIAL_FE_IMPLEMENTATION.md lines 121-365 (shared package patterns)

