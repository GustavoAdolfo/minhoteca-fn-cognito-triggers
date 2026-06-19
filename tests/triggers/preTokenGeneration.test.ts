import { jest } from '@jest/globals';

describe('preTokenGeneration', () => {
  const originalEnv = process.env;

  const setupModule = (options?: {
    users?: Array<{ Attributes?: Array<{ Name: string; Value: string }> }>;
    sendReject?: unknown;
  }) => {
    jest.resetModules();

    const sendMock = options?.sendReject
      ? jest.fn().mockRejectedValue(options.sendReject)
      : jest.fn().mockResolvedValue({
          Users: options?.users ?? [],
        });

    const listUsersCommandMock = jest.fn().mockImplementation((input) => ({ input }));

    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: sendMock,
      })),
      ListUsersCommand: listUsersCommandMock,
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { preTokenGeneration } = require('../../src/triggers/preTokenGeneration');

    return {
      preTokenGeneration,
      mocks: {
        sendMock,
        listUsersCommandMock,
      },
    };
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENVIRONMENT: 'prod',
      AWS_REGION: 'us-east-1',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createEvent = () => ({
    userPoolId: 'pool-id',
    request: {
      userAttributes: {
        sub: 'user-sub-123',
      },
    },
    response: {},
  });

  it('sets borrowApproved=true when user attribute custom:borrowApproved is true', async () => {
    const users = [
      {
        Attributes: [
          { Name: 'custom:borrowApproved', Value: 'true' },
          { Name: 'email', Value: 'usuario@exemplo.com' },
        ],
      },
    ];
    const { preTokenGeneration, mocks } = setupModule({ users });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = createEvent();
    const result = await preTokenGeneration(event, logger);

    expect(result).toBe(event);
    expect(mocks.listUsersCommandMock).toHaveBeenCalledWith({
      UserPoolId: 'pool-id',
      Filter: '"sub"^="user-sub-123"',
    });
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(result.response.claimsOverrideDetails.claimsToAddOrOverride).toEqual({
      borrowApproved: 'true',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets borrowApproved=false when user is not found', async () => {
    const { preTokenGeneration, mocks } = setupModule({ users: [] });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = createEvent();
    const result = await preTokenGeneration(event, logger);

    expect(result).toBe(event);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(result.response.claimsOverrideDetails.claimsToAddOrOverride).toEqual({
      borrowApproved: 'false',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('sets borrowApproved=false when attribute exists but value is not true', async () => {
    const users = [
      {
        Attributes: [{ Name: 'custom:borrowApproved', Value: 'false' }],
      },
    ];
    const { preTokenGeneration } = setupModule({ users });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = createEvent();
    const result = await preTokenGeneration(event, logger);

    expect(result.response.claimsOverrideDetails.claimsToAddOrOverride).toEqual({
      borrowApproved: 'false',
    });
  });

  it('logs start in debug mode', async () => {
    process.env.ENVIRONMENT = 'debug';
    const { preTokenGeneration } = setupModule({ users: [] });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = createEvent();
    await preTokenGeneration(event, logger);

    expect(logger.info).toHaveBeenCalledWith('Starting customEmailSender...');
  });

  it('logs and rethrows when Cognito list users fails', async () => {
    const sendError = new Error('cognito-list-failure');
    const { preTokenGeneration, mocks } = setupModule({ sendReject: sendError });
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const event = createEvent();

    await expect(preTokenGeneration(event, logger)).rejects.toThrow('cognito-list-failure');
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Error in preTokenGeneration!', {
      error: sendError,
    });
  });
});
