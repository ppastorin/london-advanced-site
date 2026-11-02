#!/usr/bin/env python3
"""Generate London Advanced editorial itinerary maps from OSM data.

The script uses OpenStreetMap raster tiles for the base and the public
routing.openstreetmap.de pedestrian profile for genuine walking geometry.
It deliberately keeps route definitions explicit so future editorial maps can
be regenerated and checked rather than redrawn approximately.
"""

from __future__ import annotations

import io
import json
import math
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "itineraries"
WIDTH, HEIGHT, ZOOM = 1400, 1582, 14
TILE = 256
PAPER = "#f5eddd"
GREEN = "#3f6655"
GOLD = "#b18a45"
INK = "#1f2c26"
USER_AGENT = "LondonAdvancedRouteMap/1.0 (https://www.londonadvanced.com/)"


MAPS = {
    "it02-highgate-route-map.webp": {
        "title": "HIGHGATE · LOST RAILWAY TO THE HEATH",
        "walks": [[
            (-0.1063741, 51.5697429),  # Oxford Road gate
            (-0.1242793, 51.5743246),  # Crouch End platforms / Spriggan
            (-0.1416160, 51.5752440),  # Holmesdale Road exit
            (-0.1462884, 51.5814646),  # Queen's Wood Cafe
            (-0.1445816, 51.5684751),  # Waterlow Park
            (-0.1464614, 51.5668437),  # Highgate Cemetery
            (-0.1597717, 51.5596203),  # Parliament Hill viewpoint
        ]],
        "stops": [
            (1, "PARKLAND WALK", -0.1063741, 51.5697429, -240, -78),
            (2, "CROUCH END PLATFORMS", -0.1242793, 51.5743246, 28, -54),
            (3, "QUEEN'S WOOD CAFÉ", -0.1462884, 51.5814646, 28, -60),
            (4, "HIGHGATE & WATERLOW", -0.1445816, 51.5684751, 30, 32),
            (5, "HIGHGATE CEMETERY", -0.1464614, 51.5668437, 30, 32),
            (6, "PARLIAMENT HILL", -0.1597717, 51.5596203, 28, 32),
        ],
    },
    "it03-lower-lea-route-map.webp": {
        "title": "LOWER LEA · COLLECTIONS TO THE THAMES",
        "walks": [
            [
                (-0.0211827, 51.5464368),  # V&A East Storehouse
                (-0.0135487, 51.5418837),  # V&A East Museum
                (-0.0078501, 51.5274276),  # House Mill
                (-0.0034081, 51.5190472),  # Cody Dock
            ],
            [(-0.0034081, 51.5190472), (0.0045441, 51.5211364)],  # Star Lane
            [(-0.0024821, 51.5093279), (0.0083058, 51.5076977)],  # East India to lighthouse
        ],
        "transit": [
            (0.0045441, 51.5211364),
            (-0.0024821, 51.5093279),
        ],
        "optional": ("OPTIONAL · ABBEY MILLS", -0.0015775, 51.5308418),
        "stops": [
            (1, "V&A EAST STOREHOUSE", -0.0211827, 51.5464368, 28, -64),
            (2, "V&A EAST MUSEUM", -0.0135487, 51.5418837, 28, 32),
            (3, "THREE MILLS", -0.0078501, 51.5274276, 28, 32),
            (4, "CODY DOCK", -0.0034081, 51.5190472, -188, -58),
            (5, "TRINITY BUOY WHARF", 0.0083058, 51.5076977, -248, 32),
        ],
    },
}


def request_bytes(url: str, attempts: int = 4) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Unable to download {url}: {last_error}")


