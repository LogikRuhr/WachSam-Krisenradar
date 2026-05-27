/**
 * Bürgermaßnahmen — fünf ruhige, praktische Empfehlungen.
 * Keine Panik, keine Extrem-Prepper-Empfehlungen.
 * Kontrollierter Seed-Datensatz.
 */
export const CITIZEN_ACTIONS = [
  {
    id: 'energievertrag-pruefen',
    titel: 'Energievertrag und Tarif prüfen',
    beschreibung:
      'Aktuellen Strom- und Gasvertrag heraussuchen, Endpreis pro kWh notieren und mit aktuellen Tarifen vergleichen. ' +
      'Bei Sondervertrag mit Preisgarantie: Laufzeit, eingeschlossene Preisbestandteile und Kündigungsfrist notieren — Wechsel-Entscheidungen in Ruhe prüfen.',
    bezugZuBereich: ['energie', 'finanzen'],
    aufwand: 'gering',
    causalLinks: [
      {
        id: 'cl-action-energievertrag-pruefen-to-cost-stromsteuer-haushalte',
        targetType: 'costImpact',
        targetId: 'stromsteuer-fuer-haushalte',
        relation: 'mitigates',
      },
      {
        id: 'cl-action-energievertrag-pruefen-to-cost-heizkosten-winter',
        targetType: 'costImpact',
        targetId: 'heizkosten-winter',
        relation: 'mitigates',
      },
    ],
    sources: [
      {
        name: 'Verbraucherzentrale — Strom- und Gastarif finden',
        url: 'https://www.verbraucherzentrale.de/wissen/energie/preise-tarife-anbieterwechsel/so-finden-sie-den-passenden-strom-oder-gastarif-6436',
        stand: '2026',
      },
    ],
  },
  {
    id: 'finanzielle-reserve',
    titel: 'Finanzielle Reserve schrittweise verbessern',
    beschreibung:
      'Ein kurzfristig verfügbarer Notgroschen hilft, Reparaturen, Nachzahlungen oder Preisspitzen ohne Ratenkredit zu überbrücken. ' +
      'Die passende Höhe hängt vom Haushalt ab; schrittweise aufbauen — auch kleine monatliche Beträge wirken.',
    bezugZuBereich: ['finanzen'],
    aufwand: 'mittel',
    causalLinks: [
      {
        id: 'cl-action-finanzielle-reserve-to-cost-gesamtinflation-2026',
        targetType: 'costImpact',
        targetId: 'gesamtinflation-2026',
        relation: 'mitigates',
      },
    ],
    sources: [
      {
        name: 'Sparkasse — Notgroschen',
        url: 'https://www.sparkasse.de/pk/ratgeber/finanzplanung/finanzen-und-haushalt/notgroschen.html',
        stand: '2026',
      },
    ],
  },
  {
    id: 'vorraete-bbk',
    titel: 'Vorräte für rund zwei Wochen sicherstellen',
    beschreibung:
      'Eine moderate Vorratshaltung für Lebensmittel, Trinkwasser und Hygiene über etwa zwei Wochen folgt der allgemeinen Behörden-Empfehlung. ' +
      'Keine Hamsterkäufe — Bestand drehen und regelmäßig nutzen.',
    bezugZuBereich: ['lebensmittel', 'gesundheit'],
    aufwand: 'gering',
    causalLinks: [
      {
        id: 'cl-action-vorraete-bbk-to-cost-lebensmittel-warenkorb',
        targetType: 'costImpact',
        targetId: 'lebensmittel-warenkorb',
        relation: 'mitigates',
      },
    ],
    sources: [
      {
        name: 'Bundesamt für Bevölkerungsschutz und Katastrophenhilfe (BBK)',
        url: 'https://www.bbk.bund.de',
        stand: 'allgemeine Empfehlung',
      },
    ],
  },
  {
    id: 'medikamente-vorrat',
    titel: 'Medikamenten-Vorrat prüfen',
    beschreibung:
      'Verschreibungspflichtige Medikamente rechtzeitig nachbestellen, gerade bei Dauermedikation. ' +
      'Bei wichtigen Präparaten früh mit Arztpraxis oder Apotheke klären, welche medizinisch passende Lösung bei Lieferproblemen vorgesehen ist.',
    bezugZuBereich: ['gesundheit'],
    aufwand: 'minimal',
    causalLinks: [
      {
        id: 'cl-action-medikamente-vorrat-to-supply-medikamente-lieferketten',
        targetType: 'supplyRisk',
        targetId: 'medikamente-lieferketten',
        relation: 'mitigates',
      },
    ],
    sources: [
      {
        name: 'BfArM — Lieferengpässe Humanarzneimittel',
        url: 'https://www.bfarm.de/DE/Arzneimittel/Arzneimittelinformationen/Lieferengpaesse/_verteilerseite.html?nn=471282',
        stand: '2026',
      },
      {
        name: 'Verbraucherzentrale — Medikamente und Beratung',
        url: 'https://www.verbraucherzentrale.de/wissen/gesundheit-pflege/medikamente/alternative-vertriebswege-fuer-arzneimittel-11267',
        stand: '2024',
      },
    ],
  },
  {
    id: 'dokumente-sichern',
    titel: 'Wichtige Dokumente sicher ablegen',
    beschreibung:
      'Personalausweis, Geburtsurkunde, Versicherungs- und Vertragsunterlagen sowie Bankzugänge an zwei Orten greifbar haben — in einem ordentlich beschrifteten Ordner und zusätzlich digital gesichert. ' +
      'Hilfreich bei Stromausfall, Brand oder Behördengang.',
    bezugZuBereich: ['gesellschaft', 'finanzen'],
    aufwand: 'gering',
    causalLinks: [
      {
        id: 'cl-action-dokumente-sichern-to-supply-stromnetz-cyber',
        targetType: 'supplyRisk',
        targetId: 'stromnetz-cyber',
        relation: 'mitigates',
      },
    ],
    sources: [
      {
        name: 'BBK — Ratgeber und Checkliste Vorsorge',
        url: 'https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Ratgeber-Checkliste/ratgeber-checkliste_node.html',
        stand: 'allgemeine Empfehlung',
      },
    ],
  },
] as const;
