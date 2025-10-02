/**
 * EXAMPLES: How to use the new consolidated utilities
 *
 * This file shows practical examples of using the new utilities created
 * to reduce code duplication and improve maintainability.
 */

import { useState } from 'react';
import { useAsyncState } from '@/hooks/useAsyncState';
import { standardErrorHandler, safeAsync } from '@/lib/error-handler';
import { createAPIHandler, parseJSONBody, getSearchParams } from '@/lib/api-wrapper';
import { ApiResponse } from '@/lib/api-response';

// ========================================
// EXAMPLE 1: Using useAsyncState Hook
// ========================================

interface Question {
  id: string;
  text: string;
  difficulty: string;
}

function QuestionListExample() {
  // OLD WAY: Manual loading/error state management
  /*
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/questions');
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };
  */

  // NEW WAY: Using useAsyncState hook
  const questionState = useAsyncState<Question[]>([]);

  const fetchQuestions = async () => {
    await questionState.execute(async () => {
      const response = await fetch('/api/questions');
      const data = await response.json();
      return data.questions || [];
    });
  };

  return (
    <div>
      <button onClick={fetchQuestions} disabled={questionState.loading}>
        {questionState.loading ? 'Loading...' : 'Fetch Questions'}
      </button>

      {questionState.error && (
        <div className="error">{questionState.error}</div>
      )}

      {questionState.data && (
        <ul>
          {questionState.data.map(q => (
            <li key={q.id}>{q.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ========================================
// EXAMPLE 2: Using standardErrorHandler
// ========================================

function ComponentWithErrorHandling() {
  const [status, setStatus] = useState<string>('');

  // OLD WAY: Inconsistent error handling
  /*
  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      console.error('Action failed:', error);
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('Unknown error occurred');
      }
    }
  };
  */

  // NEW WAY: Standardized error handling
  const handleAction = async () => {
    try {
      await someAsyncOperation();
      setStatus('Success!');
    } catch (error) {
      const errorMessage = standardErrorHandler(error, 'ComponentWithErrorHandling');
      setStatus(`Error: ${errorMessage}`);
    }
  };

  // Even better: Using safeAsync wrapper
  const handleActionSafe = safeAsync(
    async () => {
      await someAsyncOperation();
      setStatus('Success!');
    },
    (error) => {
      const errorMessage = standardErrorHandler(error, 'ComponentWithErrorHandling');
      setStatus(`Error: ${errorMessage}`);
    }
  );

  return (
    <div>
      <button onClick={handleAction}>Handle Action</button>
      <button onClick={handleActionSafe}>Handle Action (Safe)</button>
      <p>{status}</p>
    </div>
  );
}

// ========================================
// EXAMPLE 3: Using API Route Wrapper
// ========================================

// OLD WAY: Lots of boilerplate in each API route
/*
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const examType = searchParams.get('examType');

    if (!examType) {
      return NextResponse.json({ error: 'examType required' }, { status: 400 });
    }

    // Handle CORS
    const response = NextResponse.json({ data: 'some data' });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
*/

// NEW WAY: Using createAPIHandler wrapper
export const GET = createAPIHandler(
  async ({ req }) => {
    const searchParams = getSearchParams(req);
    const examType = searchParams.get('examType');

    if (!examType) {
      return ApiResponse.validationError('examType is required');
    }

    // Your business logic here
    const questions = await getQuestionsByType(examType);

    return { questions, count: questions.length };
  },
  {
    cors: true,
    rateLimit: { requests: 100, windowMs: 60000 }, // 100 requests per minute
  }
);

export const POST = createAPIHandler(
  async ({ req }) => {
    const body = await parseJSONBody<{ text: string; difficulty: string }>(req);

    if (!body?.text) {
      return ApiResponse.validationError('Question text is required');
    }

    // Your business logic here
    const newQuestion = await createQuestion(body);

    return newQuestion;
  },
  {
    cors: true,
    requireAuth: true, // Automatically checks authentication
  }
);

// ========================================
// EXAMPLE 4: Before/After Comparison
// ========================================

// BEFORE: Component with duplicate loading pattern (example only)
function OldQuestionEditor() {
  // These would be used in a real component
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [question] = useState<Question | null>(null);

  // Example function (not used in this demo component)
  // const loadQuestion = async (id: string) => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await fetch(`/api/questions/${id}`);
  //     if (!response.ok) {
  //       throw new Error('Failed to load question');
  //     }
  //     const data = await response.json();
  //     setQuestion(data.question);
  //   } catch (err) {
  //     console.error('Error loading question:', err);
  //     setError(err instanceof Error ? err.message : 'Unknown error');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Example function (not used in this demo component)
  // const saveQuestion = async (questionData: Partial<Question>) => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await fetch(`/api/questions/${question?.id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(questionData),
  //     });
  //     if (!response.ok) {
  //       throw new Error('Failed to save question');
  //     }
  //     const data = await response.json();
  //     setQuestion(data.question);
  //   } catch (err) {
  //     console.error('Error saving question:', err);
  //     setError(err instanceof Error ? err.message : 'Unknown error');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {question && <div>{question.text}</div>}
    </div>
  );
}

// AFTER: Using consolidated utilities
function NewQuestionEditor() {
  const questionState = useAsyncState<Question | null>(null);

  // Example functions (not used in this demo component)
  // const loadQuestion = async (id: string) => {
  //   await questionState.execute(async () => {
  //     const response = await fetch(`/api/questions/${id}`);
  //     if (!response.ok) {
  //       throw new Error('Failed to load question');
  //     }
  //     const data = await response.json();
  //     return data.question;
  //   });
  // };

  // const saveQuestion = async (questionData: Partial<Question>) => {
  //   await questionState.execute(async () => {
  //     const response = await fetch(`/api/questions/${questionState.data?.id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(questionData),
  //     });
  //     if (!response.ok) {
  //       throw new Error('Failed to save question');
  //     }
  //     const data = await response.json();
  //     return data.question;
  //   });
  // };

  return (
    <div>
      {questionState.loading && <div>Loading...</div>}
      {questionState.error && <div className="error">{questionState.error}</div>}
      {questionState.data && <div>{questionState.data.text}</div>}
    </div>
  );
}

// Mock functions for examples
async function someAsyncOperation(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function getQuestionsByType(_examType: string): Promise<Question[]> {
  return [{ id: '1', text: 'Sample question', difficulty: 'EASY' }];
}

async function createQuestion(data: { text: string; difficulty: string }): Promise<Question> {
  return { id: '2', ...data };
}

export {
  QuestionListExample,
  ComponentWithErrorHandling,
  OldQuestionEditor,
  NewQuestionEditor,
};