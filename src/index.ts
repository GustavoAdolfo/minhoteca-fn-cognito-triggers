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
  customMessageSignUp,
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
        resultEvent = await preSignUp(event, logger);
        loggerInspect('resultEvent preSignUp', { resultEvent });
        return resultEvent;
      case 'CustomMessage_SignUp':
        resultEvent = await customMessageSignUp(event, logger);
        loggerInspect('resultEvent customMessageSignUp', { resultEvent });
        return resultEvent;
      case 'PostConfirmation_ConfirmSignUp':
        resultEvent = await postConfirmation(event, logger);
        loggerInspect('resultEvent postConfirmation', { resultEvent });
        return resultEvent;
      case 'PreAuthentication_Authentication':
        resultEvent = await preAuthenticaton(event, logger);
        loggerInspect('resultEvent preAuthenticaton', { resultEvent });
        return resultEvent;
      case 'PostAuthentication_Authentication':
        resultEvent = await postAuthentication(event, logger);
        loggerInspect('resultEvent postAuthentication', { resultEvent });
        return resultEvent;
      case 'DefineAuthChallenge_Authentication':
        resultEvent = await defineAuthChallenge(event, logger);
        loggerInspect('resultEvent defineAuthChallenge', { resultEvent });
        return resultEvent;
      case 'CustomEmailSender_SignUp':
      case 'CustomEmailSender_ResendCode':
      case 'CustomEmailSender_ForgotPassword':
      case 'CustomEmailSender_UpdateUserAttribute':
      case 'CustomEmailSender_VerifyUserAttribute':
      case 'CustomEmailSender_AccountTakeOverNotification':
      case 'CustomEmailSender_AdminCreateUser':
        resultEvent = await customEmailSender(event, logger);
        loggerInspect('resultEvent customEmailSender', { resultEvent });
        return resultEvent;
      case 'CreateAuthChallenge_Authentication':
        resultEvent = await createAuthChallenge(event, logger);
        loggerInspect('resultEvent createAuthChallenge', { resultEvent });
        return resultEvent;
      case 'VerifyAuthChallengeResponse_Authentication':
        resultEvent = await verifyAuthChallenge(event, logger);
        loggerInspect('resultEvent verifyAuthChallenge', { resultEvent });
        return resultEvent;
      case 'TokenGeneration_NewPasswordChallenge':
      case 'TokenGeneration_Authentication':
      case 'TokenGeneration_AuthenticateDevice':
      case 'TokenGeneration_RefreshTokens':
        resultEvent = await preTokenGeneration(event, logger);
        loggerInspect('resultEvent preTokenGeneration', { resultEvent });
        return resultEvent;
      default:
        break;
    }
    callback(null, resultEvent || event);
  } catch (error) {
    logger.error('handler', { error });
    callback(new Error(`Erro na execução do evento ${event.triggerSource ?? ''}`), event);
  }
};
