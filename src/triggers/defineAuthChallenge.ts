import { DefineAuthChallengeTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';

const defineAuthChallenge = async (
  event: DefineAuthChallengeTriggerEvent,
  logger: Logger
): Promise<DefineAuthChallengeTriggerEvent> => {
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('Starting defineAuthChallenge...');
  }
  try {
    if (event.request.userNotFound) {
      event.response.issueTokens = false;
      event.response.failAuthentication = true;
      throw new Error('User does not exist');
    }

    if (
      event.request.session.length >= 3 &&
      event.request.session.slice(-1)[0].challengeResult === false
    ) {
      // wrong OTP even After 3 sessions?
      logger.error('wrong OTP even After 3 sessions?');
      event.response.issueTokens = false;
      event.response.failAuthentication = true;
      throw new Error('Invalid OTP');
    } else if (
      event.request.session.length > 0 &&
      event.request.session.slice(-1)[0].challengeResult === true
    ) {
      // Correct OTP!
      logger.info('CORRECT OTP');
      if (event.request.session.slice(-1)[0].challengeName === 'SRP_A') {
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        event.response.challengeName = 'CUSTOM_CHALLENGE';
      } else {
        event.response.challengeName = 'CUSTOM_CHALLENGE';
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
      }
    } else {
      // not yet received correct OTP
      logger.info('not yet received correct OTP');
      event.response.issueTokens = false;
      event.response.failAuthentication = false;
      event.response.challengeName = 'CUSTOM_CHALLENGE';
    }
  } catch (error) {
    logger.error('Error in defineAuthChallenge', { error });
    throw error;
  }

  return event;
};

export { defineAuthChallenge };
