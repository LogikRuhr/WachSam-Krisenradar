from datetime import date

import pytest
from unittest.mock import MagicMock

from src.adapters.destatis import DestatisAdapter
from src.adapters.destatis import parse_vpi_table
from src.adapters.bnetza import BNetzAAdapter
from src.adapters.eia import EIAAdapter
from src.adapters.fred import FREDAdapter
from src.adapters.fao import FAOAdapter
from src.adapters.eurostat import EurostatAdapter
from src.adapters.warning_indicators import WarningIndicatorsAdapter
from src.adapters.tankerkoenig import (
    TankerkoenigAdapter,
    PLZ_BASKET,
    average_fuel_prices,
)


def _validate_items(items):
    """Gemeinsame Validierung für alle Adapter-Items."""
    assert isinstance(items, list)
    assert len(items) >= 1
    for item in items:
        assert item.title
        assert item.source_url.startswith("https://")
        assert item.germany_relevance is not None
        assert item.germany_relevance.direct in (True, False)
        assert len(item.affected_systems) >= 1
        assert item.methodology_tag in ("steep", "rca", "bia", "fmea", "scenario")
        assert item.severity_suggestion in ("stabil", "beobachten", "erhöht", "kritisch", "eskalierend")
        assert item.confidence_suggestion in ("niedrig", "mittel", "hoch")


def test_destatis_adapter():
    adapter = DestatisAdapter()
    assert adapter.name == "Destatis"
    assert adapter.source_class == "behoerde"
    items = adapter.fetch_latest()
    _validate_items(items)
    assert any("destatis.de" in i.source_url for i in items)


def test_parse_vpi_table_extracts_latest_yoy_value():
    table = "\n".join(
        [
            "GENESIS-Tabelle: 61111-0002",
            "Monate;Verbraucherpreisindex;Veränderung zum Vorjahresmonat;Veränderung zum Vormonat",
            "2026-03;120,1;2,2;0,1",
            "2026-04;120,7;2,1;0,4",
        ]
    )

    result = parse_vpi_table(table)

    assert result.current_value == 2.1
    assert result.current_value_date == "2026-04"
    assert result.previous_value == 2.2
    assert result.previous_value_date == "2026-03"


def test_destatis_adapter_maps_vpi_to_indicator_live_value(monkeypatch):
    response = MagicMock()
    response.status_code = 200
    response.text = "\n".join(
        [
            "Monate;Verbraucherpreisindex;Veränderung zum Vorjahresmonat;Veränderung zum Vormonat",
            "2026-03;120,1;2,2;0,1",
            "2026-04;120,7;2,1;0,4",
        ]
    )

    monkeypatch.setattr("src.adapters.destatis.requests.post", lambda *args, **kwargs: response)

    item = DestatisAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-inflation-vpi-de"
    assert item.current_value == 2.1
    assert item.current_value_date == "2026-04"
    assert item.previous_value == 2.2
    assert item.previous_value_date == "2026-03"


def test_bnetza_adapter():
    adapter = BNetzAAdapter()
    assert adapter.name == "BNetzA"
    items = adapter.fetch_latest()
    _validate_items(items)
    assert any("energie" in i.affected_systems for i in items)


def test_bnetza_adapter_parses_gie_data_envelope(monkeypatch):
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {
        "data": [
            {"full": "72.5", "gasDayStart": "2026-05-27"},
            {"full": "71.9", "gasDayStart": "2026-05-26"},
        ],
        "total": 2,
    }

    monkeypatch.setattr("src.adapters.bnetza.requests.get", lambda *args, **kwargs: response)

    item = BNetzAAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-gasspeicher-fuellstand"
    assert item.current_value == 72.5
    assert item.current_value_date == "2026-05-27"
    assert item.previous_value == 71.9
    assert item.previous_value_date == "2026-05-26"


