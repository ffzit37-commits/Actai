import { cp, mkdir, rm } from "node:fs/promises";
await rm("www", { recursive: true, force: true });
await mkdir("www", { recursive: true });
await cp("web", "www", { recursive: true });
console.log("MOH AI CINEMA web assets prepared.");
