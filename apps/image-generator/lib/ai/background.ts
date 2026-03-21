import path from "node:path";

export function getFixedBackgroundImagePath() {
  return path.join(
    process.cwd(),
    "assets",
    "reference",
    "fuchu-dog-festival.png",
  );
}
