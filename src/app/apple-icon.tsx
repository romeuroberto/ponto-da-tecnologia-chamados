import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #0f172a 0%, #1d4ed8 100%)",
          color: "white",
          fontFamily: "sans-serif"
        }}
      >
        <div
          style={{
            width: 138,
            height: 138,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 34,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.18)"
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              opacity: 0.92
            }}
          >
            PDT
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: 600
            }}
          >
            Portal
          </div>
        </div>
      </div>
    ),
    size
  );
}
