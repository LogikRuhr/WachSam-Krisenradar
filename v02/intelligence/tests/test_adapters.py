from datetime import date
from io import BytesIO
from zipfile import ZipFile

import pytest
from unittest.mock import MagicMock

from src.adapters.destatis import DestatisAdapter
from src.adapters.destatis import decode_genesis_table_response
from src.adapters.destatis import parse_vpi_table
from src.adapters.bnetza import BNetzAAdapter
from src.adapters.eia import EIAAdapter
from src.adapters.fred import FREDAdapter
from src.adapters.fao import FAOAdapter
from src.adapters.pegelonline import PegelonlineAdapter
from src.adapters.dwd import DWDAdapter, decode_warnwetter_response, summarize_warnings
from src.adapters.eurostat import EurostatAdapter
from src.adapters.warning_indicators import WarningIndicatorsAdapter
from src.adapters.tankerkoenig import (
    TankerkoenigAdapter,
    PLZ_BASKET,
    average_fuel_prices,
)
from src.adapters.bip import BIPAdapter, parse_eurostat_jsonstat
from src.adapters.arbeitslosigkeit import ArbeitslosigkeitAdapter, parse_arbeitslosigkeit_table
from src.adapters.ezbleitzins import EZBLeitzinsAdapter, parse_ecb_sdw_jsondata
from src.adapters.staatsschulden import StaatsschuldenAdapter, parse_eurostat_debt
from src.adapters.insolvenzen import InsolvenzenAdapter, parse_insolvenzen_html, parse_insolvenzen_table


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


@pytest.mark.live
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


def test_parse_vpi_table_extracts_latest_yoy_value_from_genesis_year_month_rows():
    table = "\n".join(
        [
            "Tabelle: 61111-0002",
            "Verbraucherpreisindex: Deutschland, Monate;;;;",
            ";;Verbraucherpreisindex;Veränderung zum Vorjahresmonat;Veränderung zum Vormonat",
            ";;2020=100;in (%);in (%)",
            "2026;März;124,5;+2,7;+1,1",
            "2026;April;125,2;+2,9;+0,6",
            "2026;Mai;...;...;...",
        ]
    )

    result = parse_vpi_table(table)

    assert result.current_value == 2.9
    assert result.current_value_date == "2026-04"
    assert result.previous_value == 2.7
    assert result.previous_value_date == "2026-03"


def test_decode_genesis_table_response_reads_zipped_csv():
    csv_text = "Monate;Veränderung zum Vorjahresmonat\n2026-04;2,9\n"
    buffer = BytesIO()
    with ZipFile(buffer, "w") as archive:
        archive.writestr("61111-0002_de.csv", csv_text.encode("utf-8"))

    assert decode_genesis_table_response(buffer.getvalue(), "fallback") == csv_text


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
    response.content = response.text.encode("utf-8")

    monkeypatch.setattr("src.adapters.destatis.requests.post", lambda *args, **kwargs: response)

    item = DestatisAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-inflation-vpi-de"
    assert item.current_value == 2.1
    assert item.current_value_date == "2026-04"
    assert item.previous_value == 2.2
    assert item.previous_value_date == "2026-03"
    assert item.source_stand_date == "2026-04"
    assert item.source_period_type == "month"


@pytest.mark.live
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
    assert item.source_stand_date == "2026-05-27"
    assert item.source_period_type == "date"


def test_eia_adapter_maps_brent_to_indicator_live_value(monkeypatch):
    # Gültiger Key gesetzt, damit der defensive Key-Guard durchlässt und der
    # gemockte Erfolgspfad geprüft wird (nicht der api_key_missing-Fallback).
    monkeypatch.setattr("src.adapters.eia.settings.EIA_API_KEY", "test-key")
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
    assert item.source_stand_date == "2026-05-24"
    assert item.source_period_type == "date"


@pytest.mark.live
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
    assert item.source_stand_date == "2026-04"
    assert item.source_period_type == "month"


@pytest.mark.live
def test_eurostat_adapter():
    adapter = EurostatAdapter()
    assert adapter.name == "Eurostat"
    items = adapter.fetch_latest()
    _validate_items(items)


@pytest.mark.live
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
        {"isOpen": True, "e5": 1.819, "e10": 1.759, "diesel": 1.659},
        {"isOpen": True, "e5": 1.839, "e10": 1.779, "diesel": 1.679},
        {"isOpen": False, "e5": 1.800, "e10": 1.700, "diesel": 1.600},  # geschlossen → ignoriert
        {"isOpen": True, "e5": False, "e10": False, "diesel": 1.689},   # Benzin ungueltig → nur diesel
    ]

    result = average_fuel_prices(stations)

    assert result["e5"] == 1.829
    assert result["e10"] == 1.769
    assert result["diesel"] == 1.676
    assert result["station_count"] == 3