def route(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    coordinates = ";".join(f"{lon},{lat}" for lon, lat in points)
    url = (
        "https://routing.openstreetmap.de/routed-foot/route/v1/driving/"
        f"{coordinates}?overview=full&geometries=geojson&steps=false"
    )
    data = json.loads(request_bytes(url))
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RuntimeError(f"Pedestrian routing failed for {coordinates}")
    return [tuple(point) for point in data["routes"][0]["geometry"]["coordinates"]]


def world_pixel(lon: float, lat: float, zoom: int = ZOOM) -> tuple[float, float]:
    scale = TILE * (2**zoom)
    x = (lon + 180.0) / 360.0 * scale
    lat = max(min(lat, 85.05112878), -85.05112878)
    y = (
        1.0
        - math.asinh(math.tan(math.radians(lat))) / math.pi
    ) / 2.0 * scale
    return x, y


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/{name}", size)


def dashed_line(draw: ImageDraw.ImageDraw, points, fill, width=8, dash=20, gap=14):
    for start, end in zip(points, points[1:]):
        x1, y1 = start
        x2, y2 = end
        length = math.hypot(x2 - x1, y2 - y1)
        if not length:
            continue
        ux, uy = (x2 - x1) / length, (y2 - y1) / length
        distance = 0
        while distance < length:
            segment_end = min(distance + dash, length)
            draw.line(
                [(x1 + ux * distance, y1 + uy * distance),
                 (x1 + ux * segment_end, y1 + uy * segment_end)],
                fill=fill,
                width=width,
            )
            distance += dash + gap


def label(draw, xy, text, *, fill=PAPER, ink=INK, size=25, padding=13):
    typeface = font(size, True)
    box = draw.textbbox((0, 0), text, font=typeface)
    width = box[2] - box[0] + padding * 2
    height = box[3] - box[1] + padding * 2
    x, y = xy
    draw.rounded_rectangle((x, y, x + width, y + height), radius=7, fill=fill, outline=ink, width=2)
    draw.text((x + padding, y + padding - box[1]), text, font=typeface, fill=ink)


def build(filename: str, spec: dict) -> None:
    walking_routes = [route(points) for points in spec["walks"]]
    all_points = [point for line in walking_routes for point in line]
    all_points.extend((lon, lat) for _, _, lon, lat, _, _ in spec["stops"])
    if spec.get("transit"):
        all_points.extend(spec["transit"])
    if spec.get("optional"):
        _, lon, lat = spec["optional"]
        all_points.append((lon, lat))

    pixels = [world_pixel(*point) for point in all_points]
    min_x, max_x = min(x for x, _ in pixels), max(x for x, _ in pixels)
    min_y, max_y = min(y for _, y in pixels), max(y for _, y in pixels)
    route_width, route_height = max_x - min_x, max_y - min_y
    pad = max(route_width, route_height) * 0.13
    view_width, view_height = route_width + 2 * pad, route_height + 2 * pad
    target_ratio = WIDTH / HEIGHT
    if view_width / view_height < target_ratio:
        view_width = view_height * target_ratio
    else:
        view_height = view_width / target_ratio
    center_x, center_y = (min_x + max_x) / 2, (min_y + max_y) / 2
    left, top = center_x - view_width / 2, center_y - view_height / 2
    right, bottom = center_x + view_width / 2, center_y + view_height / 2

    tile_left, tile_top = math.floor(left / TILE), math.floor(top / TILE)
    tile_right, tile_bottom = math.floor(right / TILE), math.floor(bottom / TILE)
    mosaic = Image.new(
        "RGB",
        ((tile_right - tile_left + 1) * TILE, (tile_bottom - tile_top + 1) * TILE),
        PAPER,
    )
    for tile_y in range(tile_top, tile_bottom + 1):
        for tile_x in range(tile_left, tile_right + 1):
            url = f"https://tile.openstreetmap.org/{ZOOM}/{tile_x}/{tile_y}.png"
            tile = Image.open(io.BytesIO(request_bytes(url))).convert("RGB")
            mosaic.paste(tile, ((tile_x - tile_left) * TILE, (tile_y - tile_top) * TILE))

    crop = mosaic.crop((
        round(left - tile_left * TILE),
        round(top - tile_top * TILE),
        round(right - tile_left * TILE),
        round(bottom - tile_top * TILE),
    )).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(crop)
    scale_x, scale_y = WIDTH / view_width, HEIGHT / view_height

    def output_pixel(point):
        x, y = world_pixel(*point)
        return (round((x - left) * scale_x), round((y - top) * scale_y))

    for line in walking_routes:
        mapped = [output_pixel(point) for point in line]
        draw.line(mapped, fill=PAPER, width=18, joint="curve")
        draw.line(mapped, fill=GREEN, width=10, joint="curve")

    if spec.get("transit"):
        transit = [output_pixel(point) for point in spec["transit"]]
        draw.line(transit, fill=PAPER, width=18)
        dashed_line(draw, transit, GOLD, width=10, dash=22, gap=15)
        midpoint = ((transit[0][0] + transit[1][0]) // 2, (transit[0][1] + transit[1][1]) // 2)
        label(draw, (midpoint[0] + 16, midpoint[1] - 54), "DLR", fill="#d9bd80", size=22, padding=10)

    if spec.get("optional"):
        text, lon, lat = spec["optional"]
        x, y = output_pixel((lon, lat))
        draw.regular_polygon((x, y, 15), 4, rotation=45, fill=GOLD, outline=PAPER)
        label(draw, (x + 24, y - 52), text, fill="#f3e1b8", size=20, padding=10)

    for number, text, lon, lat, dx, dy in spec["stops"]:
        x, y = output_pixel((lon, lat))
        radius = 24
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=GREEN, outline=PAPER, width=5)
        marker_font = font(25, True)
        number_box = draw.textbbox((0, 0), str(number), font=marker_font)
        draw.text(
            (x - (number_box[2] - number_box[0]) / 2, y - (number_box[3] - number_box[1]) / 2 - 2),
            str(number),
            font=marker_font,
            fill="white",
        )
        label(draw, (x + dx, y + dy), text, size=21, padding=10)

    label(draw, (34, 34), spec["title"], fill=PAPER, size=22, padding=12)
    attribution = "© OpenStreetMap contributors · pedestrian routing: openstreetmap.de · London Advanced"
    attr_font = font(18)
    attr_box = draw.textbbox((0, 0), attribution, font=attr_font)
    attr_width = attr_box[2] - attr_box[0] + 24
    attr_height = attr_box[3] - attr_box[1] + 20
    x, y = WIDTH - attr_width - 14, HEIGHT - attr_height - 14
    draw.rectangle((x, y, x + attr_width, y + attr_height), fill=(245, 237, 221, 232))
    draw.text((x + 12, y + 10 - attr_box[1]), attribution, font=attr_font, fill=INK)
    crop.save(OUT / filename, "WEBP", quality=88, method=6)
    print(f"Generated {OUT / filename}")


if __name__ == "__main__":
    requested = set(sys.argv[1:])
    for output, specification in MAPS.items():
        if requested and output not in requested:
            continue
        build(output, specification)
