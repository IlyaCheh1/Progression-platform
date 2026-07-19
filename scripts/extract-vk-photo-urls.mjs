import fs from "node:fs";

const html = fs.readFileSync(
  "C:/Users/IlyaChekh/.cursor/projects/l-Master-of-Sword/agent-tools/9ad69dc0-ee67-45b6-b262-0912678fbc38.txt",
  "utf8",
);

const re = /article_object_photo__image_blur[^>]+src="([^"]+)"/g;
let i = 0;
for (const match of html.matchAll(re)) {
  i += 1;
  console.log(`${i}: ${match[1]}`);
}
