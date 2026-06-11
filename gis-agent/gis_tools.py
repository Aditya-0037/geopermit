import httpx
import json
import os
from typing import Dict, Any, Tuple, Optional

# Standard point-in-polygon ray casting check
def point_in_polygon(x: float, y: float, poly: list) -> bool:
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

async def geocode_address(address: str, contact_email: str = "contact@geopermit.ai") -> Optional[Tuple[float, float]]:
    """
    Geocode an address to lat/lng using OSM Nominatim API.
    """
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": f"GeoPermitAI/1.0 ({contact_email})"}
    params = {
        "q": address,
        "format": "json",
        "limit": 1
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"Geocoding error: {e}")
        
    return None

async def query_overpass_landuse(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """
    Query OpenStreetMap Overpass API for landuse tag at coordinates.
    """
    url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:10];
    is_in({lat},{lng})->.a;
    (
      way(pivot.a)[landuse];
      relation(pivot.a)[landuse];
    );
    out tags;
    """
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, data={"data": query}, headers={"User-Agent": "GeoPermitAI/1.0"})
            if response.status_code == 200:
                data = response.json()
                elements = data.get("elements", [])
                if elements:
                    # Return first matching landuse element
                    for element in elements:
                        if "landuse" in element.get("tags", {}):
                            return {
                                "detected_zone": element["tags"]["landuse"],
                                "gis_source": "OpenStreetMap Overpass API",
                                "gis_polygon_id": f"{element.get('type')}/{element.get('id')}"
                            }
    except Exception as e:
        print(f"Overpass API error: {e}")
        
    return None

def check_local_geojson_fallback(lat: float, lng: float, geojson_path: str) -> Optional[Dict[str, Any]]:
    """
    Check if coordinates fall into any polygon in a local GeoJSON file.
    """
    if not os.path.exists(geojson_path):
        return None
        
    try:
        with open(geojson_path, "r") as f:
            geojson = json.load(f)
            
        for feature in geojson.get("features", []):
            geom = feature.get("geometry", {})
            props = feature.get("properties", {})
            
            if geom.get("type") == "Polygon":
                # GeoJSON coordinates format: [lng, lat]
                # Usually rings of coords, we take outer ring (index 0)
                coords = geom.get("coordinates", [[]])[0]
                if coords:
                    poly_points = [(c[0], c[1]) for c in coords] # list of (lng, lat)
                    if point_in_polygon(lng, lat, poly_points):
                        return {
                            "detected_zone": props.get("landuse", "unknown"),
                            "gis_source": f"Local Fallback GeoJSON ({props.get('zone_name', 'Unknown')})",
                            "gis_polygon_id": f"geojson/{feature.get('id', 'polygon')}"
                        }
    except Exception as e:
        print(f"GeoJSON fallback error: {e}")
        
    return None
