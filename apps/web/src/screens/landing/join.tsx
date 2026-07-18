import Link from "next/link";

export default function Join() {
  return (
    <section id="join" className="py-28">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-3xl leading-snug text-mos-text md:text-5xl">
          Хватит быть героем в цифровом мире.
          <br />
          <span className="text-mos-amber">Пора взять в руки меч.</span>
        </h2>
        <Link href="/login" className="mos-btn mt-10">
          Войти через OnlyID
        </Link>
      </div>
    </section>
  );
}
