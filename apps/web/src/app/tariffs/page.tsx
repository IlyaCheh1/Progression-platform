"use client";

import { useLayoutEffect } from "react";

/** The standalone tariffs page is gone. Keep the hash so the visit lands on the landing carousel. */
export default function TariffsRedirectPage() {
  useLayoutEffect(() => {
    window.location.replace("/#tariffs");
  }, []);

  return null;
}
