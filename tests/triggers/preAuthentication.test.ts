import { preAuthentication } from '../../src/triggers/preAuthentication';

describe('preAuthentication', () => {
  const originalEnv = process.env;
  const requestId = 'request-id';

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the same event when environment is not debug', async () => {
    process.env.ENVIRONMENT = 'prod';
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await preAuthentication(event as never, requestId, logger as never);

    expect(result).toBe(event);
    expect(logger.info).toHaveBeenCalledWith(
      '🏁 Evento iniciado',
      { requestId, triggerSource: undefined },
      { event }
    );
    expect(logger.info).toHaveBeenCalledWith(
      '✅ Evento finalizado',
      { requestId, triggerSource: undefined },
      { event }
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs start message and returns the same event when environment is debug', async () => {
    process.env.ENVIRONMENT = 'debug';
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = {
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await preAuthentication(event as never, requestId, logger as never);

    expect(result).toBe(event);
    expect(logger.info).toHaveBeenCalledWith(
      '🏁 Evento iniciado',
      { requestId, triggerSource: undefined },
      { event }
    );
    expect(logger.info).toHaveBeenCalledWith(
      '✅ Evento finalizado',
      { requestId, triggerSource: undefined },
      { event }
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});
