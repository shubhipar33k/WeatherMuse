/**
 * useReveal — Day 9
 *
 * Intersection Observer hook that fires once when an element enters the
 * viewport. Used to trigger scroll-based entrance animations on each panel
 * without a JS animation library.
 *
 * Usage:
 *   const [ref, isVisible] = useReveal();
 *   <div ref={ref} className={isVisible ? "revealed" : "pre-reveal"} />
 */
"use client";

import { useRef, useState, useEffect, RefObject } from "react";

export function useReveal<T extends Element>(
    options: IntersectionObserverInit = {}
): [RefObject<T>, boolean] {
    const ref = useRef<T>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();   // fire once only
                }
            },
            { threshold: 0.06, rootMargin: "0px 0px -40px 0px", ...options }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);   // eslint-disable-line react-hooks/exhaustive-deps

    return [ref, visible];
}
