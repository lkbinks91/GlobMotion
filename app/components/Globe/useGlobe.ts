"use client";

import { useCallback, useMemo, useState } from "react";
import { countries, type Country } from "@/data/countries";

function findCountryByCode(code: string): Country | null {
	return countries.find((c) => c.code === code) ?? null;
}

export function useGlobe() {
	const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
	const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
	const [autoRotate, setAutoRotate] = useState(true);

	const selectCountryByCode = useCallback((code: string) => {
		setSelectedCountry(findCountryByCode(code));
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedCountry(null);
	}, []);

	const toggleAutoRotate = useCallback(() => {
		setAutoRotate((v) => !v);
	}, []);

	return useMemo(
		() => ({
			selectedCountry,
			hoveredCountry,
			autoRotate,
			setSelectedCountry,
			setHoveredCountry,
			setAutoRotate,
			selectCountryByCode,
			clearSelection,
			toggleAutoRotate,
		}),
		[
			selectedCountry,
			hoveredCountry,
			autoRotate,
			selectCountryByCode,
			clearSelection,
			toggleAutoRotate,
		]
	);
}

