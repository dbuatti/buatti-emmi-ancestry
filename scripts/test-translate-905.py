#!/usr/bin/env python3
"""Task 1: test a stronger sentence-by-sentence translation prompt on msg 905 only."""
import json, os, re, sqlite3, urllib.request, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, ".local", "correspondence.db")
ANALYSIS = os.path.join(ROOT, "correspondence", "extracted", "analysis")
MODEL = "llama3.2:latest"
CHUNK_SIZE = 2000

def split_chunks(text):
    if not text:
        return []
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    parts = re.split(r"(\n\s*\n)", text)
    paras = []
    i = 0
    n = len(parts)
    while i < n:
        p = parts[i]
        sep = parts[i + 1] if (i + 1 < n and re.match(r"\n\s*\n", parts[i + 1])) else ""
        paras.append((p, sep))
        i += 2 if sep else 1
    flat = []
    for p, sep in paras:
        if len(p) <= CHUNK_SIZE:
            flat.append((p, sep))
        else:
            sents = re.split(r"(?<=[.!?])\s+", p)
            buf_s = ""
            for s in sents:
                if buf_s and len(buf_s) + len(s) + 1 > CHUNK_SIZE:
                    flat.append((buf_s, " "))
                    buf_s = s
                else:
                    buf_s = (buf_s + " " + s).strip() if buf_s else s
            if buf_s:
                flat.append((buf_s, sep))
    paras = flat
    chunks = []
    buf = ""
    buf_start = 0
    pos = 0
    for p, sep in paras:
        block = p + sep
        if buf and len(buf) + len(block) > CHUNK_SIZE:
            chunks.append((buf_start, buf))
            buf = block
            buf_start = pos
        else:
            if not buf:
                buf_start = pos
            buf += block
        pos += len(block)
    if buf:
        chunks.append((buf_start, buf))
    if chunks and chunks[-1][0] + len(chunks[-1][1]) < len(text):
        chunks.append((chunks[-1][0] + len(chunks[-1][1]), text[chunks[-1][0] + len(chunks[-1][1]):]))
    elif not chunks and text:
        chunks.append((0, text))
    return [{"seq": i, "start": st, "end": st + len(t), "chars": len(t), "text": t} for i, (st, t) in enumerate(chunks)]

STRONG_SYSTEM = ("You are a professional translator. Translate the following email excerpt "
  "sentence by sentence from Italian (or any language) into English. "
  "Do not summarise, paraphrase, condense or omit anything. Translate every single sentence. "
  "If the excerpt is long, translate all of it without shortening. "
  "Preserve paragraph order, names, dates, numbers, protocol references and administrative terminology. "
  "Keep quoted correspondence intact and in its original sequence. "
  "If a passage cannot be translated reliably, output [UNTRANSLATED: <reason>] instead of skipping it. "
  "Return ONLY the English translation, no commentary, no markdown.")

def translate_chunk(ct):
    payload={"model":MODEL,"messages":[{"role":"system","content":STRONG_SYSTEM},{"role":"user","content":ct}],
             "stream":False,"options":{"temperature":0.0}}
    req=urllib.request.Request("http://127.0.0.1:11434/api/chat",data=__import__("json").dumps(payload).encode(),
                               headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req,timeout=300) as r:
        return (json.load(r).get("message",{}).get("content","") or "").strip()

conn=sqlite3.connect(f"file:{DB}?mode=ro",uri=True); conn.row_factory=sqlite3.Row
body=conn.execute("SELECT body_text FROM messages WHERE id=905").fetchone()[0]
conn.close()
old=json.load(open(os.path.join(ANALYSIS,"message_905.json")))
old_trans=old.get("translation_en","")

chunks=split_chunks(body)
print(f"body={len(body)} chunks={len(chunks)} covered={sum(c['chars'] for c in chunks)}")
parts=[]; manifest=[]
for c in chunks:
    tr=translate_chunk(c["text"])
    manifest.append({"seq":c["seq"],"start":c["start"],"end":c["end"],"source_chars":c["chars"],"translated_chars":len(tr),"status":"ok" if tr else "empty"})
    parts.append(tr)
    print(f"  chunk {c['seq']}: src={c['chars']} trans={len(tr)} status={'ok' if tr else 'empty'}")
new_trans="\n\n".join(parts)

# save test result (not overwriting the canonical analysis)
test_path=os.path.join(ANALYSIS,"message_905.strong_test.json")
json.dump({"message_id":905,"translation_en":new_trans,"translation_chunks":manifest,
           "translation_complete": True, "model":MODEL, "prompt":"strong sentence-by-sentence",
           "analysed_at":datetime.datetime.now(datetime.timezone.utc).isoformat()},
          open(test_path,"w"), indent=2, ensure_ascii=False)
print("\nSaved:", test_path)
print("OLD trans len:", len(old_trans), "NEW trans len:", len(new_trans))
print("ratio old:", round(len(old_trans)/len(body),2), "ratio new:", round(len(new_trans)/len(body),2))
print("\n--- OLD (first 500) ---")
print(old_trans[:500])
print("\n--- NEW (first 500) ---")
print(new_trans[:500])