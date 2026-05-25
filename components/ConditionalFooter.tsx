"use client";
import { useChillMode } from "@/app/providers";
import React from "react";
import dynamic from "next/dynamic";

// Lazy load the Footer component
const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: true,
  loading: () => <div style={{ height: '300px' }} />, // Optional placeholder
});

export default function ConditionalFooter() {
  const { isChillMode } = useChillMode();
  return isChillMode ? null : <Footer />;
}