type InvoicePdfButtonProps = {
  invoiceId: string
}

export default function InvoicePdfButton({
  invoiceId,
}: InvoicePdfButtonProps) {
  return (
    <a
      href={`/api/invoices/${invoiceId}/pdf`}
      className="glass-button motion-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
    >
      Download PDF
    </a>
  )
}