def test_average_fuel_prices_empty_when_all_closed():
    stations = [{"isOpen": False, "e5": 1.8, "e10": 1.7, "diesel": 1.6}]
    result = average_fuel_prices(stations)
    assert result["e5"] is None
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
            {"isOpen": True, "e5": 1.819, "e10": 1.759, "diesel": 1.659},
            {"isOpen": True, "e5": 1.839, "e10": 1.779, "diesel": 1.679},
            {"isOpen": True, "e5": False, "e10": False, "diesel": 1.689},
        ],
    })

    items = TankerkoenigAdapter().fetch_latest()
    by_id = {item.indicator_id: item for item in items}

    assert set(by_id) == {
        "wi-kraftstoffpreis-super-e5",
        "wi-kraftstoffpreis-super-e10",
        "wi-kraftstoffpreis-diesel",
    }

    e5 = by_id["wi-kraftstoffpreis-super-e5"]
    e10 = by_id["wi-kraftstoffpreis-super-e10"]
    diesel = by_id["wi-kraftstoffpreis-diesel"]
    assert e5.current_value == 1.829
    assert e10.current_value == 1.769
    assert diesel.current_value == 1.676
    assert e10.current_value_date == date.today().isoformat()
    assert e10.source_stand_date == date.today().isoformat()
    assert e10.source_period_type == "date"
    assert e10.previous_value is None
    _validate_items(items)


def test_tankerkoenig_returns_empty_on_api_error(monkeypatch):
    _mock_tankerkoenig(monkeypatch, {"ok": False, "message": "apikey not valid"})
    assert TankerkoenigAdapter().fetch_latest() == []


def test_tankerkoenig_returns_empty_without_api_key(monkeypatch):
    monkeypatch.setattr("src.adapters.tankerkoenig.settings.TANKERKOENIG_API_KEY", "")
    assert TankerkoenigAdapter().fetch_latest() == []


# ---------------------------------------------------------------------------
# Pegelonline — Wasserstände wichtiger Wasserstraßen
# ---------------------------------------------------------------------------

def test_pegelonline_adapter_maps_current_measurements(monkeypatch):
    payloads = {
        "KÖLN": {
            "timestamp": "2026-06-09T15:00:00+02:00",
            "value": 196.0,
            "stateMnwMhw": "normal",
            "stateNswHsw": "normal",
        },
        "KAUB": {
            "timestamp": "2026-06-09T15:00:00+02:00",
            "value": 134.0,
            "stateMnwMhw": "low",
            "stateNswHsw": "unknown",
        },
    }
    called = []

    def fake_get(url, *args, **kwargs):
        called.append(url)
        station = "KÖLN" if "K%C3%96LN" in url else "KAUB"
        response = MagicMock()
        response.status_code = 200
        response.json.return_value = payloads[station]
        response.raise_for_status.return_value = None
        return response

    monkeypatch.setattr("src.adapters.pegelonline.requests.get", fake_get)
    monkeypatch.setattr("src.adapters.pegelonline.PEGEL_STATIONS", ("KÖLN", "KAUB"))

    items = PegelonlineAdapter().fetch_latest()
    by_id = {item.indicator_id: item for item in items}

    assert set(by_id) == {"wi-pegelonline-koeln", "wi-pegelonline-kaub"}
    koeln = by_id["wi-pegelonline-koeln"]
    kaub = by_id["wi-pegelonline-kaub"]
    assert koeln.current_value == 196.0
    assert koeln.current_value_date == "2026-06-09T15:00:00+02:00"
    assert koeln.source_stand_date == "2026-06-09T15:00:00+02:00"
    assert koeln.source_period_type == "datetime"
    assert koeln.severity_suggestion == "stabil"
    assert kaub.current_value == 134.0
    assert kaub.severity_suggestion == "beobachten"
    assert "logistik" in kaub.affected_systems
    assert all("pegelonline.wsv.de" in url for url in called)
    _validate_items(items)


