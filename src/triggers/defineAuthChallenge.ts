import { DefineAuthChallengeTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';

const defineAuthChallenge = async (
  event: DefineAuthChallengeTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<DefineAuthChallengeTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  if (event.request.userNotFound) {
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
    throw new Error('Usuário não encontrado');
  }

  if (
    event.request.session.length >= 3 &&
    event.request.session.slice(-1)[0].challengeResult === false
  ) {
    // OTP incorreto mesmo após 3 tentativas?
    logger.error('OTP incorreto mesmo após 3 tentativas?');
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
    throw new Error('OTP inválido');
  } else if (
    event.request.session.length > 0 &&
    event.request.session.slice(-1)[0].challengeResult === true
  ) {
    // OTP correto!
    logger.info('OTP correto');
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
    // ainda não recebeu OTP correto
    logger.info('Ainda não recebeu OTP correto');
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
  }

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });

  return event;
};

export { defineAuthChallenge };
