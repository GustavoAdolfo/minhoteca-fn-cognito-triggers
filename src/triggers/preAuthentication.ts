import { PreAuthenticationTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';

const preAuthenticaton = async (
  event: PreAuthenticationTriggerEvent,
  logger: Logger
): Promise<PreAuthenticationTriggerEvent> => {
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('Starting preAuthenticaton...');
  }
  return event;
};

export { preAuthenticaton };
