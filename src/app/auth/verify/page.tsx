import { SendVerificationEmailForm } from "@/components/send-verification-email-form";
import { redirect } from "next/navigation";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const searchP = await searchParams;
  const error = searchP.error;

  const token = searchP.token;

  console.log("tooookkkkkeeennnnnnnnn", token);

  if (token){
    return (
      <div>
        Email verified successfully! You can now close this tab.
        <br />
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => redirect("/")}
        >
          Go to Home
        </button>
        <br />
        <p className="text-muted-foreground">
          If you are not redirected automatically, click the button above.
        </p>
      </div>
    )
  }

  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Verify Email</h1>
      </div>

      <p className="text-destructive">
        <span className="capitalize">
          {error.replace(/_/g, " ").replace(/-/g, " ")}
        </span>{" "}
        - Please request a new verification email.
      </p>

      <SendVerificationEmailForm />
    </div>
  );
}
