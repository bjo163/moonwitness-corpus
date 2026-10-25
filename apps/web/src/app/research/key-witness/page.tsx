"use client"

import { useState, type FormEvent } from "react"
import { groupByKey, validateCitation, type Citation } from "@/lib/key-witness"

/**
 * P18-009: the Titik Tengah card. It shows one derived witness reading next to
 * the record it came from: the witness, the cited keys, the reviewed message,
 * the boundary and what two annotators did not agree on. The card is derived
 * research, so it never presents itself as canonical text, a score or a verdict.
 */
type Card = {passageId:string;corpusHash:string;methodVersion:string;citation:Citation}

const API=(process.env.NEXT_PUBLIC_RGBL_API_URL||"").replace(/\/+$/,"")
const nonBlank=(value:unknown):value is string=>typeof value==="string"&&value.trim().length>0

/**
 * The citation contract lives in `@/lib/key-witness` so the dashboard counts the
 * same rules the card renders. This wrapper only adds the envelope bindings: the
 * card must describe the passage, corpus and method it was requested for.
 */
function parseCard(body:unknown):Card {
  if(!body||typeof body!=="object") throw new Error("The key layer returned no card")
  const envelope=body as Record<string,unknown>
  if(envelope.success!==true) throw new Error("The key layer did not confirm this card")
  const citation=validateCitation(envelope.citation)
  if(citation.passageId!==envelope.passageId) throw new Error("The card describes a different passage than the one requested")
  if(citation.corpusHash!==envelope.corpusHash) throw new Error("The card is not bound to the corpus version it was served for")
  if(citation.methodVersion!==envelope.methodVersion) throw new Error("The card's method version is inconsistent with the envelope")
  if(!nonBlank(envelope.passageId)||!nonBlank(envelope.corpusHash)||!nonBlank(envelope.methodVersion))
    throw new Error("The card envelope is missing its passage, corpus or method identity")
  return {passageId:citation.passageId,corpusHash:citation.corpusHash,methodVersion:citation.methodVersion,citation}
}

