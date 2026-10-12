import { validateForm, firstError, parseApiValidation, loginFormSchema, clientRegisterFormSchema, createProjectFormSchema } from './index';

describe('validateForm', () => {
  it('returns success for valid login data', () => {
    const result = validateForm(loginFormSchema, {
      email: 'user@test.com',
      password: 'mypassword',
    });
    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns errors for invalid login data', () => {
    const result = validateForm(loginFormSchema, {
      email: '',
      password: '',
    });
    expect(result.success).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('validates project schema rejects missing title', () => {
    const result = validateForm(createProjectFormSchema, {
      title: '',
      description: 'x'.repeat(10),
      budget: 1000,
      serviceType: 'DESIGN',
    });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('title');
  });
});

describe('firstError', () => {
  it('returns _form error first', () => {
    expect(firstError({ _form: 'Form error', email: 'Bad email' })).toBe('Form error');
  });

  it('returns first field error when no _form', () => {
    expect(firstError({ email: 'Bad email' })).toBe('Bad email');
  });

  it('returns null for empty errors', () => {
    expect(firstError({})).toBeNull();
  });
});

describe('parseApiValidation', () => {
  it('extracts message from axios-like 400 error', () => {
    const result = parseApiValidation({
      response: { status: 400, data: { message: 'Invalid input' } },
    });
    expect(result.message).toBe('Invalid input');
  });

  it('handles network errors', () => {
    const result = parseApiValidation({ code: 'ERR_NETWORK' });
    expect(result.message).toContain('Could not reach the server');
  });

  it('handles timeout errors', () => {
    const result = parseApiValidation({ code: 'ECONNABORTED' });
    expect(result.message).toContain('timed out');
  });

  it('handles 413 payload too large', () => {
    const result = parseApiValidation({
      response: { status: 413, data: {} },
    });
    expect(result.message).toContain('too large');
  });

  it('falls back for 500 errors', () => {
    const result = parseApiValidation({
      response: { status: 500, data: { message: 'Internal server error' } },
    });
    expect(result.message).toBe('Something went wrong. Please try again.');
  });
});

describe('clientRegisterFormSchema', () => {
  it('rejects weak passwords', () => {
    const result = clientRegisterFormSchema.safeParse({
      name: 'Test',
      email: 'a@b.com',
      password: '12345678', // no uppercase, no special char
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid registration data', () => {
    const result = clientRegisterFormSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'MyP@ssw0rd!',
    });
    expect(result.success).toBe(true);
  });
});
