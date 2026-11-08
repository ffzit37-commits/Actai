import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const source = fileURLToPath(new URL("../web/icon.svg", import.meta.url));
const svg = await readFile(source);
const root = "android/app/src/main/res";
const densities = { "mipmap-mdpi":48, "mipmap-hdpi":72, "mipmap-xhdpi":96, "mipmap-xxhdpi":144, "mipmap-xxxhdpi":192 };
for (const [folder,size] of Object.entries(densities)) {
  const dir = `${root}/${folder}`;
  await mkdir(dir,{recursive:true});
  const png = await sharp(svg).resize(size,size).png().toBuffer();
  await sharp(png).toFile(`${dir}/ic_launcher.png`);
  await sharp(png).toFile(`${dir}/ic_launcher_round.png`);
}
console.log("CINEMORA AI launcher icons generated.");
