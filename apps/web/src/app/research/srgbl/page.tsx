"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"

type Source = {id:string;contentId:string;editionId:string;sourceId:string;artifactId:string;provenanceId:string;
  language:string;representation:string;rights:"cleared"|"restricted"|"unknown";text?:string}
type Trace = {passageId:string;sources:Source[];evidenceIds:string[];gaps:string[];defaultLevelStatus:"pending"}
type ReviewedLevel = {level:string;epistemic:string;claim:string;evidenceIds:string[];sourceContentIds:string[];boundaryNote?:string}
type ReviewedAnalysis = {id:string;passageId:string;method:string;status:"reviewed";levels:ReviewedLevel[]}
type StaticResearchIndex = {schema:"srgbl-v8-static-public-v1";corpusHash:string;methodVersion:string;analyses:ReviewedAnalysis[]}
const LEVELS=[
  {id:"S1",name:"Source & Sense",detail:"Identity, edition, artifact, rights and evidence acquisition"},
  {id:"R2",name:"Reality",detail:"What the exact source text states, not what interpreters assert"},
  {id:"G3",name:"Governing Order",detail:"Evidence-supported relations, patterns and alternatives"},
  {id:"B4",name:"Being",detail:"Speaker, recipient, agency and explicitly scoped interpretation"},
  {id:"L5",name:"Light",detail:"Bounded responsible synthesis; never an automatic miracle proof"}
] as const
const API=(process.env.NEXT_PUBLIC_RGBL_API_URL||"").replace(/\/+$/,"")

type ReviewedKeyMessage = {status:"reviewed";message:string;method:string;frame:string;contextNote:string;boundaryNote:string;evidenceIds:string[];sourceContentIds:string[]}
const nonBlank=(value:unknown):value is string=>typeof value==="string"&&value.trim().length>0

// A derived message is shown only when its method, frame, context, boundary and evidence are all stated.
function isReviewedKeyMessage(value:unknown):value is ReviewedKeyMessage {
  if(!value||typeof value!=="object") return false
  const m=value as Record<string,unknown>
  return m.status==="reviewed"&&nonBlank(m.message)&&m.message.length<=5000&&nonBlank(m.method)&&
    nonBlank(m.frame)&&nonBlank(m.contextNote)&&nonBlank(m.boundaryNote)&&
    Array.isArray(m.evidenceIds)&&m.evidenceIds.length>0&&m.evidenceIds.every(nonBlank)&&
    Array.isArray(m.sourceContentIds)&&m.sourceContentIds.length>0&&m.sourceContentIds.every(nonBlank)
}

type SwingCandidate = {id:string;operator:string;relation:string;depth:1|2|3;evidenceStatus:"unverified";sourcePassageId?:string}

// A Swing candidate is an unreviewed search lead: only depth 1..3 and an unverified status may render.
function isSwingCandidate(value:unknown):value is SwingCandidate {
  if(!value||typeof value!=="object") return false
  const c=value as Record<string,unknown>
  return nonBlank(c.id)&&nonBlank(c.operator)&&nonBlank(c.relation)&&
    (c.depth===1||c.depth===2||c.depth===3)&&c.evidenceStatus==="unverified"&&
    (c.sourcePassageId===undefined||(typeof c.sourcePassageId==="string"&&c.sourcePassageId.startsWith("mw:passage:")))
}

type ReviewedRelation = {id:string;lens:string;type:string;subjectPassageId:string;objectPassageId:string;evidenceIds:string[];reviewStatus:"reviewed";uncertainty:string;frameNote?:string}
const RELATION_TYPES:Record<string,{label:string;correction:boolean}>={
  AFFIRMS:{label:"affirms",correction:false},
  PARALLELS:{label:"parallels",correction:false},
  CLARIFIES:{label:"clarifies",correction:false},
  QUALIFIES:{label:"qualifies",correction:false},
  CONTRASTS:{label:"contrasts",correction:false},
  CORRECTS_WITHIN_FRAME:{label:"correction within a declared frame",correction:true},
  UNRESOLVED:{label:"unresolved",correction:false},
  NOT_RELATED:{label:"not related",correction:false}
}

// A reviewed relation needs a lens, a precise pair, typed relation, evidence, uncertainty and, for a correction, its frame.
function isReviewedRelation(value:unknown):value is ReviewedRelation {
  if(!value||typeof value!=="object") return false
  const r=value as Record<string,unknown>
  return nonBlank(r.id)&&nonBlank(r.lens)&&nonBlank(r.type)&&RELATION_TYPES[r.type as string]!==undefined&&
    nonBlank(r.subjectPassageId)&&r.subjectPassageId.startsWith("mw:passage:")&&
    nonBlank(r.objectPassageId)&&r.objectPassageId.startsWith("mw:passage:")&&
    nonBlank(r.uncertainty)&&r.reviewStatus==="reviewed"&&
    Array.isArray(r.evidenceIds)&&r.evidenceIds.length>0&&r.evidenceIds.every(nonBlank)&&
    (!RELATION_TYPES[r.type as string].correction||(typeof r.frameNote==="string"&&r.frameNote.trim().length>0))
}

