import { readFile, writeFile } from "node:fs/promises";

async function replaceExact(file, replacements) {
  let text = await readFile(file, "utf8");
  for (const [before, after] of replacements) {
    const matches = text.split(before).length - 1;
    if (matches !== 1) throw new Error(`${file}: expected one match, found ${matches}`);
    text = text.replace(before, after);
  }
  await writeFile(file, text, "utf8");
}

await replaceExact("dist/loo/index.html", [
  [
    'content="Find verified public toilets, free museum facilities, station toilets, department-store toilets and shopping-centre toilets near you in London."',
    'content="Find public toilets near you in London, including verified council, station, museum, department-store and shopping-centre facilities with access details."'
  ],
  ["<title>Find a Public Toilet in London | London Advanced</title>", "<title>Public Toilets Near Me in London | London Advanced</title>"],
  [
    '<h1>Find a loo.</h1><p class="intro">A carefully checked list of public toilets, transport facilities and free-entry venues. No guessing whether a random café will let you in.</p>',
    '<h1>Find a public toilet near you.</h1><p class="intro">Use your location or search a London place to find checked public toilets, transport facilities and free-entry venues nearby.</p>'
  ]
]);

console.log("Phase 2 growth edits applied to the native Loo Finder page.");
