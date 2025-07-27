"use client";

import React, { useEffect, useState, useRef } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/stores/cart-store"; // You can keep this to clear the visual count

type OrderStatus = "PENDING" | "PAID" | "FAILED";

const OrderConfirmationPage = () => {
  const searchParams = useSearchParams();
  const tx_ref = searchParams.get("tx_ref");

  console.log("Transaction Reference:", tx_ref);

  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const { clearCart } = useCartStore(); // Let's rename for clarity

  // Use a ref to store the interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!tx_ref) {
      setStatus("FAILED");
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/order/status?tx_ref=${tx_ref}`);
        if (!res.ok) throw new Error("Failed to fetch status");
        
        const data: { status: OrderStatus } = await res.json();
        
        // If status is no longer PENDING, stop polling
        if (data.status !== "PENDING") {
          setStatus(data.status);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (data.status === "PAID") {
            clearCart(); // Clear the visual cart count in the header
          }
        }
      } catch (error) {
        console.error("Error checking order status:", error);
        setStatus("FAILED"); // If polling fails, assume an error
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    };

    // Start polling immediately and then every 3 seconds
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 3000);

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tx_ref, clearCart]);


  const renderContent = () => {
    switch (status) {
      case "PENDING":
        return (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying your payment...</h2>
            <p className="text-muted-foreground">Please wait a moment. Do not close this page.</p>
          </>
        );
      case "PAID":
        return (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">Thank you for your purchase. A confirmation has been sent to your email.</p>
            <Button asChild><Link href="/account/orders">View My Orders</Link></Button>
          </>
        );
      case "FAILED":
      default:
        return (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Failed or Canceled</h2>
            <p className="text-muted-foreground mb-6">There was an issue with your payment. Your order was not completed. Please try again or contact support.</p>
            <Button asChild variant="outline"><Link href="/products">Back to Shop</Link></Button>
          </>
        );
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="bg-white dark:bg-muted border rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default OrderConfirmationPage;