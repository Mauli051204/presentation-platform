const Table = ({ columns, children }) => (
  <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
    <table className="w-full text-sm min-w-[640px] sm:min-w-0">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          {columns.map((col) => (
            <th key={col} className="py-2.5 px-3 font-medium text-slate-500 whitespace-nowrap">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  </div>
);

export default Table;
