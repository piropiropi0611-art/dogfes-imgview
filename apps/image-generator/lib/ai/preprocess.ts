import removeBackground from "@imgly/background-removal-node";

type PreprocessedImage = {
  buffer: Buffer;
  mimeType: string;
};

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

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: blob.type || "image/png",
  };
}
