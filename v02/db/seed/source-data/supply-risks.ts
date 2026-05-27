/**
 * Versorgungsradar — fünf Bereiche, in denen Versorgung knapper, langsamer
 * oder instabiler werden könnte. Kontrollierter Seed-Datensatz.
 */
export const SUPPLY_RISKS = [
  {
    id: 'gasspeicher-winter',
    bereich: 'energie',
    titel: 'Gasversorgung im kommenden Winter angespannt',
    beschreibung:
      'Die Bundesnetzagentur bewertet Speicherstände im Zusammenspiel mit Importwegen, Verbrauch und Marktflüssen. ' +
      'Für Haushalte ist deshalb weniger ein einzelner Füllstand entscheidend als die Frage, ob Einspeicherung, Wetter und Großhandelspreise vor dem Winter zusammen stabil bleiben.',
    schweregrad: 'beobachten',
    zeithorizont: 'monate',
    confidence: 'mittel',
    unsicherheit:
      'Stark wetter- und marktabhängig. Eine harte Knappheit ist nicht das Basisszenario; Preisspitzen oder regionale Marktdruckphasen bleiben aber möglich.',
    causalLinks: [
      {
        id: 'cl-supply-gasspeicher-winter-to-cost-heizkosten-winter',
        targetType: 'costImpact',
        targetId: 'heizkosten-winter',
        relation: 'drives',
      },
    ],
    sources: [
      {
        name: 'Bundesnetzagentur (via AGSI/GIE)',
        url: 'https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/Versorgungssicherheit/aktuelle_gasversorgung/start.html',
        stand: '2026',
      },
    ],
  },
  {
    id: 'medikamente-lieferketten',
    bereich: 'gesundheit',
    titel: 'Arzneimittelversorgung mit punktuellem Engpass-Risiko',
    beschreibung:
      'Das BfArM dokumentiert und bewertet Lieferengpässe bei Humanarzneimitteln in Deutschland. ' +
      'Für Haushalte mit Dauermedikation bedeutet das vor allem: Rezepte nicht bis zum letzten Tag liegen lassen und bei Ersatzpräparaten früh Apotheke oder Arztpraxis einbeziehen.',
    schweregrad: 'erhoeht',
    zeithorizont: 'wochen',
    confidence: 'mittel',
    unsicherheit:
      'Ein Lieferengpass ist nicht automatisch ein Versorgungsengpass. Betroffenheit bleibt wirkstoff- und produktbezogen; Alternativen müssen medizinisch passend sein.',
    causalLinks: [
      {
        id: 'cl-supply-medikamente-lieferketten-to-action-medikamente-vorrat',
        targetType: 'citizenAction',
        targetId: 'medikamente-vorrat',
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
        name: 'BfArM — FAQ Lieferengpässe',
        url: 'https://www.bfarm.de/DE/Aktuelles/Presse/FAQ/Lieferengpaesse/faq-liste.html',
        stand: '2026',
      },
    ],
  },
  {
    id: 'rohstoffe-china-abhaengigkeit',
    bereich: 'industrie',
    titel: 'Strategische Rohstoffe — hohe China-Abhängigkeit',
    beschreibung:
      'Deutschland und die EU sind bei mehreren kritischen Rohstoffen — Seltene Erden, Magnesium, Gallium — überwiegend von chinesischen Quellen abhängig. ' +
      'Exportrestriktionen verzögern Industrieproduktion und treffen mittelbar Endkundenpreise bei Elektronik, Autos und Haushaltsgeräten.',
    schweregrad: 'erhoeht',
    zeithorizont: 'monate',
    confidence: 'hoch',
    unsicherheit:
      'Aufbau alternativer Quellen läuft, dauert aber Jahre. Kurzfristige Wirkungen über Bestände und Substitution möglich.',
    causalLinks: [
      {
        id: 'cl-supply-rohstoffe-china-to-cascade-b',
        targetType: 'cascade',
        targetId: 'cascade-b',
        relation: 'context',
      },
    ],
    sources: [
      {
        name: 'GTAI',
        url: 'https://www.gtai.de/de/trade/china/specials/so-abhaengig-ist-deutschland-von-china-1775964',
        stand: '2026',
      },
      {
        name: 'BAKS',
        url: 'https://www.baks.bund.de/de/arbeitspapiere/2026/angriff-auf-chinas-rohstoffmonopol-wie-europa-bei-seltenen-erden-co',
        stand: '2026',
      },
    ],
  },
  {
    id: 'duengemittel-ernte',
    bereich: 'lebensmittel',
    titel: 'Düngemittelmarkt mit Preisdruck für Erzeuger',
    beschreibung:
      'Internationale Düngemittelmärkte stehen durch Exportbeschränkungen, Energiepreise und Transportstörungen unter Druck. ' +
      'Für deutsche Haushalte ist der wichtigste Effekt kein unmittelbarer Versorgungsmangel, sondern ein möglicher Kostenimpuls entlang der Lebensmittelkette.',
    schweregrad: 'beobachten',
    zeithorizont: 'monate',
    confidence: 'mittel',
    unsicherheit:
      'Wirkung hängt von Witterung, Lagerbeständen und alternativen Bezugsquellen ab. Ertrags- oder Preisfolgen lassen sich aus den Quellen nicht für einzelne deutsche Warengruppen ableiten.',
    causalLinks: [
      {
        id: 'cl-supply-duengemittel-ernte-to-cost-lebensmittel-warenkorb',
        targetType: 'costImpact',
        targetId: 'lebensmittel-warenkorb',
        relation: 'drives',
      },
    ],
    sources: [
      {
        name: 'FAO — Fertilizer markets',
        url: 'https://www.fao.org/in-focus/fertilizer/en',
        stand: '2026',
      },
      {
        name: 'World Bank — Commodity Markets Outlook',
        url: 'https://thedocs.worldbank.org/en/doc/f3138644a1e8e2bb631399ae11d6c408-0050012026/original/CMO-April-2026.pdf',
        stand: 'April 2026',
      },
    ],
  },
  {
    id: 'stromnetz-cyber',
    bereich: 'infrastruktur',
    titel: 'Stromnetz mit erhöhtem Cyber- und Stabilitätsrisiko',
    beschreibung:
      'Das BSI stuft die Cyberbedrohung für Kritische Infrastrukturen weiterhin hoch ein; der Energiesektor steht dabei besonders im Fokus. ' +
      'Separat bleibt der Netzbetrieb durch Redispatch, Reservebedarf und dezentrale Einspeisung anspruchsvoll — für Haushalte spricht das für Vorbereitung auf kurze lokale Störungen, nicht für Blackout-Erwartungen.',
    schweregrad: 'erhoeht',
    zeithorizont: 'wochen',
    confidence: 'mittel',
    unsicherheit:
      'Die Quellen belegen Cyber- und Netzbetriebsstress, aber keinen direkten Automatismus zu Ausfällen. Lokale, zeitlich begrenzte Störungen bleiben das vorsichtige Haushalts-Szenario.',
    causalLinks: [
      {
        id: 'cl-supply-stromnetz-cyber-to-action-dokumente-sichern',
        targetType: 'citizenAction',
        targetId: 'dokumente-sichern',
        relation: 'mitigates',
      },
    ],
    sources: [
      {
        name: 'BSI — Cybersicherheit im Energiesektor',
        url: 'https://www.bsi.bund.de/DE/Service-Navi/Presse/Pressemitteilungen/Presse2025/250521_Cybersicherheit_Energieversorgung.html',
        stand: 'Mai 2025',
      },
      {
        name: 'Bundesnetzagentur — Netzreserve',
        url: 'https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/Versorgungssicherheit/Netzreserve/artikel.html',
        stand: '2025',
      },
    ],
  },
  {
    id: 'post-paket-qualitaet',
    bereich: 'logistik',
    titel: 'Post- und Paketzustellung mit Qualitätsauffälligkeiten',
    beschreibung:
      'Die Bundesnetzagentur verweist auf Schlichtungs- und Beschwerdeaufkommen im Postbereich sowie auf Daten zur Postversorgung. ' +
      'Für Haushalte und kleine Unternehmen bedeutet das vor allem ein Risiko verspäteter oder unzuverlässiger Zustellung bei Briefen und Paketen.',
    schweregrad: 'beobachten',
    zeithorizont: 'wochen',
    confidence: 'mittel',
    unsicherheit:
      'Die Quellen zeigen Qualitätsauffälligkeiten und Monitoringdaten, aber keine flächendeckende Unterbrechung der Post- oder Paketversorgung.',
    sources: [
      {
        name: 'Bundesnetzagentur — Schlichtung Telekommunikation und Post',
        url: 'https://www.bundesnetzagentur.de/SharedDocs/Pressemitteilungen/DE/2026/20260202_Schlichtung_TK_Post.html',
        stand: '02.02.2026',
      },
      {
        name: 'Bundesnetzagentur — Datenportal Post',
        url: 'https://www.bundesnetzagentur.de/DE/Fachthemen/Datenportal/3_Post/start.html',
        stand: '07.04.2026',
      },
    ],
  },
] as const;
