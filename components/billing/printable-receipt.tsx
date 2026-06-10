import { formatAmountDh, formatPlanLabel, shortReceiptId } from "@/lib/billing";
import type { PaymentRow } from "@/lib/billing";

type PrintableReceiptProps = {
  payment: PaymentRow;
};

export function PrintableReceipt({ payment }: PrintableReceiptProps) {
  const issuedAt = new Date(payment.payment_date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="hidden bg-white text-black print:block">
      <div className="mx-auto max-w-2xl p-10 font-sans text-black">
        <header className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-2xl font-bold tracking-[0.2em]">
            SPORTS SALLE - RECEIPT
          </h1>
        </header>

        <section className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">Receipt ID</span>
            <span>{shortReceiptId(payment.id)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date</span>
            <span>{issuedAt}</span>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">
            Bill To
          </h2>
          <p className="text-base font-semibold">{payment.memberName}</p>
          <p className="text-sm">{payment.memberPhone ?? "No phone on file"}</p>
        </section>

        <section className="mt-8">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 text-left font-bold">Description</th>
                <th className="py-2 text-left font-bold">Plan Details</th>
                <th className="py-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/20">
                <td className="py-4 pr-4 align-top">Gym Membership Plan Access</td>
                <td className="py-4 pr-4 align-top">
                  {formatPlanLabel(payment.planType)}
                </td>
                <td className="py-4 text-right align-top font-semibold">
                  {formatAmountDh(payment.amount)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-4 text-right font-bold">
                  Total Paid
                </td>
                <td className="pt-4 text-right text-base font-bold">
                  {formatAmountDh(payment.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="mt-16">
          <div className="border-t border-black pt-2">
            <p className="text-sm font-semibold">Authorized Signature</p>
          </div>
        </section>

        <footer className="mt-10 border-t border-black/20 pt-6 text-center text-sm">
          <p>Thank you for choosing Sports Salle! Stay strong.</p>
        </footer>
      </div>
    </div>
  );
}
