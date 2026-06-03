import time
from dataclasses import dataclass
from datetime import date
from statistics import mean
from typing import List

import requests

from .base import BaseAdapter
from ..models import IngestionItem, GermanyRelevance
from ..config import settings


@dataclass(frozen=True)
class BasketPoint:
    land: str
    plz: str
    lat: float
    lng: float


# Ein repraesentativer PLZ-Punkt je Bundesland (Landeshauptstadt-Zentrum).
# Tankerkoenig kennt keinen PLZ-Parameter — die Koordinaten sind hier fest
# hinterlegt, damit die Stichprobe reproduzierbar und ohne Laufzeit-Geocoding ist.
PLZ_BASKET: tuple[BasketPoint, ...] = (
    BasketPoint("Baden-Wuerttemberg", "70173", 48.7784, 9.1806),
    BasketPoint("Bayern", "80331", 48.1351, 11.5820),
    BasketPoint("Berlin", "10117", 52.5170, 13.3889),
    BasketPoint("Brandenburg", "14467", 52.4009, 13.0591),
    BasketPoint("Bremen", "28195", 53.0758, 8.8072),
    BasketPoint("Hamburg", "20095", 53.5511, 10.0006),
    BasketPoint("Hessen", "65183", 50.0826, 8.2400),
    BasketPoint("Mecklenburg-Vorpommern", "19053", 53.6355, 11.4012),
    BasketPoint("Niedersachsen", "30159", 52.3744, 9.7386),
    BasketPoint("Nordrhein-Westfalen", "40213", 51.2217, 6.7762),
    BasketPoint("Rheinland-Pfalz", "55116", 49.9929, 8.2473),
    BasketPoint("Saarland", "66111", 49.2354, 6.9969),
    BasketPoint("Sachsen", "01067", 51.0504, 13.7373),
    BasketPoint("Sachsen-Anhalt", "39104", 52.1278, 11.6293),
    BasketPoint("Schleswig-Holstein", "24103", 54.3233, 10.1394),
    BasketPoint("Thueringen", "99084", 50.9787, 11.0328),
)

# Tankerkoenig empfiehlt ~1 Request/Minute. Zwei Laeufe/Tag mit 16 Calls bleiben
# unkritisch; eine kleine Pause zwischen den Calls vermeidet jede Abuse-Heuristik.
REQUEST_DELAY_SECONDS = 2.0
SEARCH_RADIUS_KM = 10

FUEL_INDICATORS = {
    "e10": "wi-kraftstoffpreis-super-e10",
    "diesel": "wi-kraftstoffpreis-diesel",
}
FUEL_LABELS = {
    "e10": "Super E10",
    "diesel": "Diesel",
}


def _valid_price(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0


def average_fuel_prices(stations: List[dict]) -> dict:
    """Mittelt e10/diesel ueber alle offenen Stationen mit gueltigem Preis.

    Liefert {"e10": float|None, "diesel": float|None, "station_count": int}.
    """
    fuel_values: dict[str, list[float]] = {"e10": [], "diesel": []}
    counted_stations = 0

    for station in stations:
        if not station.get("isOpen", False):
            continue
        contributed = False
        for fuel in fuel_values:
            price = station.get(fuel)
            if _valid_price(price):
                fuel_values[fuel].append(float(price))
                contributed = True
        if contributed:
            counted_stations += 1

    return {
        "e10": round(mean(fuel_values["e10"]), 3) if fuel_values["e10"] else None,
        "diesel": round(mean(fuel_values["diesel"]), 3) if fuel_values["diesel"] else None,
        "station_count": counted_stations,
    }


class TankerkoenigAdapter(BaseAdapter):
    """Tankerkoenig (MTS-K) — Kraftstoffpreise Super E10 und Diesel.

    Kein nationaler Durchschnitts-Endpoint vorhanden: gemittelt wird ueber eine
    feste Stichprobe aus 16 PLZ-Gebieten (je Bundesland eines).
    """

    BASE_URL = "https://creativecommons.tankerkoenig.de/json/list.php"
    SOURCE_URL = "https://creativecommons.tankerkoenig.de/"
    source_label = "Tankerkoenig MTS-K (E10/Diesel, 16 PLZ)"
    requires_api_key = True  # TANKERKOENIG_API_KEY zwingend
    output_target = "indicators"

    def __init__(self):
        super().__init__("Tankerkoenig")
        self.source_class = "markt"

    def _fetch_stations(self, point: BasketPoint) -> List[dict]:
        response = requests.get(
            self.BASE_URL,
            params={
                "lat": point.lat,
                "lng": point.lng,
                "rad": SEARCH_RADIUS_KM,
                "sort": "dist",
                "type": "all",
                "apikey": settings.TANKERKOENIG_API_KEY,
            },
            timeout=20,
        )
        if response.status_code != 200:
            self.log_error(f"list.php {point.plz}: Status {response.status_code}")
            return []
        payload = response.json()
        if not payload.get("ok"):
            self.log_error(f"list.php {point.plz}: ok=false ({payload.get('message')})")
            return []
        return payload.get("stations", []) or []

    def fetch_latest(self) -> List[IngestionItem]:
        if not settings.TANKERKOENIG_API_KEY:
            self.log_error("TANKERKOENIG_API_KEY nicht gesetzt")
            return []

        stations: List[dict] = []
        for index, point in enumerate(PLZ_BASKET):
            try:
                stations.extend(self._fetch_stations(point))
            except Exception as e:
                self.log_error(f"Fetch {point.plz} failed: {e}")
            if index < len(PLZ_BASKET) - 1:
                time.sleep(REQUEST_DELAY_SECONDS)

        averages = average_fuel_prices(stations)
        if averages["station_count"] == 0:
            self.log_error("Keine offenen Stationen mit gueltigem Preis — kein Update")
            return []

        value_date = date.today().isoformat()
        items: List[IngestionItem] = []
        for fuel, indicator_id in FUEL_INDICATORS.items():
            value = averages[fuel]
            if value is None:
                continue
            label = FUEL_LABELS[fuel]
            items.append(self.create_item(
                title=(
                    f"Spritpreis {label} Deutschland: {value:.3f} Euro/Liter "
                    f"(Stichprobe {averages['station_count']} Stationen, {value_date})"
                ),
                description=(
                    f"Durchschnittlicher {label}-Preis aus einer Stichprobe von "
                    f"{averages['station_count']} Tankstellen in 16 PLZ-Gebieten "
                    f"(je Bundesland eines): {value:.3f} Euro/Liter. Tagesstichprobe, "
                    "kein offizielles ADAC-Jahresmittel."
                ),
                source_url=self.SOURCE_URL,
                germany_relevance=GermanyRelevance(
                    direct=True,
                    systems_affected=["mobilitaet"],
                    time_to_impact="kurzfristig",
                    description=(
                        "Kraftstoffpreise belasten Pendeln, Versorgung und Logistik "
                        "unmittelbar."
                    ),
                ),
                methodology_tag="steep",
                affected_systems=["mobilitaet"],
                indicator_id=indicator_id,
                current_value=value,
                current_value_date=value_date,
            ))

        return items
