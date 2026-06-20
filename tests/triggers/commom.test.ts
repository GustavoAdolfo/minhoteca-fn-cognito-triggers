import { jest } from '@jest/globals';
import { createPreSignedUrlLogo, getTemplateEmail } from '../../src/triggers/commom';
import * as s3Proxy from '../../src/proxies/s3-proxy';

describe('createPreSignedUrlLogo', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('fetches the logo URL using the configured environment values', async () => {
    process.env.BUCKET_RESOURCES = 'bucket-resources';
    process.env.LOGO_IMG = 'logo.png';
    process.env.LOGO_CONTENT_TYPE = 'image/png';

    const createPreSignedUrlSpy = jest
      .spyOn(s3Proxy, 'createPreSignedUrlGet')
      .mockResolvedValue('https://signed-logo-url');

    const result = await createPreSignedUrlLogo();

    expect(result).toBe('https://signed-logo-url');
    expect(createPreSignedUrlSpy).toHaveBeenCalledWith('bucket-resources', 'logo.png', 'image/png');
  });

  it('rethrows if generating the logo URL fails', async () => {
    process.env.BUCKET_RESOURCES = 'bucket-resources';
    delete process.env.LOGO_IMG;
    delete process.env.LOGO_CONTENT_TYPE;

    const error = new Error('boom');
    jest.spyOn(s3Proxy, 'createPreSignedUrlGet').mockRejectedValue(error);

    await expect(createPreSignedUrlLogo()).rejects.toThrow('boom');
  });

  it('uses empty defaults when logo environment values are missing', async () => {
    delete process.env.BUCKET_RESOURCES;
    delete process.env.LOGO_IMG;
    delete process.env.LOGO_CONTENT_TYPE;

    const createPreSignedUrlSpy = jest
      .spyOn(s3Proxy, 'createPreSignedUrlGet')
      .mockResolvedValue('https://signed-logo-url-defaults');

    const result = await createPreSignedUrlLogo();

    expect(result).toBe('https://signed-logo-url-defaults');
    expect(createPreSignedUrlSpy).toHaveBeenCalledWith('', '', '');
  });
});

describe('getTemplateEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the template content when the file is available', async () => {
    process.env.BUCKET_TEMPLATES = 'bucket-templates';

    const getTextFileFromS3FileSpy = jest
      .spyOn(s3Proxy, 'getTextFileFromS3File')
      .mockResolvedValue('template-body');

    const result = await getTemplateEmail('welcome.html');

    expect(result).toBe('template-body');
    expect(getTextFileFromS3FileSpy).toHaveBeenCalledWith('bucket-templates', 'welcome.html');
  });

  it('returns undefined when the template content is empty', async () => {
    process.env.BUCKET_TEMPLATES = 'bucket-templates';

    jest.spyOn(s3Proxy, 'getTextFileFromS3File').mockResolvedValue('');

    const result = await getTemplateEmail('welcome.html');

    expect(result).toBeUndefined();
  });

  it('rethrows if reading the template fails', async () => {
    process.env.BUCKET_TEMPLATES = 'bucket-templates';

    const error = new Error('template error');
    jest.spyOn(s3Proxy, 'getTextFileFromS3File').mockRejectedValue(error);

    await expect(getTemplateEmail('welcome.html')).rejects.toThrow('template error');
  });

  it('uses an empty bucket name when BUCKET_TEMPLATES is missing', async () => {
    delete process.env.BUCKET_TEMPLATES;

    const getTextFileFromS3FileSpy = jest
      .spyOn(s3Proxy, 'getTextFileFromS3File')
      .mockResolvedValue('template-body-default-bucket');

    const result = await getTemplateEmail('welcome.html');

    expect(result).toBe('template-body-default-bucket');
    expect(getTextFileFromS3FileSpy).toHaveBeenCalledWith('', 'welcome.html');
  });
});
