import assert from "node:assert/strict";
import {
  buildProfileOnboardingSteps,
  buildPublicOnboardingSteps,
  onboardingSummary,
} from "./onboarding";

const initialPublic = buildPublicOnboardingSteps({
  hasProfileInput: false,
  connected: true,
  hasPublishedSignals: true,
  hasResult: true,
  hasNextStep: true,
  hasAction: true,
});

assert.equal(initialPublic[0].status, "active", "Public-Onboarding startet bei der Haushalts-Eingabe");
assert.equal(initialPublic[1].status, "open", "Wirkung wird nicht vor Nutzer-Eingabe als erledigt markiert");
assert.equal(initialPublic[2].status, "open", "Pruefschritt wartet vor Nutzer-Eingabe");
assert.deepEqual(onboardingSummary(initialPublic), { completed: 0, total: 3, label: "0/3 bereit" });

const usefulPublic = buildPublicOnboardingSteps({
  hasProfileInput: true,
  connected: true,
  hasPublishedSignals: true,
  hasResult: true,
  hasNextStep: true,
  hasAction: true,
});

assert.equal(usefulPublic[0].status, "done", "Haushalts-Eingabe ist nach Nutzeraktion bereit");
assert.equal(usefulPublic[1].status, "done", "Vorhandene Wirkung wird nach Nutzeraktion als bereit markiert");
assert.equal(usefulPublic[2].status, "active", "Der naechste Pruefschritt bleibt die aktive Handlung");
assert.match(usefulPublic[2].text, /vorhandene Maßnahme/, "Vorhandene Massnahme wird im aktiven Schritt benannt");
assert.deepEqual(onboardingSummary(usefulPublic), { completed: 2, total: 3, label: "2/3 bereit" });

const blockedPublic = buildPublicOnboardingSteps({
  hasProfileInput: true,
  connected: false,
  hasPublishedSignals: false,
  hasResult: false,
  hasNextStep: true,
  hasAction: false,
});

assert.equal(blockedPublic[1].status, "blocked", "Bei blockiertem Datenpfad gibt es keine Fake-Wirkung");
assert.equal(blockedPublic[2].status, "active", "Ein profilbasierter Pruefschritt bleibt auch ohne Daten nutzbar");
assert.doesNotMatch(blockedPublic[2].text, /vorhandene Maßnahme/, "Ohne echte Massnahme gibt es keinen Fake-Massnahmenhinweis");

const incompleteProfile = buildProfileOnboardingSteps({
  profileFieldsFilled: 1,
  profileFieldsTotal: 3,
  hasRelevantSignals: true,
  hasActions: true,
  hasCheckSteps: true,
});

assert.equal(incompleteProfile[0].status, "active", "Profil-Onboarding beginnt bei unvollstaendigem Profil");
assert.equal(incompleteProfile[1].status, "open", "Lage-Lesen wartet auf Profilvollstaendigkeit");

const completeProfile = buildProfileOnboardingSteps({
  profileFieldsFilled: 3,
  profileFieldsTotal: 3,
  hasRelevantSignals: true,
  hasActions: true,
  hasCheckSteps: true,
});

assert.equal(completeProfile[0].status, "done", "Vollstaendiges Profil ist bereit");
assert.equal(completeProfile[1].status, "done", "Persoenliche Lage ist bereit, wenn Daten vorhanden sind");
assert.equal(completeProfile[2].status, "active", "Massnahmen bleiben aktive naechste Handlung");
assert.equal(completeProfile[3].status, "active", "Pruefliste bleibt aktive naechste Handlung");

console.log("onboarding.test.ts: PASS");
