import { NextRequest, NextResponse } from "next/server";

// This endpoint expects a GET with a query param (?tnx_ref=...)
export async function GET(req: NextRequest) {
  // Get the transaction reference from the query string
  const tax_ref = req.nextUrl.searchParams.get("tax_ref");


  if (!tax_ref) {
    return NextResponse.json(
      { message: "Missing transaction reference", status: "error" },
      { status: 400 }
    );
  }

  try {
    // Chapa expects a GET request for verification
    const chapaRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${tax_ref}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    const data = await chapaRes.json();

    if (data.status !== "success") {
      return NextResponse.json(
        { message: "Chapa Verification Failed", status: "error", chapa: data },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Payment successful",
      status: "success",
      chapa: data,
    });
  } catch (e: any) {
    console.log("Error in payment verification:", e);
    return NextResponse.json(
      { message: `Webhook error: ${e.message || e}`, status: "error" },
      { status: 400 }
    );
  }
}
