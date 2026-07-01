from datetime import datetime

from src.models import GermanyRelevance, IngestionItem
from src.relevance_gate import evaluate_wachsam_relevance


def _item(**kwargs):
    defaults = dict(
        title="Gaspreise steigen erneut",
        description="Steigende Gaspreise koennen Heizkosten deutscher Haushalte erhoehen.",
        source_url="https://example.com",
        source_class="qualitaetsmedien",
        last_ingested_at=datetime(2026, 7, 1, 8, 0),
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["energie"],
            time_to_impact="wochen",
            description="Direkte Wirkung auf Deutschland und Haushaltskosten.",
        ),
        methodology_tag="steep",
        affected_systems=["energie"],
        raw_content="",
        status="extracted",
    )
    defaults.update(kwargs)
    return IngestionItem(**defaults)


def test_allows_energy_price_signal_for_households():
    decision = evaluate_wachsam_relevance(_item())
    assert decision.allowed is True
    assert "household_impact" in decision.signals


def test_allows_trump_iran_when_energy_market_path_is_present():
    item = _item(
        title="Trump spricht mit Iran ueber Eskalation am Golf",
        description="Eine Eskalation am Persischen Golf koennte Oelpreise, Diesel und Benzin verteuern.",
        germany_relevance=GermanyRelevance(
            direct=False,
            systems_affected=["energie", "mobilitaet"],
            time_to_impact="kurzfristig",
            description="Indirekte Wirkung auf Deutschland ueber Oelmarkt und Kraftstoffpreise.",
        ),
        affected_systems=["energie", "mobilitaet"],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is True
    assert "geopolitical_market_path" in decision.signals


def test_allows_vw_factory_closure_and_job_loss_signal():
    item = _item(
        title="VW prueft Werksschliessungen und massiven Stellenabbau",
        description="Werksschliessungen in Deutschland wuerden Industrie, Arbeit und Kaufkraft belasten.",
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["industrie", "arbeit"],
            time_to_impact="monate",
            description="Direkte Auswirkung auf deutsche Arbeitsplaetze und regionale Haushalte.",
        ),
        affected_systems=["industrie", "arbeit"],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is True
    assert "structural_impact" in decision.signals


def test_allows_rent_and_contribution_signal():
    item = _item(
        title="Rentenkommission empfiehlt hoehere Beitraege",
        description="Hoehere Rentenbeitraege koennen Nettohaushalte und Kaufkraft belasten.",
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["finanzen", "gesellschaft"],
            time_to_impact="monate",
            description="Direkter Deutschland-Bezug ueber Sozialbeitraege.",
        ),
        affected_systems=["finanzen", "gesellschaft"],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is True


def test_allows_domestic_social_stability_signal():
    item = _item(
        title="Streit ueber Meinungsfreiheit im Bundestag",
        description="Die Debatte kann Vertrauen in Regierung und Demokratie in Deutschland belasten.",
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["gesellschaft"],
            time_to_impact="wochen",
            description="Direkter Deutschland-Bezug ueber gesellschaftliche Spannungen.",
        ),
        affected_systems=["gesellschaft"],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is True
    assert "social_stability_path" in decision.signals


def test_rejects_church_conflict_without_household_path():
    item = _item(
        title="Konflikt zwischen Piusbruedern und dem Papst wegen Bischofsweihe",
        description="Kircheninterner Konflikt ohne erkennbare Wirkung auf Versorgung oder Haushaltskosten.",
        germany_relevance=GermanyRelevance(
            direct=False,
            systems_affected=["gesellschaft"],
            time_to_impact="wochen",
            description="Kein belastbarer Deutschland-Impact.",
        ),
        affected_systems=["gesellschaft"],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is False
    assert decision.reason == "low_relevance_topic"


def test_rejects_dom_entry_fee_without_systemic_impact():
    item = _item(
        title="Einfuehrung von Eintrittsgebuehren am Koelner Dom",
        description="Eine lokale Eintrittsgebuehr fuer Besucher.",
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["gesellschaft"],
            time_to_impact="kurzfristig",
            description="Lokaler Einzelfall ohne Haushalts- oder Versorgungswirkung.",
        ),
        affected_systems=["gesellschaft"],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is False
    assert decision.reason == "low_relevance_topic"


def test_rejects_bundeswehr_reserve_without_household_or_system_impact():
    item = _item(
        title="Verteidigungsminister plant Staerkung der Bundeswehr-Reserve",
        description="Organisatorische Plaene fuer die Reserve.",
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=["gesellschaft"],
            time_to_impact="monate",
            description="Deutschland-Bezug, aber keine konkrete Haushaltswirkung.",
        ),
        affected_systems=["gesellschaft"],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is False
    assert decision.reason == "no_household_or_system_impact"


def test_rejects_item_without_system_area():
    item = _item(
        germany_relevance=GermanyRelevance(
            direct=True,
            systems_affected=[],
            time_to_impact="wochen",
            description="Unklar.",
        ),
        affected_systems=[],
    )
    decision = evaluate_wachsam_relevance(item)
    assert decision.allowed is False
    assert decision.reason == "no_system_area"
