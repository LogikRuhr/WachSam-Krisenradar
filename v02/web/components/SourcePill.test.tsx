import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SourcePill } from "./SourcePill";

const safeSource = renderToStaticMarkup(
  <SourcePill
    source={{
      sourceName: "Europäische Zentralbank",
      sourceUrl: "https://www.ecb.europa.eu/",
      sourceStand: "17. Juni 2026",
    }}
  />,
);
assert.match(safeSource, /href="https:\/\/www\.ecb\.europa\.eu\//);

const rejectedSource = renderToStaticMarkup(
  <SourcePill
    source={{
      sourceName: "Unzulässige Quelle",
      sourceUrl: "javascript:alert(1)",
      sourceStand: "20. Juli 2026",
    }}
  />,
);
assert.doesNotMatch(rejectedSource, /href=/);
assert.doesNotMatch(rejectedSource, /javascript:/);
