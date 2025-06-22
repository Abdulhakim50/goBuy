"use client";

import { chapaPaymentInitaization } from "@/actions/chapa";
import { useRouter } from "next/navigation";
import React from "react";

const ChapaForm = () => {
  const router = useRouter();
  async function handleClick() {
    const res = await chapaPaymentInitaization();
    if (res.status === "success") {
      router.push(res.data.checkout_url);
    }
    console.log('respponnnnsnsnnsnsn',res);
  }

  return (
    <div>
        <button onClick={handleClick}>submit</button>
    
    </div>
  );
};

export default ChapaForm;