def test_pegelonline_records_source_error_on_http_failure(monkeypatch):
    response = MagicMock()
    response.status_code = 503
    response.raise_for_status.side_effect = RuntimeError("HTTP 503")
    monkeypatch.setattr("src.adapters.pegelonline.requests.get", lambda *args, **kwargs: response)
    monkeypatch.setattr("src.adapters.pegelonline.PEGEL_STATIONS", ("KÖLN",))

    adapter = PegelonlineAdapter()
    assert adapter.fetch_latest() == []
    assert adapter.source_errors == [
        {
            "indicator_id": "wi-pegelonline-koeln",
            "reason": "HTTP 503",
            "source_url": "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/K%C3%96LN/W/currentmeasurement.json",
            "source_stand": None,
            "observed_at": None,
            "raw_value": None,
            "keep_previous": True,
        }
    ]


def test_dwd_adapter_maps_warnwetter_jsonp_to_indicator(monkeypatch):
    payload = (
        'warnWetter.loadWarnings({"time":1781059980000,"warnings":{'
        '"109172000":[{"state":"Bayern","type":2,"level":3,'
        '"start":1780977600000,"regionName":"Kreis Berchtesgadener Land",'
        '"end":1781128800000,"description":"Dauerregen",'
        '"event":"DAUERREGEN","headline":"Amtliche WARNUNG vor DAUERREGEN",'
        '"instruction":"Straßenverkehr anpassen","stateShort":"BY"}],'
        '"105154000":[{"state":"Niedersachsen","type":2,"level":4,'
        '"start":1780977600000,"regionName":"Kreis Friesland",'
        '"end":1781128800000,"description":"Gewitter",'
        '"event":"GEWITTER","headline":"Amtliche WARNUNG vor GEWITTER",'
        '"instruction":"Aufenthalt im Freien vermeiden","stateShort":"NI"}]},'
        '"vorabInformation":{},"copyright":"DWD"});'
    )
    response = MagicMock()
    response.status_code = 200
    response.text = payload
    response.raise_for_status.return_value = None
    monkeypatch.setattr("src.adapters.dwd.requests.get", lambda *args, **kwargs: response)

    items = DWDAdapter().fetch_latest()

    assert len(items) == 1
    item = items[0]
    assert item.indicator_id == "wi-dwd-warnings-de"
    assert item.current_value == 4.0
    assert item.severity_suggestion == "kritisch"
    assert item.current_value_date == "2026-06-10T02:53:00+00:00"
    assert item.source_stand_date == "2026-06-10T02:53:00+00:00"
    assert item.source_period_type == "datetime"
    assert "aktive Warnungen" in item.title
    assert "infrastruktur" in item.affected_systems
    _validate_items(items)


def test_dwd_decode_accepts_plain_json_and_summarizes_empty_warning_set():
    payload = decode_warnwetter_response('{"time":1781059980000,"warnings":{}}')
    summary = summarize_warnings(payload)

    assert summary["generated_at"] == "2026-06-10T02:53:00+00:00"
    assert summary["warning_count"] == 0
    assert summary["max_level"] == 0


def test_dwd_adapter_records_source_error_on_http_failure(monkeypatch):
    response = MagicMock()
    response.status_code = 503
    response.raise_for_status.side_effect = RuntimeError("HTTP 503")
    monkeypatch.setattr("src.adapters.dwd.requests.get", lambda *args, **kwargs: response)

    adapter = DWDAdapter()
    assert adapter.fetch_latest() == []
    assert adapter.source_errors == [
        {
            "indicator_id": "wi-dwd-warnings-de",
            "reason": "HTTP 503",
            "source_url": "https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json",
            "source_stand": None,
            "observed_at": None,
            "raw_value": None,
            "keep_previous": True,
        }
    ]


# ---------------------------------------------------------------------------
# FRED — Gaspreis Europa (PNGASEUUSDM)
# ---------------------------------------------------------------------------

def _mock_fred(monkeypatch, payload):
    """Hilfsfunktion: mockt requests.get für den FRED-Adapter."""
    # Gültiger Key, damit der defensive Key-Guard durchlässt und der gemockte
    # Pfad geprüft wird (nicht der api_key_missing-Fallback).
    monkeypatch.setattr("src.adapters.fred.settings.FRED_API_KEY", "test-key")
    called = {}

    def fake_get(url, *args, **kwargs):
        called["url"] = url
        response = MagicMock()
        response.status_code = 200
        response.json.return_value = payload
        return response

    monkeypatch.setattr("src.adapters.fred.requests.get", fake_get)
    return called


