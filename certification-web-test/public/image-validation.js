const defaults = Object.freeze({
  maxFiles: 1, maxFileBytes: 10485760, maxPixels: 40000000, minImageSide: 600, blurThreshold: 0,
});

function reject(file, message) { throw new Error(file.name + ': ' + message); }

export function evidenceContentType(file) {
  const type=(file.type??'').trim().toLowerCase();
  if(type==='image/jpg')return 'image/jpeg';
  if(type)return type;
  if(/\.jpe?g$/i.test(file.name))return 'image/jpeg';
  if(/\.png$/i.test(file.name))return 'image/png';
  return '';
}

// Decode locally and normalize the image before measuring document detail.
async function decodeImage(file, limits) {
  let bitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { reject(file, 'Không đọc được ảnh. Hãy chọn ảnh PNG hoặc JPEG hợp lệ.'); }
  try {
    const { width, height } = bitmap;
    if (width * height > limits.maxPixels) reject(file, 'Ảnh vượt giới hạn ' + limits.maxPixels + ' pixel.');
    if (Math.min(width, height) < limits.minImageSide)
      reject(file, 'Cạnh ngắn nhất phải từ ' + limits.minImageSide + ' pixel.');
    const scale = Math.min(1, 1200 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const data = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < data.length; i++)
      data[i] = Math.round(0.2126 * rgba[i * 4] + 0.7152 * rgba[i * 4 + 1] + 0.0722 * rgba[i * 4 + 2]);
    return { width, height, data, normalizedWidth: canvas.width, normalizedHeight: canvas.height };
  } finally { bitmap.close(); }
}

// Same central-tile Laplacian heuristic as the server; decoding/resizing can
// differ between browsers and sharp. The server remains authoritative at complete.
function measure(data, width, height) {
  let sum = 0, square = 0;
  const scores = [];
  for (const value of data) { sum += value; square += value * value; }
  const mean = sum / data.length;
  for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 3; tx++) {
    const x0 = Math.max(1, Math.floor(width * (0.1 + tx * 0.8 / 3)));
    const x1 = Math.min(width - 1, Math.floor(width * (0.1 + (tx + 1) * 0.8 / 3)));
    const y0 = Math.max(1, Math.floor(height * (0.1 + ty * 0.8 / 3)));
    const y1 = Math.min(height - 1, Math.floor(height * (0.1 + (ty + 1) * 0.8 / 3)));
    let n = 0, lap = 0, lap2 = 0, pixel = 0, pixel2 = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = y * width + x, p = data[i];
      const value = 4 * p - data[i - 1] - data[i + 1] - data[i - width] - data[i + width];
      n++; lap += value; lap2 += value * value; pixel += p; pixel2 += p * p;
    }
    if (n && Math.sqrt(Math.max(0, pixel2 / n - (pixel / n) ** 2)) >= 8)
      scores.push(Math.max(0, lap2 / n - (lap / n) ** 2));
  }
  scores.sort((a, b) => a - b);
  return { contrast: Math.sqrt(Math.max(0, square / data.length - mean * mean)),
    laplacianVariance: scores[Math.floor(scores.length / 2)] ?? 0 };
}

export async function validateEvidenceFiles(files, options = {}, { decode = decodeImage } = {}) {
  const limits = { ...defaults, ...options };
  if (files.length !== 1) throw new Error('Chọn đúng một file minh chứng.');
  const contentTypes = [];
  // Validate the entire selection before requesting any upload URLs.
  for (const file of files) {
    const contentType=evidenceContentType(file);
    if (!['image/png', 'image/jpeg'].includes(contentType)) reject(file, 'Chỉ nhận JPG, JPEG hoặc PNG.');
    if (!file.size || file.size > limits.maxFileBytes)
      reject(file, 'Dung lượng phải từ 1 byte đến ' + limits.maxFileBytes + ' byte.');
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!png && !jpeg)
      reject(file, 'Nội dung ảnh không phải JPG/JPEG/PNG hợp lệ. Hãy xuất lại ảnh đúng định dạng.');
    // File names and browser MIME hints can be wrong. Sign the upload using
    // the actual supported format; retain the original name and image bytes.
    contentTypes.push(png ? 'image/png' : 'image/jpeg');
    const image = await decode(file, limits);
    if (image.width * image.height > limits.maxPixels) reject(file, 'Ảnh vượt giới hạn số pixel.');
    if (Math.min(image.width, image.height) < limits.minImageSide)
      reject(file, 'Cạnh ngắn nhất phải từ ' + limits.minImageSide + ' pixel.');
    const metrics = measure(image.data, image.normalizedWidth, image.normalizedHeight);
    if (metrics.contrast < 3) reject(file, 'Ảnh không có đủ chi tiết đọc được.');
    if (limits.blurThreshold > 0 && metrics.laplacianVariance < limits.blurThreshold)
      reject(file, 'Ảnh quá mờ. Hãy chụp lại rõ thông tin chứng chỉ.');
  }
  return contentTypes;
}
