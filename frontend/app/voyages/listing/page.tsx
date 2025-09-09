import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import VoyagesListingClient from "./VoyagesListingClient";

export default async function VoyagesListingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
        redirect("/auth/signin?callbackUrl=/voyages/listing&alert=auth");
  }

  return <VoyagesListingClient />;
}
