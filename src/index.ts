import {
  PreSignUpTriggerEvent,
  CustomMessageTriggerEvent,
  PostConfirmationTriggerEvent,
  PreAuthenticationTriggerEvent,
  PostAuthenticationTriggerEvent,
  DefineAuthChallengeTriggerEvent,
  CustomEmailSenderTriggerEvent,
  CreateAuthChallengeTriggerEvent,
  VerifyAuthChallengeResponseTriggerEvent,
  PreTokenGenerationTriggerEvent,
  Context,
  Callback,
} from 'aws-lambda';

import { LogService } from '@gustavoadolfo/minhoteca-core-layer';

import {
  defineAuthChallenge,
  postConfirmation,
  preSignUp,
  postAuthentication,
  createAuthChallenge,
  preAuthentication,
  customEmailSender,
  verifyAuthChallenge,
  preTokenGeneration,
  customMessageSignUp,
} from './triggers';

const logger = new LogService('handler');

export const handler = async (
  event:
    | PreSignUpTriggerEvent
    | CustomMessageTriggerEvent
    | PostConfirmationTriggerEvent
    | PreAuthenticationTriggerEvent
    | PostAuthenticationTriggerEvent
    | DefineAuthChallengeTriggerEvent
    | CustomEmailSenderTriggerEvent
    | CreateAuthChallengeTriggerEvent
    | VerifyAuthChallengeResponseTriggerEvent
    | PreTokenGenerationTriggerEvent,
  context: Context,
  callback: Callback
) => {
  const triggerSource = event.triggerSource;
  const requestId = context.awsRequestId;

  logger.info(
    '🏁 Iniciando handler cognito trigger',
    {
      triggerSource,
      requestId,
    },
    { event }
  );

  let resultEvent;

  try {
    const triggerSource = event.triggerSource;
    switch (triggerSource) {
      case 'PreSignUp_SignUp':
        resultEvent = await preSignUp(event as PreSignUpTriggerEvent, requestId, logger);
        logger.info('resultEvent preSignUp', { resultEvent });
        return resultEvent;

      case 'CustomMessage_SignUp':
        resultEvent = await customMessageSignUp(
          event as CustomMessageTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent customMessageSignUp', { resultEvent });
        return resultEvent;

      case 'PostConfirmation_ConfirmSignUp':
        resultEvent = await postConfirmation(
          event as PostConfirmationTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent postConfirmation', { resultEvent });
        return resultEvent;

      case 'PreAuthentication_Authentication':
        resultEvent = await preAuthentication(
          event as PreAuthenticationTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent preAuthenticaton', { resultEvent });
        return resultEvent;

      case 'PostAuthentication_Authentication':
        resultEvent = await postAuthentication(
          event as PostAuthenticationTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent postAuthentication', { resultEvent });
        return resultEvent;

      case 'DefineAuthChallenge_Authentication':
        resultEvent = await defineAuthChallenge(
          event as DefineAuthChallengeTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent defineAuthChallenge', { resultEvent });
        return resultEvent;

      case 'CustomEmailSender_Authentication':
      case 'CustomEmailSender_SignUp':
      case 'CustomEmailSender_ResendCode':
      case 'CustomEmailSender_ForgotPassword':
      case 'CustomEmailSender_UpdateUserAttribute':
      case 'CustomEmailSender_VerifyUserAttribute':
      case 'CustomEmailSender_AccountTakeOverNotification':
      case 'CustomEmailSender_AdminCreateUser':
        resultEvent = await customEmailSender(
          event as CustomEmailSenderTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent customEmailSender', { resultEvent });
        return resultEvent;

      case 'CreateAuthChallenge_Authentication':
        resultEvent = await createAuthChallenge(
          event as CreateAuthChallengeTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent createAuthChallenge', { resultEvent });
        return resultEvent;

      case 'VerifyAuthChallengeResponse_Authentication':
        resultEvent = await verifyAuthChallenge(
          event as VerifyAuthChallengeResponseTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent verifyAuthChallenge', { resultEvent });
        return resultEvent;

      case 'TokenGeneration_NewPasswordChallenge':
      case 'TokenGeneration_Authentication':
      case 'TokenGeneration_AuthenticateDevice':
      case 'TokenGeneration_RefreshTokens':
        resultEvent = await preTokenGeneration(
          event as PreTokenGenerationTriggerEvent,
          requestId,
          logger
        );
        logger.info('resultEvent TokenGeneration', { resultEvent });
        return resultEvent;

      default:
        logger.error('Evento não tratado', {
          triggerSource,
          requestId: context.awsRequestId,
          event,
        });
        throw new Error(`Evento não tratado: ${triggerSource}`);
    }
  } catch (error: unknown) {
    logger.error('handler', { triggerSource, requestId }, error as Error, { event });
    callback(error as Error, event);
  }
};
