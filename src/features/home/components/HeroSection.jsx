export function HeroSection() {
  return (
    <section className="flex min-h-[80vh] items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          Welcome to our starter kit
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Build something
          <span className="text-primary"> extraordinary.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          A simple starting point for creating beautiful, modern web
          experiences. Bring your ideas to life.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#features"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </a>

          <a
            href="#about"
            className="rounded-lg border px-6 py-3 font-medium transition-colors hover:bg-accent"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