export default function KeyWitnessCardPage(){
  const [id,setId]=useState("mw:passage:hinduism:bhagavad-gita:1:1")
  const [card,setCard]=useState<Card|null>(null)
  const [status,setStatus]=useState("")
  const [error,setError]=useState("")
  const [busy,setBusy]=useState(false)

  async function lookup(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    setCard(null);setError("");setStatus("")
    if(!id.startsWith("mw:passage:")){setError("Use a canonical mw:passage:* ID.");return}
    if(!API){setStatus("The key layer is served by the research API. Set NEXT_PUBLIC_RGBL_API_URL to load a card; this static build fabricates nothing.");return}
    setBusy(true)
    try {
      const response=await fetch(API+"/v1/research/key-witness/passages/"+encodeURIComponent(id),
        {headers:{accept:"application/json"},signal:AbortSignal.timeout(8000)})
      if(!response.ok){
        const failure=await response.json().catch(()=>({})) as {error?:unknown}
        const code=typeof failure.error==="string"?failure.error:""
        if(code==="key_witness_not_materialized"){
          setStatus("No sealed key/message index is published yet. An unpublished card is shown as unavailable, never drafted.")
        } else if(code==="key_witness_index_integrity_failure"){
          throw new Error("The published key/message index failed its integrity check, so no card is displayed.")
        } else if(code==="no_key_witness_record_for_passage"){
          setStatus("This passage exists but no reviewed key reading is published for it.")
        } else if(code==="passage_not_found"){
          setStatus("This passage is not in the canonical corpus held by the API.")
        } else if(code==="invalid_passage_id"){
          setError("Use a canonical mw:passage:* ID.")
        } else {
          throw new Error("The key layer answered "+response.status+" without a readable card")
        }
        return
      }
      setCard(parseCard(await response.json()))
      setStatus("Derived key/message card under an explicit frame. It is not canonical scripture and it is not a verdict.")
    } catch(ex){setError(ex instanceof Error?ex.message:"Card lookup failed")} finally {setBusy(false)}
  }

  const grouped=card?groupByKey(card.citation.keys):[]
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-foreground">
    <header className="space-y-2">
      <a href="/" className="text-sm text-muted-foreground underline">← Corpus Explorer</a>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">MoonWitness · Key Witness v0 · derived research</p>
      <h1 className="text-3xl font-semibold">Titik Tengah</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Witness, key, message, boundary and disagreement for one passage. The card cites what was recorded and what was reviewed; it does not resolve the disagreement, rank the reading or score the verse.</p>
    </header>
    <form onSubmit={lookup} className="flex flex-wrap gap-2" aria-label="Load a key witness card">
      <label className="min-w-64 flex-1 text-sm" htmlFor="witness-id">Canonical passage ID
        <input id="witness-id" className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={id} onChange={e=>setId(e.target.value)} spellCheck={false} />
      </label>
      <button type="submit" disabled={busy} className="self-end rounded-md border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:transition-colors disabled:opacity-60">{busy?"Reading…":"Load card"}</button>
    </form>
    {error&&<p role="alert" className="rounded-md border p-3 text-sm">{error}</p>}
    {status&&<p role="status" aria-live="polite" className="rounded-md border p-3 text-xs text-muted-foreground">{status}</p>}

    {card&&<article className="space-y-4" aria-label="Key witness card">
      <section className="rounded-lg border p-4" aria-labelledby="card-witness">
        <h2 id="card-witness" className="text-lg font-semibold">Witness</h2>
        <p className="mt-1 break-all text-xs text-muted-foreground">Passage: {card.passageId} · Corpus: {card.corpusHash.slice(0,12)} · Method: {card.methodVersion}</p>
        <p className="mt-2 break-all text-xs">Edition: {card.citation.editionId} · Artifact: {card.citation.artifactId}{card.citation.contentId?" · Content: "+card.citation.contentId:""}</p>
        <p className="mt-2 text-xs">Text licence: <strong>{card.citation.rights.text}</strong> · Annotation licence: <strong>{card.citation.rights.annotation.kind}</strong>{card.citation.rights.annotation.licenseId?" ("+card.citation.rights.annotation.licenseId+")":""} · Public-domain inference: prohibited</p>
        {card.citation.text
          ? <p dir="auto" className="mt-3 whitespace-pre-wrap rounded-md border p-3 text-sm">{card.citation.text}</p>
          : <p className="mt-3 rounded-md border p-3 text-sm italic">{card.citation.textOmissionReason}</p>}
      </section>

      <section className="rounded-lg border p-4" aria-labelledby="card-keys">
        <h2 id="card-keys" className="text-lg font-semibold">Key</h2>
        <p className="mt-1 text-xs text-muted-foreground">A key is a versioned source pointer, not the one final meaning of the passage.</p>
        <ul className="mt-3 space-y-2" role="list">
          {card.citation.keys.map(key=><li key={key.id+"-"+key.assessor} className="rounded-md border p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2"><strong dir="auto">{key.key}</strong>
              <span className="rounded border px-1 text-[10px] font-semibold uppercase tracking-wide">{key.reviewStatus}</span>
              <span className="text-xs text-muted-foreground">{key.scheme}</span></p>
            <p className="mt-1 break-all text-xs text-muted-foreground">Assessor: {key.assessor} · Method: {key.method} · Record: {key.id}</p>
          </li>)}
        </ul>
      </section>

      <section className="rounded-lg border p-4" aria-labelledby="card-message">
        <h2 id="card-message" className="text-lg font-semibold">Derived message (not original scripture)</h2>
        {card.citation.messages.length===0
          ? <p className="mt-2 text-sm">No reviewed message is published for this passage. An unreviewed, unbounded or unprovenanced message stays withheld rather than drafted here.</p>
          : <ul className="mt-3 space-y-2" role="list">{card.citation.messages.map(message=><li key={message.id} className="rounded-md border p-3 text-sm">
              <p dir="auto" className="whitespace-pre-wrap">{message.message}</p>
              <p className="mt-2 text-xs"><strong>Boundary:</strong> <span dir="auto">{message.boundaryNote}</span></p>
              <p className="mt-1 break-all text-xs text-muted-foreground">Reviewer: {message.reviewer} · From keys: {message.sourceKeyAssessmentIds.join(", ")}</p>
            </li>)}</ul>}
      </section>

      <section className="rounded-lg border p-4" aria-labelledby="card-boundary">
        <h2 id="card-boundary" className="text-lg font-semibold">Boundary</h2>
        <p dir="auto" className="mt-2 text-sm">{card.citation.frameNote}</p>
        <p className="mt-2 text-xs text-muted-foreground">Provenance: {card.citation.provenance.join(", ")}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">Evidence: {card.citation.evidence.join(", ")}</p>
        <a className="mt-3 inline-block text-xs underline" href={card.citation.deepLink} rel="noreferrer">Open the cited passage</a>
      </section>

      <section className="rounded-lg border p-4" aria-labelledby="card-disagreement">
        <h2 id="card-disagreement" className="text-lg font-semibold">Disagreement</h2>
        <p className="mt-1 text-xs text-muted-foreground">Every assessor's entry is kept as recorded. Nothing here is averaged, adjudicated or ranked.</p>
        <ul className="mt-3 space-y-2" role="list">
          {grouped.map(([token,entries])=>{
            const assessors=[...new Set(entries.map(entry=>entry.assessor))].sort()
            return <li key={token} className="rounded-md border p-3 text-sm">
              <p><strong dir="auto">{token}</strong> — {assessors.length===1?"recorded by one assessor":"recorded by "+assessors.length+" assessors"}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{assessors.join(", ")}</p>
              <p className="mt-1 text-xs">{assessors.length===1
                ? "A single record is not an agreement; it is one person's reading."
                : "Two or more records are shown side by side. Where they differ, the difference stands as recorded."}</p>
            </li>
          })}
        </ul>
      </section>
    </article>}

    <footer className="text-xs text-muted-foreground">A card is derived research under a stated method and frame. Coverage, disagreement and direction remain separate measures and none of them is a score for a verse or a tradition. <a href="/research/srgbl" className="underline">Five-layer witness</a> · <a href="https://github.com/bjo163/moonwitness-corpus/blob/dev/docs/KEY-WITNESS-V0.md" className="underline">Read the layer specification</a>.</footer>
  </main>
}
