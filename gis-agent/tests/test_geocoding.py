import pytest
import asyncio
from gis_tools import geocode_address

@pytest.mark.asyncio
async def test_geocode_scenario_address():
    # Test our mock coordinates mappings (Delhi area)
    coords = await geocode_address("14 Green Valley Rd, New Delhi")
    assert coords is not None
    assert coords[0] == 28.611
    assert coords[1] == 77.205
