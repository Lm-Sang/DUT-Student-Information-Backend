import sharp from 'sharp';
import { maxStudentAvatarBytes } from '../repositories/student-avatar.repository.js';

/** Re-encode bounded portraits to strip metadata and keep header/menu transfers small. */
export async function studentAvatarThumbnail(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > maxStudentAvatarBytes) return null;
  try {
    const image = sharp(bytes, { limitInputPixels: 20_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) !== 1) return null;
    return await image.rotate().resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 85 }).toBuffer();
  } catch {
    // A missing/invalid school photo must not break the student session.
    return null;
  }
}
