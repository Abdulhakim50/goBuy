"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { use } from "react";

type Params = Promise<{ tax_ref: string }>;

const OrderConfirmationPage = ({ params }: { params: Params }) => {
  const param = use(params);
  const tax_ref = param.tax_ref;
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    async function fetchOrderConfirmation() {
      setLoading(true);
      try {
        const res = await fetch(`/api/confirm?tax_ref=${tax_ref}`);
        const data = await res.json();
        setStatus(data.status === "success" ? "success" : "error");
      } catch {
        setStatus("error");
      } finally {
        setLoading(false);
      }
    }
    fetchOrderConfirmation();
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="bg-white dark:bg-muted border rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Checking your payment...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your order.
            </p>
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            <Button asChild>
              <Link href="/account/orders">View My Orders</Link>
            </Button>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Confirmation Failed</h2>
            <p className="text-muted-foreground mb-6">
              There was an error confirming your order. Please contact support.
            </p>
            <Button asChild variant="outline">
              <Link href="/products">Back to Shop</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
