const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 text-sm rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
      >
        Previous
      </button>
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 text-sm rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
