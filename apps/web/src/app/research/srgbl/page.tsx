"use client"

import { useState, type FormEvent } from "react"

type Source = {id:string;contentId:string;editionId:string;sourceId:string;artifactId:string;provenanceId:string;
  language:string;representation:string;rights:"cleared"|"restricted"|"unknown";text?:string}
type Trace = {passageId:string;sources:Source[];evidenceIds:string[];gaps:string[];defaultLevelStatus:"pending"}
type ReviewedLevel = {level:string;epistemic:string;claim:string;evidenceIds:string[];sourceContentIds:string[];boundaryNote?:string}
type ReviewedAnalysis = {id:string;passageId:string;method:string;status:"reviewed";levels:ReviewedLevel[]}
const LEVELS=[
  {id:"S1",name:"Source & Sense",detail:"Identity, edition, artifact, rights and evidence acquisition"},
  {id:"R2",name:"Reality",detail:"What the exact source text states, not what interpreters assert"},
  {id:"G3",name:"Governing Order",detail:"Evidence-supported relations, patterns and alternatives"},
  {id:"B4",name:"Being",detail:"Speaker, recipient, agency and explicitly scoped interpretation"},
  {id:"L5",name:"Light",detail:"Bounded responsible synthesis; never an automatic miracle proof"}
] as const
const API=(process.env.NEXT_PUBLIC_RGBL_API_URL||"").replace(/\/+$/,"")