def test_eia_adapter_maps_brent_to_indicator_live_value(monkeypatch):
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {
        "response": {
            "data": [
                {
                    "period": "2026-05-24",
                    "value": "82.45",
                    "series": "RBRTE",
                    "units": "Dollars per Barrel",
                },
                {
                    "period": "2026-05-23",
                    "value": 81.9,
                    "series": "RBRTE",
                    "units": "Dollars per Barrel",
                },
            ]
        }
    }

    monkeypatch.setattr("src.adapters.eia.requests.get", lambda *args, **kwargs: response)

    item = EIAAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-oel-brent"
    assert item.current_value == 82.45
    assert item.current_value_date == "2026-05-24"
    assert item.previous_value == 81.9
    assert item.previous_value_date == "2026-05-23"


def test_fao_adapter():
    adapter = FAOAdapter()
    assert adapter.name == "FAO"
    items = adapter.fetch_latest()
    _validate_items(items)


def test_fao_adapter_maps_food_price_index_to_indicator_live_value(monkeypatch):
    csv_text = "\n".join(
        [
            "FAO Food Price Index",
            "2014-2016=100",
            "Date,Food Price Index,Meat,Dairy,Cereals,Oils,Sugar",
            "",
            "2026-03,126.4,120.1,119.0,111.0,183.1,92.8",
            "2026-04,127.2,121.0,118.0,111.3,193.9,88.5",
        ]
    )
    response = MagicMock()
    response.status_code = 200
    response.text = csv_text
    response.raise_for_status.return_value = None

    monkeypatch.setattr("src.adapters.fao.requests.get", lambda *args, **kwargs: response)

    item = FAOAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-fao-food-price-index"
    assert item.current_value == 127.2
    assert item.current_value_date == "2026-04"
    assert item.previous_value == 126.4
    assert item.previous_value_date == "2026-03"


def test_eurostat_adapter():
    adapter = EurostatAdapter()
    assert adapter.name == "Eurostat"
    items = adapter.fetch_latest()
    _validate_items(items)


def test_warning_indicators_adapter():
    adapter = WarningIndicatorsAdapter()
    assert adapter.name == "WarningIndicators"
    items = adapter.fetch_latest()
    assert isinstance(items, list)


def test_tankerkoenig_basket_has_one_point_per_bundesland():
    adapter = TankerkoenigAdapter()
    assert adapter.name == "Tankerkoenig"
    assert len(PLZ_BASKET) == 16
    assert len({p.land for p in PLZ_BASKET}) == 16


def test_average_fuel_prices_filters_closed_and_invalid():
    stations = [
        {"isOpen": True, "e10": 1.759, "diesel": 1.659},
        {"isOpen": True, "e10": 1.779, "diesel": 1.679},
        {"isOpen": False, "e10": 1.700, "diesel": 1.600},  # geschlossen → ignoriert
        {"isOpen": True, "e10": False, "diesel": 1.689},    # e10 ungueltig → nur diesel
    ]

    result = average_fuel_prices(stations)

    assert result["e10"] == 1.769
    assert result["diesel"] == 1.676
    assert result["station_count"] == 3


def test_average_fuel_prices_empty_when_all_closed():
    stations = [{"isOpen": False, "e10": 1.7, "diesel": 1.6}]
    result = average_fuel_prices(stations)
    assert result["e10"] is None
    assert result["diesel"] is None
    assert result["station_count"] == 0


def _mock_tankerkoenig(monkeypatch, payload):
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = payload
    monkeypatch.setattr("src.adapters.tankerkoenig.settings.TANKERKOENIG_API_KEY", "test-key")
    monkeypatch.setattr("time.sleep", lambda *args, **kwargs: None)
    monkeypatch.setattr("src.adapters.tankerkoenig.requests.get", lambda *args, **kwargs: response)


def test_tankerkoenig_maps_to_indicator_live_values(monkeypatch):
    _mock_tankerkoenig(monkeypatch, {
        "ok": True,
        "stations": [
            {"isOpen": True, "e10": 1.759, "diesel": 1.659},
            {"isOpen": True, "e10": 1.779, "diesel": 1.679},
            {"isOpen": True, "e10": False, "diesel": 1.689},
        ],
    })

    items = TankerkoenigAdapter().fetch_latest()
    by_id = {item.indicator_id: item for item in items}

    assert set(by_id) == {"wi-kraftstoffpreis-super-e10", "wi-kraftstoffpreis-diesel"}

    e10 = by_id["wi-kraftstoffpreis-super-e10"]
    diesel = by_id["wi-kraftstoffpreis-diesel"]
    assert e10.current_value == 1.769
    assert diesel.current_value == 1.676
    assert e10.current_value_date == date.today().isoformat()
    assert e10.previous_value is None
    _validate_items(items)


