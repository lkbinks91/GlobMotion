"use client";

import { motion } from "framer-motion";

interface CTAButtonProps {
	label: string;
	onClick?: () => void;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
}

export default function CTAButton({
	label,
	onClick,
	loading = false,
	disabled = false,
	className = "",
}: CTAButtonProps) {
	const isDisabled = disabled || loading;

	return (
		<motion.button
			type="button"
			whileTap={{ scale: isDisabled ? 1 : 0.97 }}
			onClick={onClick}
			disabled={isDisabled}
			className={className}
			style={{
				width: "100%",
				padding: "12px 18px",
				borderRadius: "12px",
				border: "none",
				cursor: isDisabled ? "not-allowed" : "pointer",
				fontSize: "13px",
				fontWeight: 700,
				letterSpacing: "0.02em",
				fontFamily: "var(--font-display)",
				color: isDisabled ? "rgba(255,255,255,0.35)" : "#ffffff",
				background: isDisabled
					? "rgba(255,255,255,0.08)"
					: "linear-gradient(135deg, #7C3AED 0%, #4ECCA3 100%)",
				boxShadow: isDisabled
					? "none"
					: "0 10px 30px rgba(78, 204, 163, 0.22)",
				transition: "all 0.2s ease",
			}}
			aria-busy={loading}
		>
			{loading ? "Chargement..." : label}
		</motion.button>
	);
}
