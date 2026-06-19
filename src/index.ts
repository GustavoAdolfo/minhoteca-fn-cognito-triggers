import { createLogger, format, transports } from 'winston';
import {
  defineAuthChallenge,
  postConfirmation,
  preSignUp,
  postAuthentication,
  createAuthChallenge,
  preAuthenticaton,
  customEmailSender,
  verifyAuthChallenge,
  preTokenGeneration,
} from './triggers';

const { timestamp, label, combine } = format;
const formatoLog = combine(
  label({ label: 'minhoteca-cognito-triggers' }),
  timestamp(),
  format.splat(),
  format.json()
);
const logger = createLogger({
  level: 'info',
  format: formatoLog,
  transports: [new transports.Console()],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loggerInspect = (message: string, info: any) => {
  /* istanbul ignore next */
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    info ? logger.info(message, info) : logger.info(message);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export const handler = async (event: any, context: any, callback: any) => {
  loggerInspect('event', { event });

  logger.info(`Starting event handler to trigger ${event.triggerSource}`);

  let resultEvent;

  try {
    const triggerSource = event.triggerSource || event.trigger_source;
    switch (triggerSource) {
      case 'PreSignUp_SignUp':
        try {
          resultEvent = await preSignUp(event, logger);
          loggerInspect('resultEvent preSignUp', { resultEvent });
        } catch (error) {
          logger.error('handler - preSignUp', { error });
        }
        break;
      case 'CustomMessage_SignUp':
        try {
          // resultEvent = await customMessageSignUp(event, logger);
          loggerInspect('resultEvent customMessageSignUp', { resultEvent });
        } catch (error) {
          logger.error('handler - customMessageSignUp', { error });
        }
        break;
      case 'PostConfirmation_ConfirmSignUp':
        try {
          resultEvent = await postConfirmation(event, logger);
          loggerInspect('resultEvent postConfirmation', { resultEvent });
        } catch (error) {
          logger.error('handler - postConfirmation', { error });
        }
        break;
      case 'PreAuthentication_Authentication':
        try {
          resultEvent = await preAuthenticaton(event, logger);
          loggerInspect('resultEvent preAuthenticaton', { resultEvent });
        } catch (error) {
          logger.error('handler - preAuthenticaton', { error });
        }
        break;
      case 'PostAuthentication_Authentication':
        try {
          resultEvent = await postAuthentication(event, logger);
          loggerInspect('resultEvent postAuthentication', { resultEvent });
        } catch (error) {
          logger.error('handler - postAuthentication', { error });
        }
        break;
      case 'DefineAuthChallenge_Authentication':
        try {
          resultEvent = await defineAuthChallenge(event, logger);
          loggerInspect('resultEvent defineAuthChallenge', { resultEvent });
        } catch (error) {
          logger.error('handler - defineAuthChallenge', { error });
        }
        break;
      case 'CustomEmailSender_SignUp':
      case 'CustomEmailSender_ResendCode':
      case 'CustomEmailSender_ForgotPassword':
      case 'CustomEmailSender_UpdateUserAttribute':
      case 'CustomEmailSender_VerifyUserAttribute':
      case 'CustomEmailSender_AccountTakeOverNotification':
      case 'CustomEmailSender_AdminCreateUser':
        try {
          resultEvent = await customEmailSender(event, logger);
          loggerInspect('resultEvent customEmailSender', { resultEvent });
        } catch (error) {
          logger.error('handler - customEmailSender', { error });
        }
        break;
      case 'CreateAuthChallenge_Authentication':
        try {
          resultEvent = await createAuthChallenge(event, logger);
          loggerInspect('resultEvent createAuthChallenge', { resultEvent });
        } catch (error) {
          logger.error('handler - createAuthChallenge', { error });
        }
        break;
      case 'VerifyAuthChallengeResponse_Authentication':
        try {
          resultEvent = await verifyAuthChallenge(event, logger);
          loggerInspect('resultEvent verifyAuthChallenge', { resultEvent });
        } catch (error) {
          logger.error('handler - verifyAuthChallenge', { error });
        }
        break;
      case 'TokenGeneration_NewPasswordChallenge':
      case 'TokenGeneration_Authentication':
      case 'TokenGeneration_AuthenticateDevice':
      case 'TokenGeneration_RefreshTokens':
        try {
          resultEvent = await preTokenGeneration(event, logger);
          loggerInspect('resultEvent preTokenGeneration', { resultEvent });
        } catch (error) {
          logger.error('handler - preTokenGeneration', { error });
        }
        break;
      default:
        break;
    }

    loggerInspect('result event', { resultEvent });

    return resultEvent;
  } catch (error) {
    logger.error('handler', { error });
    callback(new Error(`Erro na execução do evento ${event.triggerSource ?? ''}`), event);
  }
};
