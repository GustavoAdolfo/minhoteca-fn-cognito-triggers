import { getTextFileFromS3File, createPreSignedUrlGet } from '../proxies/s3-proxy';

export async function createPreSignedUrlLogo(): Promise<string | null> {
  const bucketName = process.env.BUCKET_RESOURCES ?? '';
  const logoImg = process.env.LOGO_IMG ?? '';
  const logoContentType = process.env.LOGO_CONTENT_TYPE ?? '';
  const url = await createPreSignedUrlGet(bucketName, logoImg, logoContentType);
  return url;
}

export async function getTemplateEmail(template: string): Promise<string | undefined> {
  const bucketName = process.env.BUCKET_TEMPLATES ?? '';
  const templateData = await getTextFileFromS3File(bucketName, template);
  if (!templateData) {
    return undefined;
  }
  return templateData;
}
