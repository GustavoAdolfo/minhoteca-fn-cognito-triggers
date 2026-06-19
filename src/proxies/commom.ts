import { ConfigServiceClient } from '@aws-sdk/client-config-service';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Agent } from 'http';

export const reviewOptions = (options: ConfigServiceClient): Record<string, unknown> => {
  const config: Record<string, unknown> = {
    requestHandler: new NodeHttpHandler({
      httpAgent: new Agent({
        keepAlive: false,
      }),
    }),
    region: options.config.region as string,
    maxAttempts: options.config.maxAttempts as number,
  };

  if (options.config.endpoint) {
    config.endpoint = options.config.endpoint;
  }
  return config;
};

export const optionsConfiguration = (
  region: string,
  endpoint?: string,
  maxAttempts = 5
): ConfigServiceClient => {
  if (endpoint) {
    return new ConfigServiceClient({
      region: region,
      endpoint: endpoint,
      maxAttempts: maxAttempts,
    });
  }
  return new ConfigServiceClient({
    region: region,
    maxAttempts: maxAttempts,
  });
};
