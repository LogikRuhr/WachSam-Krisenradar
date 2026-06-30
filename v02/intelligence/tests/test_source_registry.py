from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "source_registry.yaml"

REQUIRED_SOURCE_FIELDS = {
    "id",
    "name",
    "layer",
    "operator",
    "source_url",
    "status",
    "format",
    "auth_required",
    "freshness_expectation",
    "household_relevance",
    "current_quality",
    "risk_notes",
    "next_step",
}


def load_registry():
    with REGISTRY.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def test_source_registry_schema_and_references():
    registry = load_registry()
    assert registry["version"] == 1

    status_values = set(registry["status_values"])
    layers = {layer["id"] for layer in registry["layers"]}
    sources = registry["sources"]

    assert layers
    assert sources
    assert len({source["id"] for source in sources}) == len(sources)

    for source in sources:
        missing = REQUIRED_SOURCE_FIELDS - set(source)
        assert not missing, f"{source.get('id', '<missing id>')} missing fields: {sorted(missing)}"
        assert source["layer"] in layers
        assert source["status"] in status_values
        assert source["source_url"].startswith("https://")
        assert source["household_relevance"] in {"niedrig", "mittel", "hoch"}


def test_source_registry_tracks_current_and_candidate_basis():
    sources = {source["id"]: source for source in load_registry()["sources"]}

    for required in [
        "destatis-vpi",
        "gie-agsi-gas-storage",
        "eia-brent",
        "fred-eu-gas",
        "fao-food-price-index",
        "tankerkoenig-fuel",
        "dwd-open-data",
        "pegelonline",
    ]:
        assert required in sources

    assert sources["pegelonline"]["status"] == "active"
    assert sources["pegelonline"]["adapter"] == "src.adapters.pegelonline.PegelonlineAdapter"
    assert sources["dwd-open-data"]["status"] == "active"
    assert sources["dwd-open-data"]["adapter"] == "src.adapters.dwd.DWDAdapter"
    assert sources["dwd-open-data"]["indicator_ids"] == ["wi-dwd-warnings-de"]
    assert sources["smard"]["status"] == "blocked-until-docs"
    assert sources["destatis-vpi"]["current_quality"] == "live-dry-run-ok-with-html-fallback-2026-06-30"
    assert sources["fred-eu-gas"]["current_quality"] == "live-dry-run-ok-with-key"
