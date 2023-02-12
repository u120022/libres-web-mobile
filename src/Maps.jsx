import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { getDistance } from "geolib";

// 近くの図書館を表示(マップ)
export function LibraryMaps({ geocode, libraryRecords }) {
	const markers = libraryRecords.map((record, i) => {
		const [lat, lng] = record.geocode;
		const currentGeocode = { lat, lng };
		const distance = getDistance(currentGeocode, geocode);

		let color = "white";

		if (record.state) {
			if (record.state != "Nothing") {
				color = "green";
			} else {
				color = "gray";
			}
		}

		return (
			<CircleMarker key={i} center={currentGeocode} pathOptions={{ color }}>
				<Tooltip direction="bottom" permanent><div style={{ color }}>{record.name}({distance / 1000}km)</div></Tooltip>
			</CircleMarker>
		);
	});

	return (
		<MapContainer
			style={{ width: "100%", height: "20rem", borderRadius: "1rem" }}
			center={geocode}
			zoom={12}
		>
			<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

			<CircleMarker center={geocode}>
				<Tooltip direction="bottom" permanent>現在地</Tooltip>
			</CircleMarker>

			{markers}
		</MapContainer>
	);
}
