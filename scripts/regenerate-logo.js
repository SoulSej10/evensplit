const sharp = require("sharp");
const path = require("path");

const ROOT = "D:/Projects/Claude - OpenCode/EvenSplit";
const SOURCE = "C:/Users/MIS/OneDrive/Pictures/logoSE.png";
const BG = "#0A0A0A";
const PRIMARY = "#35D6B5";

async function main() {
  const master = sharp(SOURCE).resize(2000, 2000, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });

  // 1. logo-mark.png — raw transparent master (web public/)
  await master.clone().png().toFile(path.join(ROOT, "apps/web/public/logo-mark.png"));

  // 2. logo.png — composited on dark bg, padded ~14% so it isn't edge-to-edge (web nav/footer use)
  const paddedOnDark = async (size, padPct) => {
    const inner = Math.round(size * (1 - padPct * 2));
    const mark = await sharp(SOURCE).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
      .composite([{ input: mark, gravity: "center" }])
      .png();
  };

  await (await paddedOnDark(512, 0.14)).toFile(path.join(ROOT, "apps/web/public/logo.png"));
  await (await paddedOnDark(512, 0.14)).toFile(path.join(ROOT, "apps/web/src/app/icon.png"));

  // 3. mobile icon.png / splash-icon.png — same padded-on-dark square, 1024px
  await (await paddedOnDark(1024, 0.16)).toFile(path.join(ROOT, "apps/mobile/assets/icon.png"));
  await (await paddedOnDark(1024, 0.16)).toFile(path.join(ROOT, "apps/mobile/assets/splash-icon.png"));
  await (await paddedOnDark(1024, 0.16)).toFile(path.join(ROOT, "apps/mobile/assets/favicon.png"));

  // 4. android-icon-background.png — flat dark bg, 1024px
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } })
    .png()
    .toFile(path.join(ROOT, "apps/mobile/assets/android-icon-background.png"));

  // 5. android-icon-foreground.png — transparent bg, mark scaled into adaptive-icon safe zone (~66%)
  const fgInner = Math.round(1024 * 0.62);
  const fgMark = await sharp(SOURCE).resize(fgInner, fgInner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fgMark, gravity: "center" }])
    .png()
    .toFile(path.join(ROOT, "apps/mobile/assets/android-icon-foreground.png"));

  // 6. android-icon-monochrome.png — derive silhouette from the REAL alpha channel (not luminance threshold)
  const { data, info } = await sharp(SOURCE)
    .resize(fgInner, fgInner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const a = data[i * 4 + 3];
    out[i * 4] = 255;
    out[i * 4 + 1] = 255;
    out[i * 4 + 2] = 255;
    out[i * 4 + 3] = a;
  }
  const mono = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mono, gravity: "center" }])
    .png()
    .toFile(path.join(ROOT, "apps/mobile/assets/android-icon-monochrome.png"));

  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