function isReviewedAnalysis(value:unknown):value is ReviewedAnalysis {
  if(!value||typeof value!=="object") return false
  const item=value as Record<string,unknown>
  if(typeof item.id!=="string"||typeof item.passageId!=="string"||!item.passageId.startsWith("mw:passage:")||
    typeof item.method!=="string"||item.status!=="reviewed"||!Array.isArray(item.levels)) return false
  const seen=new Set<string>()
  return item.levels.every((level:unknown)=>{
    if(!level||typeof level!=="object") return false
    const claim=level as Record<string,unknown>
    if(typeof claim.level!=="string"||!["S1","R2","G3","B4","L5"].includes(claim.level)||seen.has(claim.level)||
      typeof claim.epistemic!=="string"||!["observed","inferred","interpreted"].includes(claim.epistemic)||
      typeof claim.claim!=="string"||claim.claim.trim().length===0||claim.claim.length>5000||
      !Array.isArray(claim.evidenceIds)||claim.evidenceIds.length===0||!claim.evidenceIds.every(x=>typeof x==="string"&&x.trim())||
      !Array.isArray(claim.sourceContentIds)||claim.sourceContentIds.length===0||!claim.sourceContentIds.every(x=>typeof x==="string"&&x.trim())||
      (claim.level==="L5"&&(typeof claim.boundaryNote!=="string"||!claim.boundaryNote.trim()))||
      (claim.boundaryNote!==undefined&&typeof claim.boundaryNote!=="string")) return false
    seen.add(claim.level)
    return true
  })
}

