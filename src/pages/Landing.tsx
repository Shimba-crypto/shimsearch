import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Landing() {
  usePageTitle("");
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">ShimSearch</h1>
      <p className="text-gray-500 mt-3 max-w-xl">Search everything Zambian education. ECZ papers, schools, health facilities, and laws. Fast, free, secure.</p>
      <div className="flex flex-wrap gap-3 mt-6">
        <Link to="/search" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-medium">Start Searching</Link>
        <Link to="/pricing" className="text-sm text-gray-600 px-4 py-2 rounded-md border border-gray-300 hover:border-gray-500 font-medium">View Pricing</Link>
      </div>
      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {[{i:"📄",t:"Papers",d:"Search 144+ ECZ past papers by topic, year, grade"},{i:"🏫",t:"Schools",d:"Find schools by location, compare facilities"},{i:"⚖️",t:"Laws",d:"Search Zambian legislation and acts"}].map(f=>(
          <div key={f.t} className="border border-gray-200 rounded-lg p-5"><div className="text-2xl mb-2">{f.i}</div><h3 className="font-semibold">{f.t}</h3><p className="text-sm text-gray-500 mt-1">{f.d}</p></div>
        ))}
      </div>
    </div>
  );
}
