/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				dark_bg: "#444653",
                dark_bg_nav: "#222733",
                dark_bg_input: "#3f414e",
                dark_bg_input_border: "#3f414e",
                dark_bg_input_color: "#d8d8d8",
                dark_text_title1_color: "#dee2e9",
                dark_text_title2_color: "#aeb0b4",
                dark_text_reply_titile_color: "white",
                dark_content: "white",
                dark_content_hover: "#5b5c65",
			},
		},
	},
	plugins: [require("@tailwindcss/typography")],
	darkMode: "class",
};
