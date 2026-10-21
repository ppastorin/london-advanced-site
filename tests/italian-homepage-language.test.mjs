import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("the Italian homepage contains no untranslated English interface copy", () => {
  const html = fs.readFileSync("dist/it/index.html", "utf8");
  const app = fs.readFileSync("dist/it/app.js", "utf8");
  const renderedForbidden = [
    "Find unusual places and things to do in London",
    "Find unusual things to do",
    "Discuss in the Gruppo Facebook",
    "124 pages",
    "110 unusual things to do and places to see across London",
    "Handpicked walks, small museums",
    "Explore 110 unusual London places",
    "Esplora 110 unusual London places",
    "By subscribing, you agree",
    "Unsubscribe at any time",
    "Subscription is temporarily unavailable",
    "The message could not be sent",
    "Cover of The Other London guide",
    "per person",
    "proposte del weekends",
    ">LIVE<",
    ">NOW +3H<",
    ">FARE CHECK<",
    ">QUIET<",
    ">CURIOUS<"
  ];
  for (const phrase of renderedForbidden) {
    assert.equal(html.toLowerCase().includes(phrase.toLowerCase()), false, phrase);
  }

  const runtimeForbidden = [
    "Please wait a minute before",
    "Enter a valid email address",
    "Help improve London Advanced?",
    "Allow anonymous Google Analytics measurement",
    "No thanks",
    "Allow analytics",
    "Open navigation menu",
    "Main navigation",
    "Newsletter promise"
  ];
  for (const phrase of runtimeForbidden) {
    assert.equal(app.toLowerCase().includes(phrase.toLowerCase()), false, phrase);
  }

  assert.match(html, /Trova luoghi insoliti, organizza spostamenti più intelligenti e scopri l’atmosfera di Londra prima di partire\./);
  assert.match(html, /Una guida sul campo per chi preferisce guardare due volte\./);
  assert.match(html, /Luoghi selezionati, dettagli pratici, fotografie originali e mappe per trovare la Londra che le guide standard trascurano\./);
  assert.match(html, /Scopri la guida →/);
  assert.match(html, /124 pagine/);
  assert.match(app, /Aiutaci a migliorare London Advanced/);
  assert.match(app, /event\.price\.display\.replace/);
});
