export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-14 md:gap-5 md:px-6 md:py-20">
        <p className="text-center text-[28px] font-semibold tracking-[-0.03em] text-ink md:text-[40px]">
          Not financial advice. DYOR.
        </p>
        <p className="text-center text-[12px] text-muted md:text-[13px]">
          made by{" "}
          <a
            href="https://x.com/saurav_tweets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted underline decoration-hairline underline-offset-2 transition-colors hover:text-ink"
          >
            saurav_tweets
          </a>
        </p>
      </div>
    </footer>
  );
}
