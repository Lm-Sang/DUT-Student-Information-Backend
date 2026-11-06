import { createHash } from 'node:crypto';
import sharp from 'sharp';

function imageType(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  return null;
}

// Central tiles reduce the influence of the background. This is not OCR or a
// document-boundary detector; content completeness still needs human review.
function measure(data, width, height) {
  let sum = 0,
    square = 0;
  const tileScores = [];
  for (const value of data) {
    sum += value;
    square += value * value;
  }
  const mean = sum / data.length;
  const contrast = Math.sqrt(Math.max(0, square / data.length - mean * mean));
  for (let ty = 0; ty < 3; ty++)
    for (let tx = 0; tx < 3; tx++) {
      const x0 = Math.max(1, Math.floor(width * (0.1 + (tx * 0.8) / 3)));
      const x1 = Math.min(width - 1, Math.floor(width * (0.1 + ((tx + 1) * 0.8) / 3)));
      const y0 = Math.max(1, Math.floor(height * (0.1 + (ty * 0.8) / 3)));
      const y1 = Math.min(height - 1, Math.floor(height * (0.1 + ((ty + 1) * 0.8) / 3)));
      let n = 0,
        lap = 0,
        lap2 = 0,
        pixel = 0,
        pixel2 = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = y * width + x,
            p = data[i];
          const v = 4 * p - data[i - 1] - data[i + 1] - data[i - width] - data[i + width];
          n++;
          lap += v;
          lap2 += v * v;
          pixel += p;
          pixel2 += p * p;
        }
      if (n && Math.sqrt(Math.max(0, pixel2 / n - (pixel / n) ** 2)) >= 8) {
        tileScores.push(Math.max(0, lap2 / n - (lap / n) ** 2));
      }
    }
  tileScores.sort((a, b) => a - b);
  return {
    meanBrightness: mean,
    contrast,
    laplacianVariance: tileScores[Math.floor(tileScores.length / 2)] ?? 0,
    informativeTiles: tileScores.length,
  };
}

export function createDocumentImageInspector(config) {
  return async function inspect(bytes, declaredContentType) {
    const contentType = imageType(bytes) ?? 'application/octet-stream';
    const result = {
      contentType,
      sizeBytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      widthPixels: null,
      heightPixels: null,
      pageCount: 1,
      algorithmName: 'central-tile-laplacian',
      algorithmVersion: '1',
      configuration: {
        maxPixels: config.maxPixels,
        minImageSide: config.minImageSide,
        blurThreshold: config.blurThreshold,
        normalizedMaxSide: 1200,
      },
      metrics: {},
      reasons: [],
      status: 'needs_review',
    };
    const fail = (code) => {
      result.status = 'failed';
      result.reasons.push(code);
      return result;
    };
    if (!['image/png', 'image/jpeg'].includes(contentType)) return fail('UNSUPPORTED_FILE_CONTENT');
    if (contentType !== declaredContentType) return fail('CONTENT_TYPE_MISMATCH');
    try {
      const input = sharp(bytes, { limitInputPixels: config.maxPixels, failOn: 'warning' });
      const metadata = await input.metadata();
      if ((metadata.pages ?? 1) !== 1) return fail('MULTIPAGE_IMAGE_NOT_SUPPORTED');
      const { data, info } = await input
        .rotate()
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' })
        .greyscale()
        .raw()
        .timeout({ seconds: 10 })
        .toBuffer({ resolveWithObject: true });
      const rotated = metadata.orientation >= 5;
      result.widthPixels = rotated ? metadata.height : metadata.width;
      result.heightPixels = rotated ? metadata.width : metadata.height;
      if (Math.min(result.widthPixels, result.heightPixels) < config.minImageSide)
        return fail('IMAGE_TOO_SMALL');
      result.metrics = measure(data, info.width, info.height);
      if (result.metrics.contrast < 3) return fail('IMAGE_HAS_NO_READABLE_DETAIL');
      if (config.blurThreshold > 0 && result.metrics.laplacianVariance < config.blurThreshold)
        return fail('IMAGE_TOO_BLURRY');
      if (config.blurThreshold === 0) result.reasons.push('BLUR_THRESHOLD_NOT_CALIBRATED');
      if (result.metrics.meanBrightness < 25) result.reasons.push('IMAGE_MAY_BE_TOO_DARK');
      result.reasons.push('DOCUMENT_CONTENT_REVIEW_REQUIRED');
      // A readable image is not proof of a genuine certificate. Without a real
      // calibrated dataset do not label borderline images as automatically passed.
      return result;
    } catch {
      return fail('IMAGE_CANNOT_BE_DECODED');
    }
  };
}
