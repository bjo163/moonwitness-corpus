"use client"

import { useState, type FormEvent } from "react"

/**
 * P18-009: the Titik Tengah card. It shows one derived witness reading next to
 * the record it came from: the witness, the cited keys, the reviewed message,
 * the boundary and what two annotators did not agree on. The card is derived
 * research, so it never presents itself as canonical text, a score or a verdict.
 */
type Rights = {text:"cleared"|"restricted"|"unknown";annotation:{kind:string;licenseId?:string;attestedBy?:string};publicDomainInference:"prohibited"}
type CitationKey = {id:string;key:string;scheme:string;method:string;assessor:string;reviewStatus:"draft"|"reviewed"|"disputed"|"deprecated"}
type CitationMessage = {id:string;message:string;boundaryNote:string;reviewStatus:"reviewed";reviewer:string;sourceKeyAssessmentIds:string[]}
type Citation = {
  schema:"mw:citation:v0";passageId:string;editionId:string;artifactId:string;contentId:string|null;
  text:string|null;textOmissionReason:string|null;keys:CitationKey[];messages:CitationMessage[];rights:Rights;
  provenance:string[];evidence:string[];methodVersion:string;corpusHash:string;deepLink:string;frameNote:string
}
type Card = {passageId:string;corpusHash:string;methodVersion:string;citation:Citation}

const API=(process.env.NEXT_PUBLIC_RGBL_API_URL||"").replace(/\/+$/,"")
const RIGHTS=["cleared","restricted","unknown"]
const REVIEW=["draft","reviewed","disputed","deprecated"]
const nonBlank=(value:unknown):value is string=>typeof value==="string"&&value.trim().length>0
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(nonBlank)

/**
 * The card refuses to render a payload it cannot verify. In particular it never
 * prints witness text whose own rights statement is not `cleared`, even if a
 * server sent one: a client that trusts the field name would leak the text.
 */
