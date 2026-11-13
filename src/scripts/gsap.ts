// Single entry for GSAP: registers plugins once, so every script that imports from here can use ScrollTrigger
// regardless of which bundle loads first.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
