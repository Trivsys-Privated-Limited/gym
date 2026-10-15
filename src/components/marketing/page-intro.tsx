import Image from "next/image";

export function PageIntro({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate -mt-16 overflow-hidden border-b border-border pt-16">
      {image && (
        <div className="absolute inset-0 -z-10">
          <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-text">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
