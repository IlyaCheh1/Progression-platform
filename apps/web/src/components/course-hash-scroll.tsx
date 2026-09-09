"use client";

import { useEffect } from "react";

/** Next.js App Router does not always scroll to the URL hash on first paint. */
export default function CourseHashScroll() {
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return null;
}