export default function SRGBLResearchPage(){
  const [id,setId]=useState("mw:passage:hinduism:bhagavad-gita:1:1")
  const [trace,setTrace]=useState<Trace|null>(null)
  const [analyses,setAnalyses]=useState<ReviewedAnalysis[]>([])
  const [reviewNote,setReviewNote]=useState("No reviewed analysis is published for this passage.")
  const [error,setError]=useState("")
  const [busy,setBusy]=useState(false)
  const [active,setActive]=useState("S1")
  async function lookup(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    setTrace(null);setAnalyses([]);setError("")
    setReviewNote("No reviewed analysis is published for this passage.")
    if(!API){setError("Research trace API is not configured. Set NEXT_PUBLIC_RGBL_API_URL to a trusted MoonWitness Fastify instance.");return}
    if(!id.startsWith("mw:passage:")){setError("Use a canonical mw:passage:* ID.");return}
    setBusy(true)
    try {
      const controller=new AbortController()
      const timeout=setTimeout(()=>controller.abort(),8000)
      try {
        const response=await fetch(API+"/v1/research/srgbl/passages/"+encodeURIComponent(id)+"/source-trace",{signal:controller.signal,headers:{accept:"application/json"}})
        if(!response.ok)throw new Error("Source trace not found or unavailable ("+response.status+")")
        const body=await response.json() as {success:boolean;data:Trace}
        if(!body.success||!Array.isArray(body.data?.sources))throw new Error("Unexpected trace payload")
        setTrace(body.data)
        const reviewedRes=await fetch(API+"/v1/research/srgbl/passages/"+encodeURIComponent(id)+"/analysis",{
          signal:controller.signal,headers:{accept:"application/json"}
        })
        if(reviewedRes.ok){
          const reviewed=await reviewedRes.json() as {success:boolean;analyses:ReviewedAnalysis[]}
          if(reviewed.success && Array.isArray(reviewed.analyses)){
            setAnalyses(reviewed.analyses)
            setReviewNote("Only previously reviewed, corpus-pinned derived claims are shown.")
          }
        } else if(reviewedRes.status!==404){
          setReviewNote("Reviewed analysis is unavailable or failed integrity validation; no claims are displayed.")
        }
      } finally {clearTimeout(timeout)}
    } catch(ex){setError(ex instanceof Error?ex.message:"Source lookup failed")} finally {setBusy(false)}
  }
  const currentClaims=analyses.flatMap(a=>a.levels.filter(c=>c.level===active).map(c=>({...c,analysisId:a.id,method:a.method})))
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-foreground">
    <header className="space-y-2">
      <a href="/" className="text-sm text-muted-foreground underline">← Corpus Explorer</a>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">MoonWitness · Research preview · SRGBL v8</p>
      <h1 className="text-3xl font-semibold">Five-Layer Witness</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Trace source provenance first. Other stages remain UNKNOWN until reviewed, evidence-backed analysis exists. This tool never scores scripture, religious traditions or alleged miracles.</p>
    </header>
    <form onSubmit={lookup} className="flex flex-wrap gap-2" aria-label="Find a canonical passage source trace">
      <label className="min-w-64 flex-1 text-sm" htmlFor="passage-id">Canonical passage ID
        <input id="passage-id" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={id} onChange={e=>setId(e.target.value)} spellCheck={false} />
      </label>
      <button type="submit" disabled={busy} className="self-end rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-60">{busy?"Reading…":"Trace source"}</button>
    </form>
    {error&&<p role="alert" className="rounded-md border p-3 text-sm">{error}</p>}
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-5" role="tablist" aria-label="SRGBL five layers">
      {LEVELS.map(x=><button key={x.id} type="button" role="tab" aria-selected={active===x.id} onClick={()=>setActive(x.id)}
       className={"rounded-lg border p-3 text-left "+(active===x.id?"bg-muted":"bg-background")}>
         <span className="block text-lg font-semibold">{x.id}</span><span className="text-xs">{x.name}</span>
       </button>)}
    </div>
    <section role="tabpanel" aria-live="polite" className="min-h-56 rounded-lg border p-5">
      <h2 className="text-xl font-semibold">{LEVELS.find(x=>x.id===active)?.name}</h2>
      <p className="my-2 text-sm text-muted-foreground">{LEVELS.find(x=>x.id===active)?.detail}</p>
      {active==="S1"&&trace&&<>
        <p className="my-3 text-sm">Exact passage: <code className="break-all">{trace.passageId}</code></p>
        <p className="my-2 text-sm">Evidence pointers: {trace.evidenceIds.length}. Rights are not assumed from text age, language or religion.</p>
        <div className="space-y-3">{trace.sources.map(s=><article key={s.id} className="rounded-md border p-3 text-sm">
          <div className="mb-2 flex flex-wrap gap-3"><strong>{s.language}</strong><span>{s.representation}</span><span>Rights: {s.rights}</span></div>
          <p className="break-all text-xs text-muted-foreground">Content: {s.contentId} · Edition: {s.editionId||"UNKNOWN"} · Artifact: {s.artifactId||"UNKNOWN"} · Provenance: {s.provenanceId||"UNKNOWN"}</p>
          {s.rights==="cleared" && s.text ? <p dir="auto" className="mt-3 whitespace-pre-wrap">{s.text}</p> : <p className="mt-2 italic">Source text withheld until edition rights are explicitly cleared.</p>}
        </article>)}</div>
        {trace.gaps.length>0&&<div className="mt-4 rounded-md border p-3"><strong className="text-sm">Unresolved evidence gaps</strong><ul className="mt-1 list-inside list-disc text-xs">{trace.gaps.map(x=><li key={x}>{x}</li>)}</ul></div>}
      </>}
      {active==="S1"&&!trace&&<p className="text-sm">Enter a passage to inspect provenance; no automatic S1 approval.</p>}
      {currentClaims.length>0&&<div className="mt-4 space-y-3" aria-label="Reviewed claims">
        <h3 className="text-sm font-semibold">Reviewed derived claims — not original scripture</h3>
        {currentClaims.map((c,i)=><article key={c.analysisId+"-"+c.level+"-"+i} className="rounded-md border p-3 text-sm">
          <p className="text-xs text-muted-foreground">Method: {c.method} · Epistemic kind: {c.epistemic} · Analysis: {c.analysisId}</p>
          <p dir="auto" className="my-2 whitespace-pre-wrap">{c.claim}</p>
          {c.boundaryNote&&<p className="mt-2 text-xs"><strong>Boundary:</strong> {c.boundaryNote}</p>}
          <p className="mt-2 break-all text-xs text-muted-foreground">Evidence: {c.evidenceIds.join(", ")} · Source content: {c.sourceContentIds.join(", ")}</p>
        </article>)}
      </div>}
      {active!=="S1"&&currentClaims.length===0&&<p className="mt-5 text-sm">UNKNOWN / not materialized. This stage requires source-linked claims, an accountable method, independent review and explicit limitations. No synthetic interpretation is generated.</p>}
      {trace&&<p className="mt-4 text-xs text-muted-foreground" role="status">{reviewNote}</p>}
    </section>
    <footer className="text-xs text-muted-foreground">Maturity /15 · Quality /40 · Witness /100 · Direction −2..+2 are separate research metrics, withheld until a valid reviewed analysis exists. <a href="https://github.com/bjo163/moonwitness-corpus/blob/dev/docs/SRGBL-V8-MASTER-RFC.md" className="underline">Read the methodology</a>.</footer>
  </main>
}
