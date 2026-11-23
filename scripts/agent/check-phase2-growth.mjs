import { readFile } from "node:fs/promises";

const checks = [
  ["content/journal/highgate-cemetery.en.json", "Highgate Cemetery Tickets, East and West: Visitor Guide"],
  ["content/journal/buddhapadipa-temple.en.json", "Buddhapadipa Thai Buddhist Temple, Wimbledon: Visitor Guide"],
  ["content/journal/camden-passage.en.json", "Camden Passage Market, Angel: Antiques and Opening Days"],
  ["content/journal/parkland-walk.en.json", "Parkland Walk Route: Finsbury Park to Highgate"],
  ["dist/journal/highgate-cemetery-east-west-guide/index.html", "<title>Highgate Cemetery Tickets, East and West: Visitor Guide</title>"],
  ["dist/journal/buddhapadipa-temple-wimbledon-visit/index.html", "<title>Buddhapadipa Thai Buddhist Temple, Wimbledon: Visitor Guide</title>"],
  ["dist/journal/camden-passage-angel-islington-guide/index.html", "<title>Camden Passage Market, Angel: Antiques and Opening Days</title>"],
  ["dist/journal/parkland-walk-london-lost-railway/index.html", "<title>Parkland Walk Route: Finsbury Park to Highgate</title>"],
  ["dist/home/travel-fare-calculator/index.html", "<title>London Fare Calculator: Oyster vs Contactless | London Advanced</title>"],
  ["dist/home/travel-fare-calculator/index.html", "<h1>London Fare Calculator</h1>"],
  ["dist/loo/index.html", "<title>Public Toilets Near Me in London | London Advanced</title>"],
  ["dist/loo/index.html", "<h1>Find a public toilet near you.</h1>"]
];

let failures = 0;
for (const [file, expected] of checks) {
  const text = await readFile(file, "utf8");
  if (!text.includes(expected)) {
    failures += 1;
    console.error(`FAIL ${file}: missing ${expected}`);
  }
}

console.log(`Phase 2 growth check: ${checks.length - failures}/${checks.length} passed.`);
if (failures) process.exitCode = 1;