def test_tankerkoenig_returns_empty_on_api_error(monkeypatch):
    _mock_tankerkoenig(monkeypatch, {"ok": False, "message": "apikey not valid"})
    assert TankerkoenigAdapter().fetch_latest() == []


def test_tankerkoenig_returns_empty_without_api_key(monkeypatch):
    monkeypatch.setattr("src.adapters.tankerkoenig.settings.TANKERKOENIG_API_KEY", "")
    assert TankerkoenigAdapter().fetch_latest() == []


# ---------------------------------------------------------------------------
# FRED — Gaspreis Europa (PNGASEUUSDM)
# ---------------------------------------------------------------------------

def _mock_fred(monkeypatch, payload):
    """Hilfsfunktion: mockt requests.get für den FRED-Adapter."""
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = payload
    monkeypatch.setattr("src.adapters.fred.requests.get", lambda *args, **kwargs: response)


def test_fred_adapter_parses_two_observations(monkeypatch):
    """Zwei gültige Beobachtungen → IngestionItem mit current + previous."""
    _mock_fred(monkeypatch, {
        "observations": [
            {"date": "2026-04-01", "value": "12.34"},
            {"date": "2026-03-01", "value": "11.50"},
        ]
    })

    items = FREDAdapter().fetch_latest()
    assert len(items) == 1
    item = items[0]

    assert item.indicator_id == "wi-gaspreis-europa"
    assert item.current_value == 12.34
    assert item.current_value_date == "2026-04-01"
    assert item.previous_value == 11.50
    assert item.previous_value_date == "2026-03-01"
    _validate_items(items)


def test_fred_adapter_skips_dot_placeholder(monkeypatch):
    """
    FRED markiert fehlende Werte mit ".".
    Der Adapter muss "." überspringen und den nächsten gültigen Wert als current nutzen.
    """
    _mock_fred(monkeypatch, {
        "observations": [
            {"date": "2026-05-01", "value": "."},   # aktuell fehlend → überspringen
            {"date": "2026-04-01", "value": "12.34"},
            {"date": "2026-03-01", "value": "11.50"},
        ]
    })

    item = FREDAdapter().fetch_latest()[0]

    assert item.current_value == 12.34
    assert item.current_value_date == "2026-04-01"
    assert item.previous_value == 11.50


def test_fred_adapter_handles_all_dots(monkeypatch):
    """Alle Werte "." → Fallback-Item (kein Crash), keine indicator_id."""
    _mock_fred(monkeypatch, {
        "observations": [
            {"date": "2026-05-01", "value": "."},
            {"date": "2026-04-01", "value": "."},
        ]
    })

    items = FREDAdapter().fetch_latest()
    assert len(items) == 1
    # Fallback enthält keine indicator_id
    assert items[0].indicator_id is None


def test_fred_adapter_returns_fallback_on_http_error(monkeypatch):
    """HTTP-Fehler → Fallback-Item, kein Crash, leere Liste wird NICHT zurückgegeben."""
    response = MagicMock()
    response.status_code = 503
    monkeypatch.setattr("src.adapters.fred.requests.get", lambda *args, **kwargs: response)

    items = FREDAdapter().fetch_latest()
    assert len(items) == 1
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


def test_fred_adapter_returns_fallback_on_network_exception(monkeypatch):
    """Netzwerkfehler (Exception) → Fallback-Item, kein unkontrollierter Absturz."""
    monkeypatch.setattr(
        "src.adapters.fred.requests.get",
        lambda *args, **kwargs: (_ for _ in ()).throw(ConnectionError("timeout")),
    )

    items = FREDAdapter().fetch_latest()
    assert len(items) == 1
    assert items[0].indicator_id is None
