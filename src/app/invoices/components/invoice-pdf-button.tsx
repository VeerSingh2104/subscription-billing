type InvoicePdfButtonProps = {
  invoiceId: string
}

export default function InvoicePdfButton({
  invoiceId,
}: InvoicePdfButtonProps) {
  return (
    <a
      href={`/api/invoices/${invoiceId}/pdf`}
      className="inline-flex rounded-md border px-4 py-2 font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      Download PDF
    </a>
  )
}