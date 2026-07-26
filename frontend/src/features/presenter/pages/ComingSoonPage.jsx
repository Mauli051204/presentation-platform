const ComingSoonPage = ({ title, phaseNote }) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
    <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
    <p className="text-sm text-slate-500">{phaseNote}</p>
  </div>
);

export default ComingSoonPage;
