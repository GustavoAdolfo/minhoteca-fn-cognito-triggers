import { VerifyAuthChallengeResponseTriggerEvent } from 'aws-lambda';
import { Logger } from 'winston';

const verifyAuthChallenge = async (
  event: VerifyAuthChallengeResponseTriggerEvent,
  logger: Logger
): Promise<VerifyAuthChallengeResponseTriggerEvent> => {
  if (process.env['ENVIRONMENT']?.toLowerCase() === 'debug') {
    logger.info('Starting verifyAuthChallenge...');
  }
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

  return event;
};

export { verifyAuthChallenge };
