import { jest } from '@jest/globals';

describe('customMessageSignUp', () => {
  const originalEnv = process.env;

  const setupModule = (options?: {
    signedUrlReject?: unknown;
    s3SendReject?: unknown;
    templateBody?: string;
  }) => {
    jest.resetModules();

    const s3SendMock = options?.s3SendReject
      ? jest.fn().mockRejectedValue(options.s3SendReject)
      : jest.fn().mockResolvedValue({
          Body: {
            transformToString: jest
              .fn()
              .mockResolvedValue(
                options?.templateBody ??
                  'Olá {{NOME_USUARIO}}, logo {{LOGO_URL}}, sobre {{LINK_SOBRE}}, privacidade {{LINK_POLITICA_DE_PRIVACIDADE}}, termo {{LINK_TERMO_DE_USO}}'
              ),
          },
        });

    const getSignedUrlMock = options?.signedUrlReject
      ? jest.fn().mockRejectedValue(options.signedUrlReject)
      : jest.fn().mockResolvedValue('https://assets.example.com/logo.png');

    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({
        send: s3SendMock,
      })),
      GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
    }));

    jest.doMock('@aws-sdk/s3-request-presigner', () => ({
      getSignedUrl: getSignedUrlMock,
    }));

    jest.doMock('@aws-sdk/client-ses', () => ({
      SES: jest.fn().mockImplementation(() => ({})),
    }));

    jest.doMock('@aws-sdk/client-cognito-identity-provider', () => ({
      CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({})),
      AdminGetUserCommand: jest.fn().mockImplementation((params) => params),
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { customMessageSignUp } = require('../../src/triggers/customMessageSignUp');

    return {
      customMessageSignUp,
      mocks: {
        s3SendMock,
        getSignedUrlMock,
      },
    };
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENVIRONMENT: 'dev',
      AWS_REGION: 'us-east-1',
      BUCKET_RESOURCES: 'bucket-resources',
      LOGO_IMG: 'logo.png',
      LOGO_CONTENT_TYPE: 'image/png',
      BUCKET_TEMPLATES: 'bucket-templates',
      TEMPLATE_EMAIL: 'signup-template.html',
      LINK_SOBRE: 'https://example.com/sobre',
      LINK_POLITICA_DE_PRIVACIDADE: 'https://example.com/privacidade',
      LINK_TERMO_DE_USO: 'https://example.com/termos',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds and sets the signup email message and subject for CustomMessage_SignUp', async () => {
    const { customMessageSignUp, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      triggerSource: 'CustomMessage_SignUp',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await customMessageSignUp(event, logger);

    expect(result).toBe(event);
    expect(mocks.getSignedUrlMock).toHaveBeenCalledTimes(1);
    expect(mocks.s3SendMock).toHaveBeenCalledTimes(1);
    expect(result.response.emailSubject).toBe('Confirme sua conta na Minhoteca');
    expect(result.response.emailMessage).toContain('Olá usuario');
    expect(result.response.emailMessage).toContain('logo https://assets.example.com/logo.png');
    expect(result.response.emailMessage).toContain('sobre https://example.com/sobre');
    expect(result.response.emailMessage).toContain('privacidade https://example.com/privacidade');
    expect(result.response.emailMessage).toContain('termo https://example.com/termos');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns event unchanged when triggerSource is not CustomMessage_SignUp', async () => {
    const { customMessageSignUp, mocks } = setupModule();
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      triggerSource: 'CustomMessage_ResendCode',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await customMessageSignUp(event, logger);

    expect(result).toBe(event);
    expect(result.response.emailMessage).toBeUndefined();
    expect(result.response.emailSubject).toBeUndefined();
    expect(mocks.getSignedUrlMock).not.toHaveBeenCalled();
    expect(mocks.s3SendMock).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs an error and returns event when generating the logo URL fails', async () => {
    const signedUrlError = new Error('signed-url-failure');
    const { customMessageSignUp, mocks } = setupModule({
      signedUrlReject: signedUrlError,
    });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      triggerSource: 'CustomMessage_SignUp',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await customMessageSignUp(event, logger);

    expect(result).toBe(event);
    expect(mocks.getSignedUrlMock).toHaveBeenCalledTimes(1);
    expect(mocks.s3SendMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Error in customMessage', {
      error: signedUrlError,
    });
  });

  it('logs an error and returns event when reading template from S3 fails', async () => {
    const s3Error = new Error('s3-failure');
    const { customMessageSignUp, mocks } = setupModule({
      s3SendReject: s3Error,
    });
    const logger = { info: jest.fn(), error: jest.fn() };

    const event = {
      triggerSource: 'CustomMessage_SignUp',
      request: {
        userAttributes: {
          email: 'usuario@exemplo.com',
        },
      },
      response: {},
    };

    const result = await customMessageSignUp(event, logger);

    expect(result).toBe(event);
    expect(mocks.getSignedUrlMock).toHaveBeenCalledTimes(1);
    expect(mocks.s3SendMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Error in customMessage', {
      error: s3Error,
    });
  });
});