def test_fred_adapter_parses_two_observations(monkeypatch):
    """Zwei gültige Beobachtungen → IngestionItem mit current + previous."""
    called = _mock_fred(monkeypatch, {
        "observations": [
            {"date": "2026-04-01", "value": "12.34"},
            {"date": "2026-03-01", "value": "11.50"},
        ]
    })

    items = FREDAdapter().fetch_latest()

    assert called["url"].startswith("https://api.stlouisfed.org/")
    assert len(items) == 1
    item = items[0]

    assert item.indicator_id == "wi-gaspreis-europa"
    assert item.current_value == 12.34
    assert item.current_value_date == "2026-04-01"
    assert item.previous_value == 11.50
    assert item.previous_value_date == "2026-03-01"
    assert item.source_stand_date == "2026-04-01"
    assert item.source_period_type == "month"
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
    # Gültiger Key gesetzt: Test prüft bewusst den HTTP-Fehlerpfad, nicht den Key-Guard.
    monkeypatch.setattr("src.adapters.fred.settings.FRED_API_KEY", "test-key")
    response = MagicMock()
    response.status_code = 503
    monkeypatch.setattr("src.adapters.fred.requests.get", lambda *args, **kwargs: response)

    items = FREDAdapter().fetch_latest()
    assert len(items) == 1
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


def test_fred_adapter_returns_fallback_on_network_exception(monkeypatch):
    """Netzwerkfehler (Exception) → Fallback-Item, kein unkontrollierter Absturz."""
    # Gültiger Key gesetzt: Test prüft bewusst den Netzwerk-Fehlerpfad, nicht den Key-Guard.
    monkeypatch.setattr("src.adapters.fred.settings.FRED_API_KEY", "test-key")
    monkeypatch.setattr(
        "src.adapters.fred.requests.get",
        lambda *args, **kwargs: (_ for _ in ()).throw(ConnectionError("timeout")),
    )

    items = FREDAdapter().fetch_latest()
    assert len(items) == 1
    assert items[0].indicator_id is None


# ---------------------------------------------------------------------------
# BIP-Wachstum — Eurostat namq_10_gdp
# ---------------------------------------------------------------------------

_BIP_EUROSTAT_RESPONSE = {
    "dimension": {
        "time": {
            "category": {
                "index": {"2025-Q3": 0, "2025-Q4": 1, "2026-Q1": 2},
                "label": {"2025-Q3": "2025-Q3", "2025-Q4": "2025-Q4", "2026-Q1": "2026-Q1"},
            }
        }
    },
    "value": {"0": 0.0, "1": 0.2, "2": 0.3},
}


def test_parse_eurostat_jsonstat_sorts_and_extracts():
    """parse_eurostat_jsonstat liefert Werte aufsteigend sortiert nach Periode."""
    observations = parse_eurostat_jsonstat(_BIP_EUROSTAT_RESPONSE)

    assert len(observations) == 3
    assert observations[-1]["period"] == "2026-Q1"
    assert observations[-1]["value"] == 0.3
    assert observations[-2]["period"] == "2025-Q4"
    assert observations[-2]["value"] == 0.2


def test_parse_eurostat_jsonstat_handles_missing_values():
    """Fehlende Werte (None in value-Dict) werden übersprungen."""
    data = {
        "dimension": {"time": {"category": {
            "index": {"2026-Q1": 0, "2026-Q2": 1},
            "label": {"2026-Q1": "2026-Q1", "2026-Q2": "2026-Q2"},
        }}},
        "value": {"0": 0.3},  # Index "1" fehlt
    }
    observations = parse_eurostat_jsonstat(data)
    assert len(observations) == 1
    assert observations[0]["value"] == 0.3


def test_bip_adapter_maps_to_indicator_live_value(monkeypatch):
    """BIPAdapter liefert IngestionItem mit korrekter indicator_id und Werten."""
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = _BIP_EUROSTAT_RESPONSE

    monkeypatch.setattr("src.adapters.bip.requests.get", lambda *args, **kwargs: response)

    item = BIPAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-bip-wachstum-de"
    assert item.current_value == 0.3
    assert item.current_value_date == "2026-Q1"
    assert item.previous_value == 0.2
    assert item.previous_value_date == "2025-Q4"
    assert item.source_period_type == "quarter"
    assert item.source_stand_date == "2026-Q1"
    _validate_items([item])


def test_bip_adapter_returns_fallback_on_http_error(monkeypatch):
    """HTTP-Fehler → Fallback-Item, confidence niedrig, kein Crash."""
    response = MagicMock()
    response.status_code = 503
    monkeypatch.setattr("src.adapters.bip.requests.get", lambda *args, **kwargs: response)

    items = BIPAdapter().fetch_latest()
    assert len(items) == 1
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


