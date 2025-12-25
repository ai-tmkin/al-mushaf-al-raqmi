import { NextRequest, NextResponse } from "next/server";
import satori from "satori";

// Since we can't use @resvg/resvg-js directly in edge (it needs wasm),
// we'll return SVG or use html2canvas on client side for now
// TODO: Set up proper server-side rendering with resvg-js

export async function POST(req: NextRequest) {
  try {
    const {
      verseText,
      surahName,
      customization,
      showBismillah,
      bismillahText,
    } = await req.json();

    const {
      font,
      fontSize,
      fontColor,
      textAlign,
      lineHeight,
      backgroundColor,
      padding,
      borderRadius,
    } = customization;

    // Load font
    const fontResponse = await fetch(
      "https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf"
    );
    const fontBuffer = await fontResponse.arrayBuffer();

    // Create SVG using Satori
    const svg = await satori(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          padding: `${padding}px`,
          borderRadius: `${borderRadius}px`,
          fontFamily: "Amiri",
        }}
      >
        {showBismillah && bismillahText && (
          <p
            style={{
              color: fontColor,
              fontSize: `${fontSize * 0.75}px`,
              opacity: 0.8,
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {bismillahText}
          </p>
        )}
        <p
          style={{
            color: fontColor,
            fontSize: `${fontSize}px`,
            lineHeight,
            textAlign,
            direction: "rtl",
          }}
        >
          {verseText}
        </p>
        {surahName && (
          <div
            style={{
              marginTop: "32px",
              display: "flex",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                padding: "8px 16px",
                borderRadius: "999px",
                backgroundColor: `${fontColor}10`,
                color: fontColor,
                opacity: 0.7,
              }}
            >
              سورة {surahName}
            </span>
          </div>
        )}
      </div>,
      {
        width: 1080,
        height: 1080,
        fonts: [
          {
            name: "Amiri",
            data: fontBuffer,
            weight: 400,
            style: "normal",
          },
        ],
      }
    );

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

