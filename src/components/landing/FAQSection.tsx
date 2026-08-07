import { faqs } from "@/lib/landing-content";

export function FAQSection() {
  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">
          Frequently asked questions
        </h2>

        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-display text-base font-bold text-navy-900">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
