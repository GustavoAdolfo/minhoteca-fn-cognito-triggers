import { jest } from '@jest/globals';
import { verifyAuthChallenge } from '../../src/triggers/verifyAuthChallenge';

describe('verifyAuthChallenge', () => {
  const requestId = 'request-id';
  const originalEnv = process.env;

  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const createEvent = (code?: string, answer?: string) => ({
    request: {
      privateChallengeParameters: { code },
      challengeAnswer: answer,
    },
    response: {
      answerCorrect: false,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('marks the challenge as correct when the provided answer matches the expected code', async () => {
    const event = createEvent('123456', '123456');

    const result = await verifyAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.answerCorrect).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('marks the challenge as incorrect when the provided answer differs from the expected code', async () => {
    const event = createEvent('123456', '654321');

    const result = await verifyAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.answerCorrect).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('trims whitespace before comparing the expected and provided answers', async () => {
    const event = createEvent(' 123456 ', '123456');

    const result = await verifyAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.answerCorrect).toBe(true);
  });

  it.each([
    ['missing code', undefined, '123456'],
    ['missing answer', '123456', undefined],
    ['empty code and answer', '   ', '   '],
  ])('marks the challenge as incorrect when %s', async (_description, code, answer) => {
    const event = createEvent(code, answer);

    const result = await verifyAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.answerCorrect).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs start message and comparison result when ENVIRONMENT is debug', async () => {
    process.env.ENVIRONMENT = 'debug';
    const event = createEvent('123456', '123456');

    const result = await verifyAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.answerCorrect).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      '🏁 Evento iniciado',
      { requestId, triggerSource: undefined },
      { event }
    );
    expect(logger.info).toHaveBeenCalledWith('responseAnswer === expectedAnswer', {
      expectedAnswer: '123456',
      responseAnswer: '123456',
      result: true,
    });
  });

  it('logs incorrect comparison result when ENVIRONMENT is debug and answers differ', async () => {
    process.env.ENVIRONMENT = 'debug';
    const event = createEvent('123456', '000000');

    const result = await verifyAuthChallenge(event as never, requestId, logger as never);

    expect(result.response.answerCorrect).toBe(false);
    expect(logger.info).toHaveBeenCalledWith(
      '🏁 Evento iniciado',
      { requestId, triggerSource: undefined },
      { event }
    );
    expect(logger.info).toHaveBeenCalledWith('responseAnswer === expectedAnswer', {
      expectedAnswer: '123456',
      responseAnswer: '000000',
      result: false,
    });
  });
});
