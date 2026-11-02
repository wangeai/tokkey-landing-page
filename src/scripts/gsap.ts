// Single entry for GSAP: registers plugins once, so every script that imports from here can use ScrollTrigger
// and Observer regardless of which bundle loads first.
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, Observer);

export { gsap, Observer, ScrollTrigger };
