import { ConfigServiceClient } from '@aws-sdk/client-config-service';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { optionsConfiguration, reviewOptions } from '../../src/proxies/commom';

describe('reviewOptions', () => {
  it('returns the expected request handler and config values when endpoint is provided', () => {
    const client = {
      config: {
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        maxAttempts: 3,
      },
    } as unknown as ConfigServiceClient;

    const config = reviewOptions(client);

    expect(config.requestHandler).toBeInstanceOf(NodeHttpHandler);
    expect(config.region).toBe('us-east-1');
    expect(config.maxAttempts).toBe(3);
    expect(config.endpoint).toBe('http://localhost:4566');
  });

  it('omits endpoint when it is not configured', () => {
    const client = {
      config: {
        region: 'us-west-2',
        maxAttempts: 5,
      },
    } as unknown as ConfigServiceClient;

    const config = reviewOptions(client);

    expect(config.requestHandler).toBeInstanceOf(NodeHttpHandler);
    expect(config.region).toBe('us-west-2');
    expect(config.maxAttempts).toBe(5);
    expect(config).not.toHaveProperty('endpoint');
  });
});

describe('optionsConfiguration', () => {
  it('creates a client with the provided endpoint and custom maxAttempts', async () => {
    const client = optionsConfiguration('eu-central-1', 'http://localhost:4566', 7);

    expect(client).toBeInstanceOf(ConfigServiceClient);
    expect(await client.config.region()).toBe('eu-central-1');
    expect(await client.config.endpoint()).toEqual({
      hostname: 'localhost',
      port: 4566,
      protocol: 'http:',
      path: '/',
      query: undefined,
    });
    expect(await client.config.maxAttempts()).toBe(7);
  });

  it('creates a client with the default maxAttempts when endpoint is not provided', async () => {
    const client = optionsConfiguration('sa-east-1');

    expect(client).toBeInstanceOf(ConfigServiceClient);
    expect(await client.config.region()).toBe('sa-east-1');
    expect(await client.config.maxAttempts()).toBe(5);
  });
});
