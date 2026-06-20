import { VerifyAuthChallengeResponseTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';

const verifyAuthChallenge = async (
  event: VerifyAuthChallengeResponseTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<VerifyAuthChallengeResponseTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  const expectedAnswer = event.request.privateChallengeParameters?.code?.trim();
  const responseAnswer = event.request.challengeAnswer?.trim();
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('responseAnswer === expectedAnswer', {
      expectedAnswer,
      responseAnswer,
      result: responseAnswer === expectedAnswer,
    });
  }

  if (expectedAnswer && responseAnswer) {
    event.response.answerCorrect = responseAnswer === expectedAnswer;
  } else {
    event.response.answerCorrect = false;
  }

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });

  return event;
};

export { verifyAuthChallenge };
