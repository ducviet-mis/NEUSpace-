const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_PER_LISTING = 3;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.';
  }

  if (file.size === 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Mỗi ảnh phải có dung lượng từ 1 byte đến 5 MB.';
  }

  return null;
}

export function validateImageSelection(files: File[]): string | null {
  if (files.length > MAX_IMAGES_PER_LISTING) {
    return 'Mỗi bài đăng chỉ được tối đa 3 ảnh.';
  }

  return files.map(validateImageFile).find((message): message is string => Boolean(message)) ?? null;
}

export function createUserScopedImagePath(userId: string, file: File): string {
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}