export default function SRGBLResearchPage(){
  const [id,setId]=useState("mw:passage:hinduism:bhagavad-gita:1:1")
  const [trace,setTrace]=useState<Trace|null>(null)
  const [analyses,setAnalyses]=useState<ReviewedAnalysis[]>([])
  const [reviewNote,setReviewNote]=useState("No reviewed analysis is published for this passage.")
  const [error,setError]=useState("")
  const [busy,setBusy]=useState(false)
  const [active,setActive]=useState("S1")
  const [swing,setSwing]=useState<string|null>(null)
  const [lensFilter,setLensFilter]=useState("")
  async function lookup(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    setTrace(null);setAnalyses([]);setError("")
    setReviewNote("No reviewed analysis is published for this passage.")
    if(!id.startsWith("mw:passage:")){setError("Use a canonical mw:passage:* ID.");return}
    setBusy(true)
    try {
      const controller=new AbortController()
      const timeout=setTimeout(()=>controller.abort(),8000)
      try {
        if(!API){
          const response=await fetch("/research/srgbl/reviewed.json",{signal:controller.signal,headers:{accept:"application/json"}})
          if(response.status===404){
            setReviewNote("No static reviewed analysis is published. A live source trace requires the research API.")
            return
          }
          if(!response.ok) throw new Error("Static reviewed research is unavailable ("+response.status+")")
          const body=await response.json() as Partial<StaticResearchIndex>
          if(body.schema!=="srgbl-v8-static-public-v1"||typeof body.corpusHash!=="string"||
            !/^[a-f0-9]{64}$/.test(body.corpusHash)||typeof body.methodVersion!=="string"||
            !Array.isArray(body.analyses)||!body.analyses.every(isReviewedAnalysis)) {
            throw new Error("Static reviewed research failed its data contract")
          }
          const catalogResponse=await fetch("/corpus-catalog.json",{signal:controller.signal,headers:{accept:"application/json"}})
          if(!catalogResponse.ok) throw new Error("Trusted static corpus catalog is unavailable")
          const catalog=await catalogResponse.json() as {schemaVersion?:unknown;corpusHash?:unknown}
          if(catalog.schemaVersion!==1||catalog.corpusHash!==body.corpusHash) {
            throw new Error("Static reviewed research belongs to a different corpus version")
          }
          const matches=body.analyses.filter(analysis=>analysis.passageId===id)
          setAnalyses(matches)
          setReviewNote(matches.length
            ? "Showing corpus-pinned reviewed claims from the static index. Live source metadata is unavailable."
            : "No reviewed analysis is published for this passage in the static index.")
          return
        }
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
  const reviewedLevels=new Set(analyses.flatMap(a=>a.levels.map(c=>c.level)))
  // Roving tab stop plus arrow/Home/End keys, so the five tabs never require a pointer.
  const moveTab=(event:KeyboardEvent<HTMLDivElement>)=>{
    const index=LEVELS.findIndex(x=>x.id===active)
    const next=event.key==="ArrowRight"||event.key==="ArrowDown"?LEVELS[(index+1)%LEVELS.length].id
      :event.key==="ArrowLeft"||event.key==="ArrowUp"?LEVELS[(index+LEVELS.length-1)%LEVELS.length].id
      :event.key==="Home"?LEVELS[0].id
      :event.key==="End"?LEVELS[LEVELS.length-1].id:null
    if(!next) return
    event.preventDefault()
    setActive(next)
  }
  // Per-stage status: a source trace is not a reviewed claim, and nothing is invented.
  const stageStatus=(level:string)=>{
    if(reviewedLevels.has(level)) return "reviewed"
    if(level==="S1"&&trace) return "source trace"
    return "UNKNOWN"
  }
  const currentClaims=analyses.flatMap(a=>a.levels.filter(c=>c.level===active).map(c=>({...c,analysisId:a.id,method:a.method})))
  const relationPool=analyses.flatMap(a=>{
    const value=(a as unknown as {relations?:unknown}).relations
    return Array.isArray(value)?value:[]
  })
  const relations=relationPool.filter(isReviewedRelation)
  const withheldRelations=relationPool.length-relations.length
  const lenses=[...new Set(relations.map(r=>r.lens))].sort()
  const visibleRelations=lensFilter?relations.filter(r=>r.lens===lensFilter):relations
  const swingPool=analyses.flatMap(a=>{
    const value=(a as unknown as {swingCandidates?:unknown}).swingCandidates
    return Array.isArray(value)?value:[]
  })
  const swings=swingPool.filter(isSwingCandidate)
  const withheldSwings=swingPool.length-swings.length
  const messages=analyses.flatMap(a=>{
    const key=(a as {keyMessage?:unknown}).keyMessage
    return isReviewedKeyMessage(key)?[{...key,analysisId:a.id}]:[]
  })
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-foreground">
    <header className="space-y-2">
      <a href="/explorer" className="text-sm text-muted-foreground underline">← Corpus Explorer</a>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">MoonWitness · Research preview · SRGBL v8</p>
      <h1 className="text-3xl font-semibold">Five-Layer Witness</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Trace source provenance first. Other stages remain UNKNOWN until reviewed, evidence-backed analysis exists. This tool never scores scripture, religious traditions or alleged miracles.</p>
      <p className="text-xs text-muted-foreground">Looking for the derived key and message for one passage? <a href="/research/key-witness" className="underline">Titik Tengah card</a>.</p>
    </header>
    <form onSubmit={lookup} className="flex flex-wrap gap-2" aria-label="Find a canonical passage source trace">
      <label className="min-w-64 flex-1 text-sm" htmlFor="passage-id">Canonical passage ID
        <input id="passage-id" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={id} onChange={e=>setId(e.target.value)} spellCheck={false} />
      </label>
      <button type="submit" disabled={busy} className="self-end rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-60">{busy?"Reading…":API?"Trace source":"Load reviewed research"}</button>
    </form>
    {error&&<p role="alert" className="rounded-md border p-3 text-sm">{error}</p>}
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-5" role="tablist" aria-label="SRGBL five layers" onKeyDown={moveTab}>
      {LEVELS.map(x=><button key={x.id} id={"stage-tab-"+x.id} type="button" role="tab" aria-selected={active===x.id}
       aria-controls="stage-panel" tabIndex={active===x.id?0:-1} onClick={()=>setActive(x.id)}
       className={"min-w-0 rounded-lg border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:transition-colors "+(active===x.id?"bg-muted":"bg-background")}>
         <span className="block text-lg font-semibold">{x.id}</span><span className="text-xs">{x.name}</span>
         <span data-stage-status={x.id} className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{stageStatus(x.id)}</span>
       </button>)}
    </div>
    <section id="stage-panel" role="tabpanel" aria-labelledby={"stage-tab-"+active} aria-live="polite" tabIndex={0}
      className="min-h-56 max-w-full overflow-x-auto rounded-lg border p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
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
      {active==="S1"&&!trace&&currentClaims.length===0&&<p className="text-sm">Enter a passage to inspect provenance; no automatic S1 approval.</p>}
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
      <section className="mt-5 rounded-md border p-3" aria-labelledby="derived-message">
        <h3 id="derived-message" className="text-sm font-semibold">Derived message (not original scripture)</h3>
        {messages.length===0
          ? <p className="mt-2 text-sm">No reviewed key message is published for this passage. An unreviewed, unbounded or incompletely evidenced message stays withheld rather than drafted.</p>
          : messages.map(m=><article key={m.analysisId} className="mt-3 rounded-md border p-3 text-sm">
              <p className="text-xs text-muted-foreground">Method: {m.method} · Frame: {m.frame} · Analysis: {m.analysisId}</p>
              <p dir="auto" className="my-2 whitespace-pre-wrap">{m.message}</p>
              <p className="text-xs"><strong>Context:</strong> {m.contextNote}</p>
              <p className="mt-1 text-xs"><strong>Boundary:</strong> {m.boundaryNote}</p>
              <p className="mt-2 break-all text-xs text-muted-foreground">Evidence: {m.evidenceIds.join(", ")} · Source content: {m.sourceContentIds.join(", ")}</p>
            </article>)}
      </section>
      <section className="mt-5 rounded-md border p-3" aria-labelledby="swing-candidates">
        <h3 id="swing-candidates" className="text-sm font-semibold">Swing candidates (unreviewed leads)</h3>
        {swings.length===0
          ? <p className="mt-2 text-sm">No swing candidate is published. A candidate is a search lead, not evidence, and never inherits a source score.</p>
          : <ul className="mt-3 space-y-2" role="list">{swings.map(s=><li key={s.id}>
              <button type="button" aria-pressed={swing===s.id} onClick={()=>setSwing(swing===s.id?null:s.id)}
                className="w-full rounded-md border p-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
                <span className="mr-2 rounded border px-1 text-[10px] font-semibold uppercase tracking-wide">Unverified</span>
                <span className="text-xs">depth {s.depth} · {s.relation} · {s.operator} · evidence: {s.evidenceStatus}</span>
              </button>
              {swing===s.id&&<p className="mt-1 break-all px-2 text-xs text-muted-foreground">Candidate {s.id}{s.sourcePassageId?" · source origin: "+s.sourcePassageId:" · source origin: UNKNOWN"}. No reviewed claim, no inherited score and no supporting reference is implied.</p>}
            </li>)}</ul>}
        {withheldSwings>0&&<p className="mt-2 text-xs text-muted-foreground">{withheldSwings} candidate(s) withheld: a candidate must state depth 1-3, an unverified evidence status and a canonical source origin.</p>}
      </section>
      <section className="mt-5 rounded-md border p-3" aria-labelledby="comparative-lens">
        <h3 id="comparative-lens" className="text-sm font-semibold">Comparative lens (interpretation, not neutral truth)</h3>
        {relations.length>0&&<label className="mt-2 block text-xs" htmlFor="lens-filter">Filter by lens
          <select id="lens-filter" className="mt-1 block w-full rounded-md border bg-background p-2 text-sm" value={lensFilter} onChange={e=>setLensFilter(e.target.value)}>
            <option value="">All declared lenses</option>
            {lenses.map(lens=><option key={lens} value={lens}>{lens}</option>)}
          </select>
        </label>}
        {visibleRelations.length===0
          ? <p className="mt-2 text-sm">No reviewed comparative relation is published for this passage and lens.</p>
          : <ul className="mt-3 space-y-2" role="list">{visibleRelations.map(r=><li key={r.id} className="rounded-md border p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide">Lens: {r.lens} · {RELATION_TYPES[r.type].label}</p>
              <p className="mt-1 break-all text-xs">Pair: {r.subjectPassageId} {'->'} {r.objectPassageId}</p>
              <p className="mt-1 text-xs">Review status: {r.reviewStatus} · Evidence: {r.evidenceIds.join(", ")}</p>
              <p className="mt-1 text-xs"><strong>Uncertainty:</strong> {r.uncertainty}</p>
              {RELATION_TYPES[r.type].correction
                ? <p className="mt-2 text-xs">Interpretation within the {r.lens} frame, not a cross-relational neutral truth. Frame: {r.frameNote}</p>
                : <p className="mt-2 text-xs">Neutral comparison within the {r.lens} lens: no correction is claimed and no tradition is ranked.</p>}
            </li>)}</ul>}
        {withheldRelations>0&&<p className="mt-2 text-xs text-muted-foreground">{withheldRelations} relation(s) withheld: a relation needs a lens, a canonical pair, a supported relation type, evidence, uncertainty and a declared frame for any correction.</p>}
      </section>
      {reviewNote&&<p className="mt-4 text-xs text-muted-foreground" role="status">{reviewNote}</p>}
    </section>
    <footer className="text-xs text-muted-foreground">Maturity /15 · Quality /40 · Witness /100 · Direction −2..+2 are separate research metrics, withheld until a valid reviewed analysis exists. <a href="https://github.com/bjo163/moonwitness-corpus/blob/dev/docs/SRGBL-V8-MASTER-RFC.md" className="underline">Read the methodology</a>.</footer>
  </main>
}
