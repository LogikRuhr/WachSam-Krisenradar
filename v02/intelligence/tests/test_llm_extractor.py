import pytest
from unittest.mock import patch, MagicMock
from src.extractors.llm_extractor import extract_with_llm


MOCK_LLM_RESPONSE = """{
  "title": "Gaspreise steigen erneut",
  "description": "Europäische Gaspreise steigen aufgrund geopolitischer Spannungen.",
  "germany_relevance": {
    "direct": true,
    "systems_affected": ["energie", "industrie"],
    "time_to_impact": "wochen",
    "description": "Direkte Auswirkung auf Heizkosten deutscher Haushalte."
  },
  "methodology_tag": "steep",
  "severity_suggestion": "erhöht",
  "confidence_suggestion": "mittel",
  "possible_cascades": ["Gaspreise → Strompreise → Industriekosten"],
  "haushalts_auswirkungen": ["Heizkosten +15-20%"],
  "buergermassnahmen": ["Heizverträge prüfen"]
}"""


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
async def test_extract_skips_without_project(mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = ""
    result = await extract_with_llm("Test content", "https://example.com", "medien")
    assert result is None


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._init_vertex")
async def test_extract_returns_valid_item(mock_init, mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"
    mock_settings.VERTEX_AI_LOCATION = "europe-west3"

    mock_response = MagicMock()
    mock_response.text = MOCK_LLM_RESPONSE

    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mock_gm_module = MagicMock()
    mock_gm_module.GenerativeModel.return_value = mock_model

    with patch.dict("sys.modules", {"vertexai.generative_models": mock_gm_module}):
        result = await extract_with_llm("Gas prices rising...", "https://example.com", "medien")

    assert result is not None
    assert result.title == "Gaspreise steigen erneut"
    assert result.germany_relevance.direct is True
    assert result.severity_suggestion == "erhöht"
    assert result.status == "extracted"


@pytest.mark.asyncio
@patch("src.extractors.llm_extractor.settings")
@patch("src.extractors.llm_extractor._init_vertex")
async def test_extract_handles_invalid_json(mock_init, mock_settings):
    mock_settings.GOOGLE_CLOUD_PROJECT = "test-project"

    mock_response = MagicMock()
    mock_response.text = "not valid json"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mock_gm_module = MagicMock()
    mock_gm_module.GenerativeModel.return_value = mock_model

    with patch.dict("sys.modules", {"vertexai.generative_models": mock_gm_module}):
        result = await extract_with_llm("Content", "https://example.com", "medien")

    assert result is None
