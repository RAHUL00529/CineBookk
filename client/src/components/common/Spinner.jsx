export default function Spinner() {
  return (
    <div role="status" className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
