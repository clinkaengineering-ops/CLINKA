import {
  emailField,
  passwordField,
  nameField,
  otpField,
  phoneField,
  optionalUrlField,
  feePercentField,
} from './fields';

describe('validation fields', () => {
  it('validates emailField', () => {
    expect(emailField.safeParse('USER@EXAMPLE.COM').data).toBe('user@example.com');
    expect(emailField.safeParse('invalid-email').success).toBe(false);
  });

  it('validates passwordField against rules', () => {
    expect(passwordField.safeParse('Weak1!').success).toBe(false); // too short
    expect(passwordField.safeParse('weakpassword123!').success).toBe(false); // no uppercase
    expect(passwordField.safeParse('ValidP@ssw0rd!').success).toBe(true);
  });

  it('validates nameField', () => {
    expect(nameField.safeParse('John Doe').success).toBe(true);
    expect(nameField.safeParse('A').success).toBe(false);
    expect(nameField.safeParse('John123').success).toBe(false);
  });

  it('validates otpField', () => {
    expect(otpField.safeParse('123456').success).toBe(true);
    expect(otpField.safeParse('12345').success).toBe(false);
    expect(otpField.safeParse('12345a').success).toBe(false);
  });

  it('validates phoneField', () => {
    expect(phoneField.safeParse('+1 234 567 8901').success).toBe(true);
    expect(phoneField.safeParse('123').success).toBe(false);
  });

  it('validates optionalUrlField', () => {
    expect(optionalUrlField.safeParse('').data).toBeUndefined();
    expect(optionalUrlField.safeParse('https://example.com').data).toBe('https://example.com');
    expect(optionalUrlField.safeParse('not-a-url').success).toBe(false);
  });

  it('validates feePercentField', () => {
    expect(feePercentField.safeParse('15').data).toBe(15);
    expect(feePercentField.safeParse('-5').success).toBe(false);
    expect(feePercentField.safeParse('105').success).toBe(false);
  });
});
