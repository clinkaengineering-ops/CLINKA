import { ZodError, ZodIssueCode } from 'zod';
import { zodToFieldErrors, formatZodError } from './zodErrors';

function makeZodError(issues: Array<{ path: (string | number)[]; message: string }>): ZodError {
  return new ZodError(
    issues.map((i) => ({ code: ZodIssueCode.custom, path: i.path, message: i.message })),
  );
}

describe('zodToFieldErrors', () => {
  it('maps issues to field-keyed errors', () => {
    const err = makeZodError([
      { path: ['email'], message: 'Invalid email' },
      { path: ['password'], message: 'Too short' },
    ]);
    expect(zodToFieldErrors(err)).toEqual({
      email: 'Invalid email',
      password: 'Too short',
    });
  });

  it('keeps only the first error per field', () => {
    const err = makeZodError([
      { path: ['email'], message: 'first' },
      { path: ['email'], message: 'second' },
    ]);
    expect(zodToFieldErrors(err)).toEqual({ email: 'first' });
  });

  it('uses _form for path-less issues', () => {
    const err = makeZodError([{ path: [], message: 'Form error' }]);
    expect(zodToFieldErrors(err)).toEqual({ _form: 'Form error' });
  });
});

describe('formatZodError', () => {
  it('returns the first error as message', () => {
    const err = makeZodError([{ path: ['name'], message: 'Required' }]);
    const result = formatZodError(err);
    expect(result.message).toBe('Required');
    expect(result.errors).toEqual({ name: 'Required' });
  });

  it('falls back when no issues', () => {
    const err = makeZodError([]);
    const result = formatZodError(err);
    expect(result.message).toBe('Validation failed. Please check your input.');
  });
});
