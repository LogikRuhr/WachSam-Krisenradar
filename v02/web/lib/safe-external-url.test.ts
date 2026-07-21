import assert from "node:assert/strict";
import { safeExternalUrl } from "./safe-external-url";

assert.equal(safeExternalUrl("https://www.ecb.europa.eu/"), "https://www.ecb.europa.eu/");
assert.equal(safeExternalUrl("javascript:alert(1)"), null);
assert.equal(safeExternalUrl("http://example.org/"), null);
assert.equal(safeExternalUrl("not a url"), null);