def test_bip_adapter_returns_fallback_on_network_exception(monkeypatch):
    """Netzwerkfehler → Fallback-Item, kein Crash."""
    monkeypatch.setattr(
        "src.adapters.bip.requests.get",
        lambda *args, **kwargs: (_ for _ in ()).throw(ConnectionError("timeout")),
    )
    items = BIPAdapter().fetch_latest()
    assert len(items) == 1
    assert items[0].indicator_id is None


# ---------------------------------------------------------------------------
# Arbeitslosigkeit — Destatis GENESIS 13211-0002 (BA-Registrierungsstatistik)
# ---------------------------------------------------------------------------

# GENESIS-Format verifiziert 2026-06-16: Region;Jahr;Monat;Anzahl;Quote1;Quote2;...
# "Insgesamt" = Gesamtdeutschland; Anzahl Personen → Millionen Personen (÷ 1.000.000).
_ARBEITSLOSIGKEIT_GENESIS_CSV = "\n".join([
    "Tabelle: 13211-0002",
    "Arbeitslose, Arbeitslosenquoten, Gemeldete Arbeitsstellen,;;;;;;;;",
    "Kurzarbeiter, Kurzarbeitende Betriebe: Deutschland/;;;;;;;;",
    "Frueheres Bundesgebiet/Neue Laender, Monate;;;;;;;;",
    "Arbeitsmarktstatistik der Bundesagentur fuer Arbeit;;;;;;;;",
    ";;;Arbeitslose;Arbeitslosenquote aller zivilen Erwerbspersonen;Arbeitslosenquote d. abhaengigen ziv. Erwerbspers.;Gemeldete Arbeitsstellen;Kurzarbeiter;Kurzarbeitende Betriebe",
    ";;;Anzahl;Prozent;Prozent;Anzahl;Anzahl;Anzahl",
    "Insgesamt;2026;April;3008161;6,4;7,0;641205;...;...",
    "Insgesamt;2026;Mai;2950456;6,3;6,8;642814;...;...",
    "Insgesamt;2026;Juni;...;...;...;...;...;...",
    "Frueheres Bundesgebiet;2026;April;2456000;5,1;5,6;500000;...;...",
])


def test_parse_arbeitslosigkeit_table_extracts_latest_in_millions():
    """parse_arbeitslosigkeit_table liefert current/previous in Mio, filtert 'Insgesamt'."""
    result = parse_arbeitslosigkeit_table(_ARBEITSLOSIGKEIT_GENESIS_CSV)

    assert result["current"]["period"] == "2026-05"
    assert abs(result["current"]["value"] - 2.950456) < 0.000001
    assert result["previous"]["period"] == "2026-04"
    assert abs(result["previous"]["value"] - 3.008161) < 0.000001


def test_parse_arbeitslosigkeit_table_raises_on_missing_anzahl_column():
    """Tabelle ohne Anzahl-Spalte wirft ValueError."""
    import pytest
    with pytest.raises(ValueError, match="13211-0002"):
        parse_arbeitslosigkeit_table("Region;Jahr;Monat;Quote\nInsgesamt;2026;Mai;6,3")


def test_arbeitslosigkeit_adapter_maps_to_indicator_live_value(monkeypatch):
    """ArbeitslosigkeitAdapter parst GENESIS-CSV und liefert korrektes IngestionItem (BA-Wert)."""
    response = MagicMock()
    response.status_code = 200
    response.content = _ARBEITSLOSIGKEIT_GENESIS_CSV.encode("utf-8")
    response.text = _ARBEITSLOSIGKEIT_GENESIS_CSV

    monkeypatch.setattr(
        "src.adapters.arbeitslosigkeit.requests.post",
        lambda *args, **kwargs: response,
    )

    item = ArbeitslosigkeitAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-arbeitslosigkeit-de"
    assert abs(item.current_value - 2.950456) < 0.000001
    assert item.current_value_date == "2026-05"
    assert abs(item.previous_value - 3.008161) < 0.000001
    assert item.previous_value_date == "2026-04"
    assert item.source_period_type == "month"
    # BA-Wert im Bereich 2,8–3,2 Mio (nicht ILO ~1,7 Mio)
    assert item.current_value > 2.5
    _validate_items([item])


