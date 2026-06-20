import { jest } from '@jest/globals';
import { handler } from '../src/index';
import {
  createAuthChallenge,
  customEmailSender,
  customMessageSignUp,
  defineAuthChallenge,
  postAuthentication,
  postConfirmation,
  preAuthentication,
  preSignUp,
  preTokenGeneration,
  verifyAuthChallenge,
} from '../src/triggers';

jest.mock('../src/triggers', () => ({
  createAuthChallenge: jest.fn(),
  customEmailSender: jest.fn(),
  customMessageSignUp: jest.fn(),
  defineAuthChallenge: jest.fn(),
  postAuthentication: jest.fn(),
  postConfirmation: jest.fn(),
  preAuthentication: jest.fn(),
  preSignUp: jest.fn(),
  preTokenGeneration: jest.fn(),
  verifyAuthChallenge: jest.fn(),
}));

describe('handler', () => {
  const mockedPreSignUp = jest.mocked(preSignUp);
  const mockedPostConfirmation = jest.mocked(postConfirmation);
  const mockedPreTokenGeneration = jest.mocked(preTokenGeneration);
  const mockedCustomEmailSender = jest.mocked(customEmailSender);
  const mockedCustomMessageSignUp = jest.mocked(customMessageSignUp);
  const mockedPostAuthentication = jest.mocked(postAuthentication);
  const mockedCreateAuthChallenge = jest.mocked(createAuthChallenge);
  const mockedDefineAuthChallenge = jest.mocked(defineAuthChallenge);
  const mockedPreAuthentication = jest.mocked(preAuthentication);
  const mockedVerifyAuthChallenge = jest.mocked(verifyAuthChallenge);
  const requestId = 'request-id';
  const context = { awsRequestId: requestId };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates PreSignUp_SignUp to preSignUp and returns its result', async () => {
    const event = { triggerSource: 'PreSignUp_SignUp' };
    const expected = { ok: true };
    mockedPreSignUp.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPreSignUp).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates PostConfirmation_ConfirmSignUp to postConfirmation', async () => {
    const event = { triggerSource: 'PostConfirmation_ConfirmSignUp' };
    const expected = { ok: 'confirmed' };
    mockedPostConfirmation.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPostConfirmation).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates PreAuthentication_Authentication to preAuthentication', async () => {
    const event = { triggerSource: 'PreAuthentication_Authentication' };
    const expected = { ok: 'preauth' };
    mockedPreAuthentication.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPreAuthentication).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates PostAuthentication_Authentication to postAuthentication', async () => {
    const event = { triggerSource: 'PostAuthentication_Authentication' };
    const expected = { ok: 'postauth' };
    mockedPostAuthentication.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPostAuthentication).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates DefineAuthChallenge_Authentication to defineAuthChallenge', async () => {
    const event = { triggerSource: 'DefineAuthChallenge_Authentication' };
    const expected = { ok: 'defineauth' };
    mockedDefineAuthChallenge.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedDefineAuthChallenge).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CreateAuthChallenge_Authentication to createAuthChallenge', async () => {
    const event = { triggerSource: 'CreateAuthChallenge_Authentication' };
    const expected = { ok: 'createauth' };
    mockedCreateAuthChallenge.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedCreateAuthChallenge).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates VerifyAuthChallengeResponse_Authentication to verifyAuthChallenge', async () => {
    const event = { triggerSource: 'VerifyAuthChallengeResponse_Authentication' };
    const expected = { ok: 'verifyauth' };
    mockedVerifyAuthChallenge.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedVerifyAuthChallenge).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CustomMessage_SignUp to customMessageSignUp and returns its result', async () => {
    const event = { triggerSource: 'CustomMessage_SignUp' };
    const expected = { ok: 'custom-message' };
    mockedCustomMessageSignUp.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedCustomMessageSignUp).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CustomEmailSender_* to customEmailSender and returns its result', async () => {
    const event = { triggerSource: 'CustomEmailSender_SignUp' };
    const expected = { ok: 'email' };
    mockedCustomEmailSender.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedCustomEmailSender).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CustomEmailSender_ResendCode to customEmailSender', async () => {
    const event = { triggerSource: 'CustomEmailSender_ResendCode' };
    const expected = { ok: 'email' };
    mockedCustomEmailSender.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedCustomEmailSender).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates CustomEmailSender_ForgotPassword to customEmailSender', async () => {
    const event = { triggerSource: 'CustomEmailSender_ForgotPassword' };
    const expected = { ok: 'email' };
    mockedCustomEmailSender.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedCustomEmailSender).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_* to preTokenGeneration and returns its result', async () => {
    const event = { triggerSource: 'TokenGeneration_Authentication' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_NewPasswordChallenge to preTokenGeneration', async () => {
    const event = { triggerSource: 'TokenGeneration_NewPasswordChallenge' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_AuthenticateDevice to preTokenGeneration', async () => {
    const event = { triggerSource: 'TokenGeneration_AuthenticateDevice' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('delegates TokenGeneration_RefreshTokens to preTokenGeneration', async () => {
    const event = { triggerSource: 'TokenGeneration_RefreshTokens' };
    const expected = { ok: 'token' };
    mockedPreTokenGeneration.mockResolvedValue(expected as never);

    const result = await handler(event as never, context as never, jest.fn() as never);

    expect(mockedPreTokenGeneration).toHaveBeenCalledWith(event, requestId, expect.anything());
    expect(result).toBe(expected);
  });

  it('calls callback with an error for unknown trigger sources', async () => {
    const event = { triggerSource: 'Unknown_Trigger' };
    const callback = jest.fn();

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(expect.any(Error), event);
    expect(callback.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ message: 'Evento não tratado: Unknown_Trigger' })
    );
  });

  it('calls callback when preSignUp throws', async () => {
    const event = { triggerSource: 'PreSignUp_SignUp' };
    const error = new Error('signup error');
    const callback = jest.fn();
    mockedPreSignUp.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when postConfirmation throws', async () => {
    const event = { triggerSource: 'PostConfirmation_ConfirmSignUp' };
    const error = new Error('postconf error');
    const callback = jest.fn();
    mockedPostConfirmation.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when preAuthentication throws', async () => {
    const event = { triggerSource: 'PreAuthentication_Authentication' };
    const error = new Error('preauth error');
    const callback = jest.fn();
    mockedPreAuthentication.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when postAuthentication throws', async () => {
    const event = { triggerSource: 'PostAuthentication_Authentication' };
    const error = new Error('postauth error');
    const callback = jest.fn();
    mockedPostAuthentication.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when defineAuthChallenge throws', async () => {
    const event = { triggerSource: 'DefineAuthChallenge_Authentication' };
    const error = new Error('defineauth error');
    const callback = jest.fn();
    mockedDefineAuthChallenge.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when customEmailSender throws', async () => {
    const event = { triggerSource: 'CustomEmailSender_UpdateUserAttribute' };
    const error = new Error('email error');
    const callback = jest.fn();
    mockedCustomEmailSender.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when createAuthChallenge throws', async () => {
    const event = { triggerSource: 'CreateAuthChallenge_Authentication' };
    const error = new Error('createauth error');
    const callback = jest.fn();
    mockedCreateAuthChallenge.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when verifyAuthChallenge throws', async () => {
    const event = { triggerSource: 'VerifyAuthChallengeResponse_Authentication' };
    const error = new Error('verify error');
    const callback = jest.fn();
    mockedVerifyAuthChallenge.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when preTokenGeneration throws', async () => {
    const event = { triggerSource: 'TokenGeneration_RefreshTokens' };
    const error = new Error('token error');
    const callback = jest.fn();
    mockedPreTokenGeneration.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('calls callback when customMessageSignUp throws', async () => {
    const event = { triggerSource: 'CustomMessage_SignUp' };
    const error = new Error('custom message error');
    const callback = jest.fn();
    mockedCustomMessageSignUp.mockRejectedValue(error);

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(callback).toHaveBeenCalledWith(error, event);
  });

  it('does not use the legacy trigger_source fallback parameter', async () => {
    const event = { trigger_source: 'PreSignUp_SignUp' };
    const callback = jest.fn();

    const result = await handler(event as never, context as never, callback as never);

    expect(result).toBeUndefined();
    expect(mockedPreSignUp).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.any(Error), event);
  });
});
