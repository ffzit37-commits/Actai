import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const source = new URL("../web/icon.svg", import.meta.url);
const root = "android/app/src/main/res";
const densities = { "mipmap-mdpi":48, "mipmap-hdpi":72, "mipmap-xhdpi":96, "mipmap-xxhdpi":144, "mipmap-xxxhdpi":192 };
for (const [folder,size] of Object.entries(densities)) {
  const dir = `${root}/${folder}`;
  await mkdir(dir,{recursive:true});
  const png = await sharp(source).resize(size,size).png().toBuffer();
  await sharp(png).toFile(`${dir}/ic_launcher.png`);
  await sharp(png).toFile(`${dir}/ic_launcher_round.png`);
}
console.log("CINEMORA AI launcher icons generated.");