def test_arbeitslosigkeit_adapter_returns_fallback_on_http_error(monkeypatch):
    """HTTP 401 (GENESIS ohne Credentials) → Fallback, confidence niedrig."""
    response = MagicMock()
    response.status_code = 401
    response.content = b'{"Code":15}'
    response.text = '{"Code":15}'
    monkeypatch.setattr(
        "src.adapters.arbeitslosigkeit.requests.post",
        lambda *args, **kwargs: response,
    )
    items = ArbeitslosigkeitAdapter().fetch_latest()
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


# ---------------------------------------------------------------------------
# EZB-Leitzins — ECB SDW (DFR)
# ---------------------------------------------------------------------------

_ECB_SDW_RESPONSE = {
    "dataSets": [
        {
            "series": {
                "0:0:0:0:0:0:0": {
                    "observations": {
                        "0": [2.0],
                        "1": [2.25],
                    }
                }
            }
        }
    ],
    "structure": {
        "dimensions": {
            "observation": [
                {
                    "id": "TIME_PERIOD",
                    "values": [
                        {"id": "2025-06-11", "name": "2025-06-11"},
                        {"id": "2026-06-17", "name": "2026-06-17"},
                    ],
                }
            ]
        }
    },
}


def test_parse_ecb_sdw_jsondata_extracts_observations():
    """parse_ecb_sdw_jsondata extrahiert Zeitpunkt-Wert-Paare korrekt."""
    observations = parse_ecb_sdw_jsondata(_ECB_SDW_RESPONSE)

    assert len(observations) == 2
    assert observations[-1]["period"] == "2026-06-17"
    assert observations[-1]["value"] == 2.25
    assert observations[-2]["period"] == "2025-06-11"
    assert observations[-2]["value"] == 2.0


def test_ezbleitzins_adapter_maps_to_indicator_live_value(monkeypatch):
    """EZBLeitzinsAdapter liefert IngestionItem mit korrekter indicator_id."""
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = _ECB_SDW_RESPONSE

    monkeypatch.setattr(
        "src.adapters.ezbleitzins.requests.get",
        lambda *args, **kwargs: response,
    )

    item = EZBLeitzinsAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-ezb-leitzins"
    assert item.current_value == 2.25
    assert item.current_value_date == "2026-06-17"
    assert item.previous_value == 2.0
    assert item.previous_value_date == "2025-06-11"
    assert item.source_period_type == "date"
    _validate_items([item])


def test_ezbleitzins_adapter_returns_fallback_on_http_error(monkeypatch):
    """HTTP-Fehler → Fallback, confidence niedrig."""
    response = MagicMock()
    response.status_code = 503
    monkeypatch.setattr(
        "src.adapters.ezbleitzins.requests.get",
        lambda *args, **kwargs: response,
    )
    items = EZBLeitzinsAdapter().fetch_latest()
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


def test_ezbleitzins_adapter_handles_malformed_response(monkeypatch):
    """Leere/fehlerhafte ECB-Antwort → Fallback, kein Crash."""
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"dataSets": [], "structure": {}}

    monkeypatch.setattr(
        "src.adapters.ezbleitzins.requests.get",
        lambda *args, **kwargs: response,
    )
    items = EZBLeitzinsAdapter().fetch_latest()
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


# ---------------------------------------------------------------------------
# Staatsschuldenquote — Eurostat gov_10dd_edpt1
# ---------------------------------------------------------------------------

_SCHULDEN_EUROSTAT_RESPONSE = {
    "dimension": {
        "time": {
            "category": {
                "index": {"2023": 0, "2024": 1, "2025": 2},
                "label": {"2023": "2023", "2024": "2024", "2025": "2025"},
            }
        }
    },
    "value": {"0": 62.3, "1": 62.2, "2": 63.5},
}


def test_parse_eurostat_debt_extracts_sorted_values():
    """parse_eurostat_debt liefert aufsteigend sortierte Jahreswerte."""
    observations = parse_eurostat_debt(_SCHULDEN_EUROSTAT_RESPONSE)

    assert len(observations) == 3
    assert observations[-1]["period"] == "2025"
    assert observations[-1]["value"] == 63.5
    assert observations[-2]["period"] == "2024"
    assert observations[-2]["value"] == 62.2


def test_staatsschulden_adapter_maps_to_indicator_live_value(monkeypatch):
    """StaatsschuldenAdapter liefert IngestionItem mit korrekter indicator_id."""
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = _SCHULDEN_EUROSTAT_RESPONSE

    monkeypatch.setattr(
        "src.adapters.staatsschulden.requests.get",
        lambda *args, **kwargs: response,
    )

    item = StaatsschuldenAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-staatsschuldenquote-de"
    assert item.current_value == 63.5
    assert item.current_value_date == "2025"
    assert item.previous_value == 62.2
    assert item.previous_value_date == "2024"
    assert item.source_period_type == "year"
    _validate_items([item])


