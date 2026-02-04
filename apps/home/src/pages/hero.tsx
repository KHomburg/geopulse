import { useEffect } from "react";

const Hero = () => {
	useEffect(() => {
		document.body.classList.add("dark");
	}, []);

	return (
		<>
			<h1>I am the hero page</h1>
		</>
	);
};

export default Hero;
