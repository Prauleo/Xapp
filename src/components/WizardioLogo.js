'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function WizardioLogo({ width = 120, height = 120, className = '' }) {
  const router = useRouter();

  return (
    <Image 
      src="/images/wizardiologo.png"
      alt="Wizardio Logo"
      width={width}
      height={height}
      className={`cursor-pointer ${className}`}
      onClick={() => router.push('/')}
    />
  );
}
