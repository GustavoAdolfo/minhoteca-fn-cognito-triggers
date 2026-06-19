import { jest } from '@jest/globals';
import { handler } from '../src/index';
import {
  createAuthChallenge,
  customEmailSender,
  defineAuthChallenge,
  postAuthentication,
  postConfirmation,
  preAuthenticaton,
  preSignUp,
  preTokenGeneration,
  verifyAuthChallenge,
} from '../src/triggers';

jest.mock('../src/triggers', () => ({
  createAuthChallenge: jest.fn(),
  customEmailSender: jest.fn(),
  defineAuthChallenge: jest.fn(),
  postAuthentication: jest.fn(),
  postConfirmation: jest.fn(),
  preAuthenticaton: jest.fn(),
  preSignUp: jest.fn(),
  preTokenGeneration: jest.fn(),
  verifyAuthChallenge: jest.fn(),
}));

describe('handler', () => {
  const mockedPreSignUp = jest.mocked(preSignUp);
  const mockedPostConfirmation = jest.mocked(postConfirmation);
  const mockedPreTokenGeneration = jest.mocked(preTokenGeneration);
  const mockedCustomEmailSender = jest.mocked(customEmailSender);
  const mockedPostAuthentication = jest.mocked(postAuthentication);
  const mockedCreateAuthChallenge = jest.mocked(createAuthChallenge);
  const mockedDefineAuthChallenge = jest.mocked(defineAuthChallenge);
  const mockedPreAuthentication = jest.mocked(preAuthenticaton);
  const mockedVerifyAuthChallenge = jest.mocked(verifyAuthChallenge);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates PreSignUp_SignUp to preSignUp and returns its result', async () => {
    const event = { triggerSource: 'PreSignUp_SignUp' };
    const expected = { ok: true };
    mockedPreSignUp.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPreSignUp).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates PostConfirmation_ConfirmSignUp to postConfirmation', async () => {
    const event = { triggerSource: 'PostConfirmation_ConfirmSignUp' };
    const expected = { ok: 'confirmed' };
    mockedPostConfirmation.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPostConfirmation).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates PreAuthentication_Authentication to preAuthenticaton', async () => {
    const event = { triggerSource: 'PreAuthentication_Authentication' };
    const expected = { ok: 'preauth' };
    mockedPreAuthentication.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPreAuthentication).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates PostAuthentication_Authentication to postAuthentication', async () => {
    const event = { triggerSource: 'PostAuthentication_Authentication' };
    const expected = { ok: 'postauth' };
    mockedPostAuthentication.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPostAuthentication).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates DefineAuthChallenge_Authentication to defineAuthChallenge', async () => {
    const event = { triggerSource: 'DefineAuthChallenge_Authentication' };
    const expected = { ok: 'defineauth' };
    mockedDefineAuthChallenge.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedDefineAuthChallenge).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CreateAuthChallenge_Authentication to createAuthChallenge', async () => {
    const event = { triggerSource: 'CreateAuthChallenge_Authentication' };
    const expected = { ok: 'createauth' };
    mockedCreateAuthChallenge.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedCreateAuthChallenge).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates VerifyAuthChallengeResponse_Authentication to verifyAuthChallenge', async () => {
    const event = { triggerSource: 'VerifyAuthChallengeResponse_Authentication' };
    const expected = { ok: 'verifyauth' };
    mockedVerifyAuthChallenge.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedVerifyAuthChallenge).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CustomEmailSender_* to customEmailSender and returns its result', async () => {
    const event = { triggerSource: 'CustomEmailSender_SignUp' };
    const expected = { ok: 'email' };
    mockedCustomEmailSender.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedCustomEmailSender).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CustomEmailSender_ResendCode to customEmailSender', async () => {
    const event = { triggerSource: 'CustomEmailSender_ResendCode' };
    const expected = { ok: 'email' };
    mockedCustomEmailSender.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedCustomEmailSender).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CustomEmailSender_ForgotPassword to customEmailSender', async () => {
    const event = { triggerSource: 'CustomEmailSender_ForgotPassword' };
    const expected = { ok: 'email' };
    mockedCustomEmailSender.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedCustomEmailSender).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_* to preTokenGeneration and returns its result', async () => {
    const event = { triggerSource: 'TokenGeneration_Authentication' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_NewPasswordChallenge to preTokenGeneration', async () => {
    const event = { triggerSource: 'TokenGeneration_NewPasswordChallenge' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_AuthenticateDevice to preTokenGeneration', async () => {
    const event = { triggerSource: 'TokenGeneration_AuthenticateDevice' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_RefreshTokens to preTokenGeneration', async () => {
    const event = { triggerSource: 'TokenGeneration_RefreshTokens' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });

  it('returns undefined for unknown trigger sources', async () => {
    const event = { triggerSource: 'Unknown_Trigger' };

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows preSignUp errors', async () => {
    const event = { triggerSource: 'PreSignUp_SignUp' };
    mockedPreSignUp.mockRejectedValue(new Error('signup error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows postConfirmation errors', async () => {
    const event = { triggerSource: 'PostConfirmation_ConfirmSignUp' };
    mockedPostConfirmation.mockRejectedValue(new Error('postconf error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows preAuthentication errors', async () => {
    const event = { triggerSource: 'PreAuthentication_Authentication' };
    mockedPreAuthentication.mockRejectedValue(new Error('preauth error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows postAuthentication errors', async () => {
    const event = { triggerSource: 'PostAuthentication_Authentication' };
    mockedPostAuthentication.mockRejectedValue(new Error('postauth error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows defineAuthChallenge errors', async () => {
    const event = { triggerSource: 'DefineAuthChallenge_Authentication' };
    mockedDefineAuthChallenge.mockRejectedValue(new Error('defineauth error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows customEmailSender errors', async () => {
    const event = { triggerSource: 'CustomEmailSender_UpdateUserAttribute' };
    mockedCustomEmailSender.mockRejectedValue(new Error('email error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows createAuthChallenge errors', async () => {
    const event = { triggerSource: 'CreateAuthChallenge_Authentication' };
    mockedCreateAuthChallenge.mockRejectedValue(new Error('createauth error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows verifyAuthChallenge errors', async () => {
    const event = { triggerSource: 'VerifyAuthChallengeResponse_Authentication' };
    mockedVerifyAuthChallenge.mockRejectedValue(new Error('verify error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('swallows preTokenGeneration errors', async () => {
    const event = { triggerSource: 'TokenGeneration_RefreshTokens' };
    mockedPreTokenGeneration.mockRejectedValue(new Error('token error'));

    const result = await handler(event as never, {} as never, jest.fn());

    expect(result).toBeUndefined();
  });

  it('handles trigger_source fallback parameter', async () => {
    const event = { trigger_source: 'PreSignUp_SignUp' };
    const expected = { ok: true };
    mockedPreSignUp.mockResolvedValue(expected as never);

    const result = await handler(event as never, {} as never, jest.fn());

    expect(mockedPreSignUp).toHaveBeenCalledWith(event, expect.anything());
    expect(result).toBe(expected);
  });
});