def test_staatsschulden_adapter_returns_fallback_on_http_error(monkeypatch):
    """HTTP-Fehler → Fallback, confidence niedrig."""
    response = MagicMock()
    response.status_code = 503
    monkeypatch.setattr(
        "src.adapters.staatsschulden.requests.get",
        lambda *args, **kwargs: response,
    )
    items = StaatsschuldenAdapter().fetch_latest()
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


# ---------------------------------------------------------------------------
# Insolvenzen — Destatis 52411 Unternehmen
# ---------------------------------------------------------------------------

# Destatis-Format "Insolvenzen nach Monaten", Stand 12. Juni 2026:
# Die erste Zahl ist "insgesamt"; der Indikator meint die Spalte "Unternehmen".
_INSOLVENZEN_GENESIS_CSV = "\n".join([
    "Tabelle: 52411-0010",
    "Insolvenzen nach Monaten:;;;;;;;",
    "Deutschland, Monate;;;;;;;",
    ";;Insolvenzen insgesamt;Unternehmen;Verbraucher;ehemals selbständig Tätige;sonstige natürliche Personen, Nachlässe;Voraussichtliche Forderungen",
    ";;Anzahl;Anzahl;Anzahl;Anzahl;Anzahl;Mill. EUR",
    "2026;Februar;10439;2048;6075;1948;368;3178",
    "2026;März;12531;2308;7462;2342;419;4451",
    "2026;April;...;...;...;...;...;...",
])

_INSOLVENZEN_DESTATIS_HTML = """
<html><body>
<table>
  <thead>
    <tr><th colspan="2" rowspan="2">Jahr, Monat</th><th colspan="5">Insolvenzen (Anzahl)</th></tr>
    <tr><th>insgesamt</th><th>Unternehmen</th><th>Verbraucher</th></tr>
  </thead>
  <tbody>
    <tr>
      <th rowspan="3" scope="row">2026</th>
      <th scope="row"><abbr title="März">Mär</abbr></th>
      <td>12&nbsp;531</td><td>2&nbsp;308</td><td>7&nbsp;462</td>
    </tr>
    <tr>
      <th scope="row"><abbr title="Februar">Feb</abbr></th>
      <td>10&nbsp;439</td><td>2&nbsp;048</td><td>6&nbsp;075</td>
    </tr>
    <tr>
      <th scope="row"><abbr title="Januar">Jan</abbr></th>
      <td>10&nbsp;494</td><td>1&nbsp;919</td><td>6&nbsp;142</td>
    </tr>
  </tbody>
</table>
<p>Stand&nbsp;12. Juni 2026</p>
<h2>Veränderung zum Vorjahr</h2>
</body></html>
"""


def test_parse_insolvenzen_table_extracts_latest():
    """parse_insolvenzen_table nutzt die Unternehmensspalte, nicht die Gesamtzahl."""
    result = parse_insolvenzen_table(_INSOLVENZEN_GENESIS_CSV)

    assert result["current"]["value"] == 2308.0
    assert result["current"]["period"] == "2026-03"
    assert result["previous"]["value"] == 2048.0


def test_parse_insolvenzen_html_extracts_company_column():
    """HTML-Fallback nutzt die Unternehmensspalte der offiziellen Destatis-Tabelle."""
    result = parse_insolvenzen_html(_INSOLVENZEN_DESTATIS_HTML)

    assert result["current"]["value"] == 2308.0
    assert result["current"]["period"] == "2026-03"
    assert result["previous"]["value"] == 2048.0
    assert result["previous"]["period"] == "2026-02"


def test_parse_insolvenzen_table_raises_on_missing_column():
    """Tabelle ohne Insolvenz-Spalte wirft ValueError."""
    import pytest
    with pytest.raises(ValueError, match="Insolvenz"):
        parse_insolvenzen_table("Datum;Umsatz\n2026-03;1000")


