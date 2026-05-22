"use client";

import { useChillMode } from "@/app/providers";
import Footer from "@/components/Footer";
import React from "react";

export default function ConditionalFooter() {
  const { isChillMode } = useChillMode();
  return isChillMode ? null : <Footer />;
}