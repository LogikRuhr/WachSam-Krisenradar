"""Hard relevance gate for LLM-created WachSam Lagebild drafts.

The LLM may suggest structure, but it must not decide what enters the editorial
queue. This module keeps the first blocking decision deterministic and auditable.
"""

from dataclasses import dataclass
from typing import Iterable

from .models import IngestionItem


@dataclass(frozen=True)
class RelevanceDecision:
    allowed: bool
    reason: str
    signals: tuple[str, ...] = ()


GERMANY_TERMS = (
    "deutschland", "deutsch", "bundesregierung", "bundestag", "bundesrat",
    "bundesnetzagentur", "destatis", "buergergeld", "grundsicherung",
    "renten", "rente", "beitrag", "krankenkasse", "europa", "eu",
)

HOUSEHOLD_IMPACT_TERMS = (
    "haushalt", "verbraucher", "kosten", "preis", "preise", "teuer",
    "inflation", "kaufkraft", "strom", "gas", "heiz", "waerme",
    "sprit", "benzin", "diesel", "kraftstoff", "mobilitaet", "miete",
    "rente", "beitraege", "beitrag", "steuer", "abgabe", "lohn",
    "arbeitsplatz", "arbeitsplaetze", "stellenabbau", "jobs",
    "versorgung", "liefer", "lieferkette", "engpass", "rohstoff",
    "lebensmittel", "medikament", "gesundheit", "pflege",
)

STRUCTURAL_TERMS = (
    "energie", "industrie", "produktion", "werk", "werke", "fabrik",
    "insolvenz", "rezession", "bip", "wirtschaft", "export", "import",
    "logistik", "hafen", "schiene", "netz", "infrastruktur", "stromnetz",
    "duerre", "hochwasser", "extremwetter", "ernte", "rohoel", "oel",
    "gaspreis", "oelpreis", "zoelle", "zoll", "sanktion",
)

SOCIAL_STABILITY_TERMS = (
    "gesellschaftliche spannung", "soziale spannung", "protest", "proteste",
    "unruhe", "unruhen", "vertrauen", "regierung", "demokratie",
    "meinungsfreiheit", "brandmauer", "wahl", "streik", "innere sicherheit",
)

GEOPOLITICAL_TERMS = (
    "iran", "hormus", "trump", "usa", "russland", "ukraine", "china",
    "taiwan", "krieg", "konflikt", "sanktion", "zoelle", "zoll",
)

LOW_RELEVANCE_TERMS = (
    "dom", "papst", "bischofsweihe", "piusbrueder", "piusbruedern",
    "kirche", "sport", "fussball", "promi", "royal", "film", "musik",
)

NEGATED_IMPACT_PHRASES = (
    "ohne erkennbare wirkung",
    "ohne konkrete wirkung",
    "ohne haushalts",
    "ohne haushaltswirkung",
    "ohne kostenwirkung",
    "ohne versorgungswirkung",
    "keine konkrete haushalts",
    "keine konkrete haushaltswirkung",
    "kein belastbarer deutschland-impact",
    "kein belastbarer deutschland impact",
    "keine wirkung auf haushalte",
)

CORE_SYSTEMS = {
    "energie", "lebensmittel", "mobilitaet", "gesundheit", "infrastruktur",
    "industrie", "logistik", "finanzen", "arbeit",
}


def _normalize(text: str) -> str:
    return (
        text.casefold()
        .replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
    )


def _contains_any(text: str, terms: Iterable[str]) -> bool:
    normalized_terms = (_normalize(term) for term in terms)
    return any(term in text for term in normalized_terms)


def _item_text(item: IngestionItem) -> str:
    cascades = " ".join(str(cascade.get("chain", "")) for cascade in item.possible_cascades)
    parts = [
        item.title,
        item.description,
        item.germany_relevance.description,
        item.raw_content or "",
        cascades,
    ]
    return _normalize(" ".join(part for part in parts if part))


def evaluate_wachsam_relevance(item: IngestionItem) -> RelevanceDecision:
    """Return whether an extracted item deserves an editorial draft slot."""
    if item.indicator_id:
        return RelevanceDecision(True, "indicator_value", ("indicator",))

    systems = set(item.germany_relevance.systems_affected or item.affected_systems)
    if not systems:
        return RelevanceDecision(False, "no_system_area")

    text = _item_text(item)
    has_germany_path = item.germany_relevance.direct or _contains_any(text, GERMANY_TERMS)
    has_household_impact = _contains_any(text, HOUSEHOLD_IMPACT_TERMS)
    has_structural_impact = bool(systems & CORE_SYSTEMS) and _contains_any(text, STRUCTURAL_TERMS)
    has_social_stability_path = (
        "gesellschaft" in systems and has_germany_path and _contains_any(text, SOCIAL_STABILITY_TERMS)
    )
    has_geo_market_path = _contains_any(text, GEOPOLITICAL_TERMS) and (
        has_household_impact or _contains_any(text, STRUCTURAL_TERMS)
    )
    low_relevance_noise = _contains_any(text, LOW_RELEVANCE_TERMS)
    negated_impact = _contains_any(text, NEGATED_IMPACT_PHRASES)

    signals = []
    if has_germany_path:
        signals.append("germany_path")
    if has_household_impact:
        signals.append("household_impact")
    if has_structural_impact:
        signals.append("structural_impact")
    if has_social_stability_path:
        signals.append("social_stability_path")
    if has_geo_market_path:
        signals.append("geopolitical_market_path")

    if low_relevance_noise and (
        negated_impact
        or not (has_household_impact or has_structural_impact or has_social_stability_path or has_geo_market_path)
    ):
        return RelevanceDecision(False, "low_relevance_topic", tuple(signals))

    if negated_impact and systems == {"gesellschaft"} and not has_geo_market_path:
        return RelevanceDecision(False, "no_household_or_system_impact", tuple(signals))

    if not (has_germany_path or has_geo_market_path):
        return RelevanceDecision(False, "no_germany_or_market_path", tuple(signals))

    if not (has_household_impact or has_structural_impact or has_social_stability_path or has_geo_market_path):
        return RelevanceDecision(False, "no_household_or_system_impact", tuple(signals))

    if systems == {"gesellschaft"} and not (
        has_household_impact or has_structural_impact or has_social_stability_path or has_geo_market_path
    ):
        return RelevanceDecision(False, "society_only_without_household_impact", tuple(signals))

    return RelevanceDecision(True, "wachsam_relevant", tuple(signals))
