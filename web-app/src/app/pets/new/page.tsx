'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PetsNewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pets/register');
  }, [router]);

  return null;
}