function parseCard(body:unknown):Card {
  if(!body||typeof body!=="object") throw new Error("The key layer returned no card")
  const envelope=body as Record<string,unknown>
  if(envelope.success!==true) throw new Error("The key layer did not confirm this card")
  const c=envelope.citation as Record<string,unknown>|undefined
  if(!c||typeof c!=="object") throw new Error("The card is missing its citation bundle")
  if(c.schema!=="mw:citation:v0") throw new Error("Unsupported citation schema: "+String(c.schema))
  if(!nonBlank(c.passageId)||!c.passageId.startsWith("mw:passage:")) throw new Error("The card's passage id is not canonical")
  if(c.passageId!==envelope.passageId) throw new Error("The card describes a different passage than the one requested")
  if(!nonBlank(c.corpusHash)||!/^[a-f0-9]{64}$/.test(c.corpusHash)||c.corpusHash!==envelope.corpusHash)
    throw new Error("The card is not bound to the corpus version it was served for")
  if(!nonBlank(c.methodVersion)||c.methodVersion!==envelope.methodVersion) throw new Error("The card's method version is missing or inconsistent")
  if(!nonBlank(c.editionId)||!nonBlank(c.artifactId)) throw new Error("The card does not name its witness edition and artifact")
  if(!nonBlank(c.frameNote)) throw new Error("A card without a frame note would read as a claim")
  if(typeof c.deepLink!=="string"||!/^https?:\/\//.test(c.deepLink)) throw new Error("The card's deep link is not an http(s) address")

  const rights=c.rights as Record<string,unknown>|undefined
  if(!rights||typeof rights.text!=="string"||!RIGHTS.includes(rights.text))
    throw new Error("The card's text rights statement is missing")
  if(rights.publicDomainInference!=="prohibited") throw new Error("The card may not infer public domain")
  const annotation=rights.annotation as Record<string,unknown>|undefined
  if(!annotation||!nonBlank(annotation.kind)) throw new Error("The card's annotation licence is missing")
  if(annotation.kind!=="unlicensed"&&!nonBlank(annotation.attestedBy)) throw new Error("An annotation licence needs an attestation")

  const withheld=rights.text!=="cleared"
  if(withheld&&c.text!==null&&c.text!==undefined) throw new Error("Withheld witness text arrived from the API and was refused")
  if(!withheld&&!nonBlank(c.text)) throw new Error("Cleared witness text is missing from the card")
  if(c.text===null&&!nonBlank(c.textOmissionReason)) throw new Error("Withheld text must state why it is withheld")

  const keys=Array.isArray(c.keys)?c.keys:[]
  if(keys.length===0) throw new Error("A card without a cited key is not a key witness")
  for(const raw of keys){
    const k=raw as Record<string,unknown>
    if(!nonBlank(k.id)||!k.id.startsWith("mw:")) throw new Error("A cited key id is not canonical")
    for(const field of ["key","scheme","method"] as const) if(!nonBlank(k[field])) throw new Error("A cited key is missing its "+field)
    if(!nonBlank(k.assessor)||!k.assessor.startsWith("mw:")) throw new Error("A cited key names no canonical assessor")
    if(typeof k.reviewStatus!=="string"||!REVIEW.includes(k.reviewStatus)) throw new Error("A cited key has an unknown review status")
  }
  const messages=Array.isArray(c.messages)?c.messages:[]
  for(const raw of messages){
    const m=raw as Record<string,unknown>
    if(m.reviewStatus!=="reviewed") throw new Error("A draft message may not be rendered as a card message")
    if(!nonBlank(m.message)||!nonBlank(m.boundaryNote)||!nonBlank(m.reviewer)) throw new Error("A card message needs text, a boundary and a reviewer")
    if(!strings(m.sourceKeyAssessmentIds)) throw new Error("A card message must cite the key assessments it came from")
  }
  if(!strings(c.provenance)||c.provenance.length===0) throw new Error("The card has no provenance")
  if(!strings(c.evidence)||c.evidence.length===0) throw new Error("The card has no evidence")

  return {
    passageId:c.passageId,corpusHash:c.corpusHash,methodVersion:c.methodVersion,
    citation:{
      schema:"mw:citation:v0",passageId:c.passageId,editionId:c.editionId,artifactId:c.artifactId,
      contentId:nonBlank(c.contentId)?c.contentId:null,
      text:withheld?null:c.text as string,textOmissionReason:nonBlank(c.textOmissionReason)?c.textOmissionReason:null,
      keys:keys.map(k=>({
        id:k.id as string,key:k.key as string,scheme:k.scheme as string,method:k.method as string,
        assessor:k.assessor as string,reviewStatus:k.reviewStatus as CitationKey["reviewStatus"]
      })),
      messages:messages.map(m=>({
        id:m.id as string,message:m.message as string,boundaryNote:m.boundaryNote as string,
        reviewStatus:"reviewed",reviewer:m.reviewer as string,sourceKeyAssessmentIds:[...(m.sourceKeyAssessmentIds as string[])]
      })),
      rights:{text:rights.text as Rights["text"],annotation:{kind:annotation.kind as string,
        ...(nonBlank(annotation.licenseId)?{licenseId:annotation.licenseId}:{})},publicDomainInference:"prohibited"},
      provenance:[...(c.provenance as string[])],evidence:[...(c.evidence as string[])],
      methodVersion:c.methodVersion,corpusHash:c.corpusHash,deepLink:c.deepLink,frameNote:c.frameNote
    }
  }
}

/** How many distinct assessors recorded each key token: a shared view, never a merge. */
function groupByKey(keys:CitationKey[]){
  const byKey=new Map<string,CitationKey[]>()
  for(const key of keys) byKey.set(key.key,[...(byKey.get(key.key)||[]),key])
  return [...byKey.entries()].sort(([a],[b])=>a.localeCompare(b))
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
