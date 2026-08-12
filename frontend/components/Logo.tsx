import Image from "next/image";

export default function Logo({ size = 44, textClassName = "text-2xl" }: { size?: number; textClassName?: string }) {
  return (
    <span className="group flex items-center gap-1.5 transition-all duration-300">
      <div className="relative flex items-center justify-center">
        <Image 
          src="/images/credence-logo.png" 
          alt="Credence logo" 
          width={size} 
          height={size} 
          quality={100}
          unoptimized
          priority 
          className="relative z-10 transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-3"
        />
      </div>
      
      <span className={`font-serif font-semibold tracking-tight text-ink transition-colors duration-300 group-hover:text-accent-ink ${textClassName}`}>
        Credence
      </span>
    </span>
  );
}
