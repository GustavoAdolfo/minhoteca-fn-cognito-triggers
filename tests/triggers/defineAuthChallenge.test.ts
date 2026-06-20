import { jest } from '@jest/globals';
import { defineAuthChallenge } from '../../src/triggers/defineAuthChallenge';

describe('defineAuthChallenge', () => {
  const requestId = 'request-id';
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ENVIRONMENT = 'dev';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createEvent = (
    userNotFound = false,
    session: Array<{ challengeName?: string; challengeResult?: boolean }> = []
  ) => ({
    request: {
      userNotFound,
      session,
    },
    response: {},
  });

  it('fails authentication and throws when the user does not exist', async () => {
    const event = createEvent(true);

    await expect(defineAuthChallenge(event as never, requestId, logger as never)).rejects.toThrow(
      'Usuário não encontrado'
    );

    expect(event.response.issueTokens).toBe(false);
    expect(event.response.failAuthentication).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('fails authentication and throws after 3 failed OTP attempts', async () => {
    const event = createEvent(false, [
      { challengeResult: false },
      { challengeResult: false },
      { challengeResult: false },
    ]);

    await expect(defineAuthChallenge(event as never, requestId, logger as never)).rejects.toThrow(
      'OTP inválido'
    );

    expect(event.response.issueTokens).toBe(false);
    expect(event.response.failAuthentication).toBe(true);
    expect(logger.error).toHaveBeenCalledWith('OTP incorreto mesmo após 3 tentativas?');
  });

  it('does not issue tokens but continues the flow when the correct OTP is provided after SRP_A', async () => {
    const event = createEvent(false, [{ challengeName: 'SRP_A', challengeResult: true }]);

    const result = await defineAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.issueTokens).toBe(false);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(logger.info).toHaveBeenCalledWith('OTP correto');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('issues tokens when the correct OTP is provided after a custom challenge', async () => {
    const event = createEvent(false, [
      { challengeName: 'CUSTOM_CHALLENGE', challengeResult: true },
    ]);

    const result = await defineAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.issueTokens).toBe(true);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(logger.info).toHaveBeenCalledWith('OTP correto');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets up a custom challenge when no correct OTP has been received yet', async () => {
    const event = createEvent(false, []);

    const result = await defineAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.issueTokens).toBe(false);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(logger.info).toHaveBeenCalledWith('Ainda não recebeu OTP correto');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets up a custom challenge when the previous OTP was incorrect', async () => {
    const event = createEvent(false, [{ challengeResult: false }]);

    const result = await defineAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.issueTokens).toBe(false);
    expect(result.response.failAuthentication).toBe(false);
    expect(result.response.challengeName).toBe('CUSTOM_CHALLENGE');
    expect(logger.info).toHaveBeenCalledWith('Ainda não recebeu OTP correto');
    expect(logger.error).not.toHaveBeenCalled();
  });
});
