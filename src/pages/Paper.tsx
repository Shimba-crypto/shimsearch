import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Logo from "../components/Logo";
import TopLinks from "../components/TopLinks";
import { usePageTitle } from "../lib/usePageTitle";

export default function Paper({ token }: { token: string }) {
  const { id } = useParams();
  const [paper, setPaper] = useState<any>(null);
  const [error, setError] = useState(false);
  usePageTitle(paper ? `${paper.title} - ShimSearch` : "Paper");

  useEffect(() => {
    setPaper(null);
    setError(false);
    fetch(`/api/paper/${encodeURIComponent(id || "")}`, { headers: token ? { "X-Search-Token": token } : {} })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPaper)
      .catch(() => setError(true));
  }, [id, token]);

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 bg-white">
        <div className="flex items-center gap-4 sm:gap-8 px-4 sm:px-6 pt-4 pb-2 max-w-[1100px] mx-auto">
          <Link to="/" aria-label="ShimSearch home"><Logo size="sm" /></Link>
          <Link to="/search" className="text-[14px] text-[#1a73e8] hover:underline">Back to search</Link>
          <div className="hidden md:block ml-auto shrink-0"><TopLinks token={token} user={null} logout={undefined} /></div>
        </div>
      </header>

      <div className="max-w-[700px] mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="mt-4">
            <p className="text-[20px] font-light text-[#202124]">Paper not found.</p>
            <p className="text-[14px] text-[#70757a] mt-2">
              It may have been removed — <Link to="/search" className="text-[#1a0dab] hover:underline">search again</Link>.
            </p>
          </div>
        )}

        {paper && (
          <>
            <div className="text-[13px] leading-[20px] text-[#70757a]">
              shimsearch.onrender.com <span className="text-[#202124]">›</span> papers{" "}
              <span className="text-[#202124]">›</span> {paper.subject || `Grade ${paper.grade}`}
            </div>
            <h1 className="text-[28px] leading-[34px] text-[#1a0dab] mt-[2px]">{paper.title}</h1>
            <p className="text-[14px] leading-[22px] text-[#4d5156] mt-1">
              {paper.type === "paper" ? "ECZ past exam paper" : "Search result"}
              {paper.source && paper.source !== "unknown" && ` · Source: ${paper.source}`}
            </p>

            <div className="mt-6 bg-[#f8f9fa] border border-[#dadce0] rounded-lg overflow-hidden text-[14px]">
              <div className="px-4 py-3 grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 sm:grid-cols-[160px_1fr]">
                {paper.subject ? <><span className="text-[#70757a]">Subject</span><span>{paper.subject}</span></> : null}
                {paper.grade ? <><span className="text-[#70757a]">Grade</span><span>{paper.grade}</span></> : null}
                {paper.year ? <><span className="text-[#70757a]">Year</span><span>{paper.year}</span></> : null}
                <span className="text-[#70757a]">Source</span><span>{paper.source || "unknown"}</span>
              </div>
            </div>

            {paper.type === "paper" && (
              <div className="mt-8">
                <h2 className="text-[18px] font-medium text-[#202124]">
                  Related {paper.subject ? `${paper.subject}` : "papers"}
                  {paper.grade ? ` · Grade ${paper.grade}` : ""}
                </h2>
                {paper.related?.length ? (
                  <div className="mt-3 space-y-4">
                    {paper.related.map((p: any) => (
                      <div key={p.id}>
                        <Link to={`/paper/${p.id}`} className="text-[16px] leading-[22px] text-[#1a0dab] hover:underline">
                          {p.title}
                        </Link>
                        <div className="text-[13px] leading-[18px] text-[#70757a]">
                          {p.subject ? `${p.subject} · ` : ""}Grade {p.grade}{p.year ? ` · ${p.year}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#70757a] mt-2">No related papers found.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