def test_insolvenzen_adapter_maps_to_indicator_live_value(monkeypatch):
    """InsolvenzenAdapter liefert Unternehmensinsolvenzen aus der offiziellen HTML-Tabelle."""
    response = MagicMock()
    response.status_code = 200
    response.content = _INSOLVENZEN_DESTATIS_HTML.encode("utf-8")
    response.text = _INSOLVENZEN_DESTATIS_HTML
    response.raise_for_status.return_value = None

    monkeypatch.setattr(
        "src.adapters.insolvenzen.requests.get",
        lambda *args, **kwargs: response,
    )

    item = InsolvenzenAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-insolvenzen-de"
    assert item.current_value == 2308.0
    assert item.current_value_date == "2026-03"
    assert item.previous_value == 2048.0
    assert item.source_period_type == "month"
    _validate_items([item])


def test_insolvenzen_adapter_uses_destatis_html_before_genesis(monkeypatch):
    """GENESIS 52411-0010 ist nicht die kanonische Runtime-Quelle für diesen Indikator."""
    get_response = MagicMock()
    get_response.status_code = 200
    get_response.content = _INSOLVENZEN_DESTATIS_HTML.encode("utf-8")
    get_response.text = _INSOLVENZEN_DESTATIS_HTML
    get_response.raise_for_status.return_value = None

    post_called = False

    def post_response(*args, **kwargs):
        nonlocal post_called
        post_called = True
        response = MagicMock()
        response.status_code = 404
        response.content = b'{"Code":2}'
        response.text = '{"Code":2}'
        return response

    monkeypatch.setattr(
        "src.adapters.insolvenzen.requests.get",
        lambda *args, **kwargs: get_response,
    )
    monkeypatch.setattr("src.adapters.insolvenzen.requests.post", post_response)

    item = InsolvenzenAdapter().fetch_latest()[0]

    assert post_called is False
    assert item.current_value == 2308.0
    assert item.current_value_date == "2026-03"


def test_insolvenzen_adapter_falls_back_to_destatis_html(monkeypatch):
    """Wenn alte GENESIS-Mocks scheitern, bleibt die Destatis-HTML-Tabelle korrekt."""
    post_response = MagicMock()
    post_response.status_code = 404
    post_response.content = b'{"Code":2}'
    post_response.text = '{"Code":2}'

    get_response = MagicMock()
    get_response.status_code = 200
    get_response.content = _INSOLVENZEN_DESTATIS_HTML.encode("utf-8")
    get_response.text = _INSOLVENZEN_DESTATIS_HTML
    get_response.raise_for_status.return_value = None

    monkeypatch.setattr(
        "src.adapters.insolvenzen.requests.post",
        lambda *args, **kwargs: post_response,
    )
    monkeypatch.setattr(
        "src.adapters.insolvenzen.requests.get",
        lambda *args, **kwargs: get_response,
    )

    item = InsolvenzenAdapter().fetch_latest()[0]

    assert item.indicator_id == "wi-insolvenzen-de"
    assert item.current_value == 2308.0
    assert item.current_value_date == "2026-03"
    assert item.previous_value == 2048.0
    assert item.previous_value_date == "2026-02"
    _validate_items([item])


def test_insolvenzen_adapter_returns_fallback_on_http_error(monkeypatch):
    """Nicht erreichbare HTML-Tabelle → Fallback, confidence niedrig."""
    response = MagicMock()
    response.status_code = 401
    response.content = b'{"Code":15}'
    response.text = '{"Code":15}'
    monkeypatch.setattr(
        "src.adapters.insolvenzen.requests.post",
        lambda *args, **kwargs: response,
    )

    def raise_get(*args, **kwargs):
        raise RuntimeError("html unavailable")

    monkeypatch.setattr("src.adapters.insolvenzen.requests.get", raise_get)

    items = InsolvenzenAdapter().fetch_latest()
    assert items[0].indicator_id is None
    assert items[0].confidence_suggestion == "niedrig"


@pytest.mark.live
def test_bip_adapter_live():
    adapter = BIPAdapter()
    assert adapter.name == "BIP"
    items = adapter.fetch_latest()
    assert isinstance(items, list)
    assert len(items) >= 1


@pytest.mark.live
def test_arbeitslosigkeit_adapter_live():
    adapter = ArbeitslosigkeitAdapter()
    items = adapter.fetch_latest()
    assert isinstance(items, list)
    assert len(items) >= 1


@pytest.mark.live
def test_ezbleitzins_adapter_live():
    adapter = EZBLeitzinsAdapter()
    items = adapter.fetch_latest()
    assert isinstance(items, list)
    assert len(items) >= 1


@pytest.mark.live
def test_staatsschulden_adapter_live():
    adapter = StaatsschuldenAdapter()
    items = adapter.fetch_latest()
    assert isinstance(items, list)
    assert len(items) >= 1
