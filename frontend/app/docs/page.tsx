"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <main style={{ padding: "20px" }}>
      <h1>📖 TravelBook API Docs</h1>
      <SwaggerUI url="/openapi.yaml" />
    </main>
  );
}
