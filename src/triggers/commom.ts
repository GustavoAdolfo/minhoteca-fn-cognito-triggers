import { Logger } from 'winston';
import { getTextFileFromS3File, createPreSignedUrlGet } from '../proxies/s3-proxy';

export async function createPreSignedUrlLogo(logger: Logger): Promise<string | null> {
  try {
    const bucketName = process.env.BUCKET_RESOURCES ?? '';
    const logoImg = process.env.LOGO_IMG ?? '';
    const logoContentType = process.env.LOGO_CONTENT_TYPE ?? '';
    const url = await createPreSignedUrlGet(bucketName, logoImg, logoContentType);
    return url;
  } catch (error) {
    logger.error('Error in createPreSignedUrlLogo', { error });
    throw error;
  }
}

export async function getTemplateEmail(
  template: string,
  logger: Logger
): Promise<string | undefined> {
  try {
    const bucketName = process.env.BUCKET_TEMPLATES ?? '';
    const templateData = await getTextFileFromS3File(bucketName, template);
    if (!templateData) {
      return undefined;
    }
    return templateData;
  } catch (error) {
    logger.error('Error in getTemplateEmail', { error });
    throw error;
  }
}
