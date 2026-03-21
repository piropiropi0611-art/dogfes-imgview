import removeBackground from "@imgly/background-removal-node";
import sharp from "sharp";

type PreprocessedImage = {
  buffer: Buffer;
  mimeType: string;
};

const ALPHA_THRESHOLD = 8;
const MIN_TRIMMED_AREA = 64;

async function trimTransparentPadding(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer, { animated: false }).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha < ALPHA_THRESHOLD) {
        continue;
      }

      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return buffer;
  }

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;

  if (contentWidth * contentHeight < MIN_TRIMMED_AREA) {
    return buffer;
  }

  const padding = Math.max(
    8,
    Math.round(Math.min(info.width, info.height) * 0.02),
  );
  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const width = Math.min(info.width - left, contentWidth + padding * 2);
  const height = Math.min(info.height - top, contentHeight + padding * 2);

  if (left === 0 && top === 0 && width === info.width && height === info.height) {
    return buffer;
  }

  return sharp(buffer, { animated: false })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}

export async function removeSourceBackgroundLocally(
  sourceImage: Buffer,
  mimeType: string,
): Promise<PreprocessedImage> {
  const sourceArrayBuffer = new ArrayBuffer(sourceImage.byteLength);
  new Uint8Array(sourceArrayBuffer).set(sourceImage);

  const sourceBlob = new Blob([sourceArrayBuffer], {
    type: mimeType || "image/jpeg",
  });

  const blob = await removeBackground(sourceBlob, {
    output: {
      format: "image/png",
      quality: 0.9,
    },
  });

  const arrayBuffer = await blob.arrayBuffer();
  const extractedBuffer = Buffer.from(arrayBuffer);
  const trimmedBuffer = await trimTransparentPadding(extractedBuffer);

  return {
    buffer: trimmedBuffer,
    mimeType: "image/png",
  };
}
