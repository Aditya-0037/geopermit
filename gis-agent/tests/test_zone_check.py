import pytest
import os
from gis_tools import check_local_geojson_fallback

def test_point_in_polygon_fallback():
    # Green Valley is defined in Delhi (28.611, 77.205)
    script_dir = os.path.dirname(os.path.realpath(__file__))
    geojson_path = os.path.join(script_dir, "..", "mock_zones.geojson")
    
    result = check_local_geojson_fallback(28.611, 77.205, geojson_path)
    assert result is not None
    assert result["detected_zone"] == "residential"
    assert "Local Fallback GeoJSON" in result["gis_source"]
