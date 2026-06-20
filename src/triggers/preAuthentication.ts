import { PreAuthenticationTriggerEvent } from 'aws-lambda';
import { LogService } from '@gustavoadolfo/minhoteca-core-layer';

const preAuthentication = async (
  event: PreAuthenticationTriggerEvent,
  requestId: string,
  logger: LogService
): Promise<PreAuthenticationTriggerEvent> => {
  const triggerSource = event.triggerSource;

  logger.info('🏁 Evento iniciado', { requestId, triggerSource }, { event });

  logger.info('✅ Evento finalizado', { requestId, triggerSource }, { event });

  return event;
};

export { preAuthentication };
