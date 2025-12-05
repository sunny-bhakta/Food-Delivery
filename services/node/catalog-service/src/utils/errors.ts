import { ZodError } from 'zod';

export const formatZodError = (error: ZodError) =>
  error.issues
    .map((issue) => {
      const path = issue.path.join('.') || 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

