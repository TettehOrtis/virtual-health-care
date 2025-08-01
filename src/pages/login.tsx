import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth');
  }, [router]);

  return null;
}
