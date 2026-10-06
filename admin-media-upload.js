import { upload } from 'https://esm.sh/@vercel/blob@2.8.1/client?bundle';

const form = document.querySelector('[data-media-upload-form]');
const input = document.querySelector('[data-media-file]');
const button = document.querySelector('[data-media-upload-button]');
const status = document.querySelector('[data-media-upload-status]');

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const maxBytes = 25 * 1024 * 1024;

const safeName = (name = 'rebecca-image') => String(name)
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120) || 'rebecca-image';

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = input?.files?.[0];
  if (!file) return;

  if (!allowed.has(file.type)) {
    status.textContent = 'Use JPG, PNG, WebP or AVIF.';
    return;
  }
  if (file.size > maxBytes) {
    status.textContent = 'Please choose an image under 25 MB.';
    return;
  }

  button.disabled = true;
  status.textContent = 'Preparing upload…';

  try {
    const blob = await upload('rebecca-media/' + safeName(file.name), file, {
      access: 'public',
      handleUploadUrl: '/api/admin/media-upload',
      contentType: file.type,
      multipart: file.size > 5 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => {
        status.textContent = 'Uploading… ' + Math.round(percentage || 0) + '%';
      }
    });

    status.textContent = 'Uploaded. Added to your draft library.';
    input.value = '';
    document.dispatchEvent(new CustomEvent('rc:media-uploaded', {
      detail: {
        url: blob.url,
        pathname: blob.pathname,
        name: file.name,
        contentType: blob.contentType
      }
    }));
  } catch (error) {
    status.textContent = error?.message || 'Upload failed. Nothing was published.';
  } finally {
    button.disabled = false;
  }
});
