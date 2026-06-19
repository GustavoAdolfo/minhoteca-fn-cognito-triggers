import { jest } from '@jest/globals';

describe('createAuthChallenge', () => {
  const originalEnv = process.env;

  const loadModule = () => require('../../src/triggers/createAuthChallenge');

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      ENVIRONMENT: 'dev',
      AWS_REGION: 'us-east-1',
      TEMPLATE_EMAIL_LOGIN: 'welcome-template',
      LINK_SOBRE: 'https://example.com/about',
      LINK_POLITICA_DE_PRIVACIDADE: 'https://example.com/privacy',
      LINK_TERMO_DE_USO: 'https://example.com/terms',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates a code, replaces placeholders and sends the email when the user has an email', async () => {
    const cognitoSendMock = jest.fn().mockResolvedValue({ Username: 'user-1' });
    const sesSendMock = jest.fn().mockResolvedValue({});
    const createPreSignedUrlLogoMock = jest.fn().mockResolvedValue(
      'https://logo.example.com/logo.png'
    );
    const getTemplateEmailMock = jest.fn().mockResolvedValue(
      'Olá {{NOME_USUARIO}}! Seu código é {{CONFIRMATION_CODE}}. Logo: {{LOGO_URL}}. Sobre: {{LINK_SOBRE}}'
    );

    jest.doMock('crypto', () => ({
      ...jest.requireActual('crypto'),
      randomUUID: jest.fn(() => '1234567890abcdef'),
    }));
    jest.doMock('@aws-sdk/client-ses', () => ({
      SES: jest.fn().mockImplementation(() => ({
        send: sesSendMock,
      })),
      SendEmailCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: cognitoSendMock,
      })),
      AdminGetUserCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('../../src/triggers/commom', () => ({
      createPreSignedUrlLogo: createPreSignedUrlLogoMock,
      getTemplateEmail: getTemplateEmailMock,
    }));

    const { createAuthChallenge } = loadModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'user-1',
      request: {
        userAttributes: {
          email: 'user@example.com',
        },
      },
      response: {},
    };

    const result = await createAuthChallenge(event, logger);

    expect(result.response.privateChallengeParameters).toEqual({ code: '123456' });
    expect(createPreSignedUrlLogoMock).toHaveBeenCalledWith(logger);
    expect(getTemplateEmailMock).toHaveBeenCalledWith('welcome-template', logger);
    expect(cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(sesSendMock).toHaveBeenCalledTimes(1);

    const params = sesSendMock.mock.calls[0][0];
    expect(params.Message?.Body?.Text?.Data).toContain(
      'Olá user! Seu código é 123456. Logo: https://logo.example.com/logo.png. Sobre: https://example.com/about'
    );
    expect(params.Message?.Body?.Html?.Data).toContain(
      'Olá user! Seu código é 123456. Logo: https://logo.example.com/logo.png. Sobre: https://example.com/about'
    );
    expect(params.Message?.Subject?.Data).toBe('Código para login na Minhoteca');
  });

  it('returns the event unchanged when the user lookup does not return a user', async () => {
    const cognitoSendMock = jest.fn().mockResolvedValue(undefined);
    const sesSendMock = jest.fn();
    const createPreSignedUrlLogoMock = jest.fn();
    const getTemplateEmailMock = jest.fn();

    jest.doMock('crypto', () => ({
      ...jest.requireActual('crypto'),
      randomUUID: jest.fn(() => '1234567890abcdef'),
    }));
    jest.doMock('@aws-sdk/client-ses', () => ({
      SES: jest.fn().mockImplementation(() => ({ send: sesSendMock })),
      SendEmailCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: cognitoSendMock,
      })),
      AdminGetUserCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('../../src/triggers/commom', () => ({
      createPreSignedUrlLogo: createPreSignedUrlLogoMock,
      getTemplateEmail: getTemplateEmailMock,
    }));

    const { createAuthChallenge } = loadModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'user-1',
      request: {
        userAttributes: {
          email: 'user@example.com',
        },
      },
      response: {},
    };

    const result = await createAuthChallenge(event, logger);

    expect(result).toBe(event);
    expect(cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(createPreSignedUrlLogoMock).not.toHaveBeenCalled();
    expect(getTemplateEmailMock).not.toHaveBeenCalled();
    expect(sesSendMock).not.toHaveBeenCalled();
  });

  it('does not send an email when the user has no email attribute', async () => {
    const cognitoSendMock = jest.fn().mockResolvedValue({ Username: 'user-1' });
    const sesSendMock = jest.fn();
    const createPreSignedUrlLogoMock = jest.fn();
    const getTemplateEmailMock = jest.fn();

    jest.doMock('crypto', () => ({
      ...jest.requireActual('crypto'),
      randomUUID: jest.fn(() => '1234567890abcdef'),
    }));
    jest.doMock('@aws-sdk/client-ses', () => ({
      SES: jest.fn().mockImplementation(() => ({ send: sesSendMock })),
      SendEmailCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: cognitoSendMock,
      })),
      AdminGetUserCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('../../src/triggers/commom', () => ({
      createPreSignedUrlLogo: createPreSignedUrlLogoMock,
      getTemplateEmail: getTemplateEmailMock,
    }));

    const { createAuthChallenge } = loadModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'user-1',
      request: {
        userAttributes: {},
      },
      response: {},
    };

    const result = await createAuthChallenge(event, logger);

    expect(result.response.privateChallengeParameters).toEqual({ code: '123456' });
    expect(cognitoSendMock).toHaveBeenCalledTimes(1);
    expect(createPreSignedUrlLogoMock).not.toHaveBeenCalled();
    expect(getTemplateEmailMock).not.toHaveBeenCalled();
    expect(sesSendMock).not.toHaveBeenCalled();
  });

  it('logs and rethrows when the Cognito lookup fails', async () => {
    const error = new Error('cognito failure');
    const cognitoSendMock = jest.fn().mockRejectedValue(error);
    const sesSendMock = jest.fn();
    const createPreSignedUrlLogoMock = jest.fn();
    const getTemplateEmailMock = jest.fn();

    jest.doMock('crypto', () => ({
      ...jest.requireActual('crypto'),
      randomUUID: jest.fn(() => '1234567890abcdef'),
    }));
    jest.doMock('@aws-sdk/client-ses', () => ({
      SES: jest.fn().mockImplementation(() => ({ send: sesSendMock })),
      SendEmailCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: cognitoSendMock,
      })),
      AdminGetUserCommand: jest.fn().mockImplementation((params) => params),
    }));
    jest.doMock('../../src/triggers/commom', () => ({
      createPreSignedUrlLogo: createPreSignedUrlLogoMock,
      getTemplateEmail: getTemplateEmailMock,
    }));

    const { createAuthChallenge } = loadModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      userPoolId: 'pool-id',
      userName: 'user-1',
      request: {
        userAttributes: {
          email: 'user@example.com',
        },
      },
      response: {},
    };

    await expect(createAuthChallenge(event, logger)).rejects.toThrow('cognito failure');
    expect(logger.error).toHaveBeenCalledWith('Error in createAuthChallenge', {
      error,
    });
  });
});
