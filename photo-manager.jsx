import { useState, useEffect, useRef, useCallback } from "react";

const CATS = [
  { id: "dragons",   label: "Dragons",       emoji: "🐉" },
  { id: "cute-toys", label: "Cute Toys",      emoji: "🐱" },
  { id: "animals",   label: "Baby Animals",   emoji: "🦌" },
  { id: "dinos",     label: "Dinosaurs",      emoji: "🦕" },
  { id: "custom",    label: "Custom Designs", emoji: "✦"  },
];

const PRODUCTS = ["nightfury","kitten","raptor","deer","firedrake","cutedino","elephant","custom"];

const SEED_PHOTOS = [
  { id:"p1",  cat:"dragons",   product:"nightfury", title:"Night Fury Dragon — Front",      desc:"Matte black PLA, 14cm wingspan",          src:"https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=75" },
  { id:"p2",  cat:"dragons",   product:"nightfury", title:"Night Fury Dragon — Wings",      desc:"Poseable wing detail close-up",           src:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75" },
  { id:"p3",  cat:"dragons",   product:"firedrake", title:"Fire Drake — Full Pose",         desc:"Orange-red gradient, 18cm tall",          src:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=75" },
  { id:"p4",  cat:"dragons",   product:"firedrake", title:"Fire Drake — Wing Detail",       desc:"Spread wings, fierce expression",         src:"https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=600&q=75" },
  { id:"p5",  cat:"cute-toys", product:"kitten",    title:"Kitten — Pastel Pink",           desc:"Resin finish, 8cm, glossy eyes",          src:"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=75" },
  { id:"p6",  cat:"cute-toys", product:"kitten",    title:"Kitten — Sky Blue",              desc:"10 pastel colour options available",       src:"https://images.unsplash.com/photo-1608848461950-0fe51dfc41cb?w=600&q=75" },
  { id:"p7",  cat:"cute-toys", product:"cutedino",  title:"Cute Mini Dino — Green",         desc:"Chibi style, glossy, 6cm tall",           src:"https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&q=75" },
  { id:"p8",  cat:"cute-toys", product:"cutedino",  title:"Cute Dino Pack",                 desc:"Set of 3 in different colours",           src:"https://images.unsplash.com/photo-1612538498456-e861df91d4d0?w=600&q=75" },
  { id:"p9",  cat:"animals",   product:"deer",      title:"Baby Deer — Resting Pose",       desc:"Warm brown PLA, white spot detailing",    src:"https://images.unsplash.com/photo-1484406566174-9da000fda645?w=600&q=75" },
  { id:"p10", cat:"animals",   product:"deer",      title:"Baby Deer — Close-up",           desc:"Fine detail on ears and spots",           src:"https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&q=75" },
  { id:"p11", cat:"animals",   product:"elephant",  title:"Baby Elephant — Sky Blue",       desc:"Floppy ears, curled trunk, 9cm tall",     src:"https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=75" },
  { id:"p12", cat:"animals",   product:"elephant",  title:"Baby Elephant — Grey",           desc:"Classic grey, smooth PLA finish",         src:"https://images.unsplash.com/photo-1551316679-9c6ae9dec224?w=600&q=75" },
  { id:"p13", cat:"dinos",     product:"raptor",    title:"Velociraptor — Running Pose",    desc:"12cm, articulated jaw, textured scale",   src:"https://images.unsplash.com/photo-1615789591457-74a63395c990?w=600&q=75" },
  { id:"p14", cat:"dinos",     product:"raptor",    title:"Velociraptor — Head Detail",     desc:"Precision resin, high-res surface",       src:"https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=600&q=75" },
  { id:"p15", cat:"custom",    product:"custom",    title:"Custom Couple Gift",             desc:"Client commission — anniversary pair",    src:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=75" },
  { id:"p16", cat:"custom",    product:"custom",    title:"Name Keychain Set",              desc:"Personalised engraved keychains",         src:"https://images.unsplash.com/photo-1583394293214-0a08ae5f0e3d?w=600&q=75" },
];

const STORAGE_KEY = "printcraft_photos";

function uid() {
  return "p" + Date.now() + Math.random().toString(36).slice(2,6);
}

function catLabel(id) {
  return CATS.find(c => c.id === id)?.label || id;
}

export default function PhotoManager() {
  const [photos, setPhotos]       = useState([]);
  const [loaded, setLoaded]       = useState(false);
  const [filter, setFilter]       = useState("all");
  const [view, setView]           = useState("grid");   // grid | list
  const [modal, setModal]         = useState(null);     // null | "add" | "edit"
  const [editTarget, setEditTarget] = useState(null);
  const [lightbox, setLightbox]   = useState(null);     // index into filtered
  const [search, setSearch]       = useState("");
  const [toast, setToast]         = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const fileRef = useRef();

  // ── Load from storage ──
  useEffect(() => {
    async function load() {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        const stored = res ? JSON.parse(res.value) : null;
        setPhotos(stored && stored.length ? stored : SEED_PHOTOS);
      } catch {
        setPhotos(SEED_PHOTOS);
      }
      setLoaded(true);
    }
    load();
  }, []);

  // ── Save to storage ──
  const save = useCallback(async (next) => {
    setPhotos(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  // ── Toast helper ──
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Derived ──
  const filtered = photos.filter(p => {
    const catOk  = filter === "all" || p.cat === filter;
    const termOk = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase());
    return catOk && termOk;
  });

  // ── Handlers ──
  function openAdd()        { setEditTarget({ id:uid(), cat:"dragons", product:"nightfury", title:"", desc:"", src:"" }); setModal("add"); }
  function openEdit(p)      { setEditTarget({...p}); setModal("edit"); }
  function closeModal()     { setModal(null); setEditTarget(null); }

  function handleSave() {
    if(!editTarget.title.trim() || !editTarget.src.trim()) {
      showToast("Title and image URL are required.", "error"); return;
    }
    let next;
    if(modal === "add") {
      next = [...photos, editTarget];
      showToast("Photo added successfully!");
    } else {
      next = photos.map(p => p.id === editTarget.id ? editTarget : p);
      showToast("Photo updated successfully!");
    }
    save(next);
    closeModal();
  }

  function handleDelete(id) {
    const next = photos.filter(p => p.id !== id);
    save(next);
    setConfirmDel(null);
    showToast("Photo deleted.", "error");
  }

  function handleFileRead(e) {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEditTarget(t => ({...t, src: ev.target.result}));
    reader.readAsDataURL(file);
  }

  function moveLightbox(dir) {
    setLightbox(i => {
      const next = i + dir;
      if(next < 0) return filtered.length - 1;
      if(next >= filtered.length) return 0;
      return next;
    });
  }

  useEffect(() => {
    if(lightbox === null) return;
    const fn = e => {
      if(e.key === "ArrowRight") moveLightbox(1);
      if(e.key === "ArrowLeft")  moveLightbox(-1);
      if(e.key === "Escape")     setLightbox(null);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [lightbox, filtered.length]);

  if(!loaded) return (
    <div style={{padding:"48px",textAlign:"center",color:"var(--color-text-secondary)"}}>
      Loading photos…
    </div>
  );

  const lbPhoto = lightbox !== null ? filtered[lightbox] : null;

  return (
    <div style={{fontFamily:"var(--font-sans)",minHeight:"100vh",background:"var(--color-background-tertiary)"}}>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
          background: toast.type==="error" ? "var(--color-background-danger)" : "var(--color-background-success)",
          color: toast.type==="error" ? "var(--color-text-danger)" : "var(--color-text-success)",
          border: `0.5px solid ${toast.type==="error" ? "var(--color-border-danger)" : "var(--color-border-success)"}`,
          borderRadius:"var(--border-radius-lg)",padding:"10px 20px",
          fontSize:14,fontWeight:500,zIndex:9999,whiteSpace:"nowrap",
          boxShadow:"0 2px 12px rgba(0,0,0,0.12)"
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lbPhoto && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position:"fixed",inset:0,zIndex:9000,
            background:"rgba(0,0,0,0.92)",
            display:"flex",alignItems:"center",justifyContent:"center",
            flexDirection:"column",gap:16,padding:24
          }}
        >
          <button onClick={e=>{e.stopPropagation();moveLightbox(-1);}} style={{
            position:"fixed",left:16,top:"50%",transform:"translateY(-50%)",
            background:"rgba(255,255,255,0.1)",border:"0.5px solid rgba(255,255,255,0.2)",
            borderRadius:"50%",width:44,height:44,color:"#fff",fontSize:20,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"
          }}>‹</button>
          <button onClick={e=>{e.stopPropagation();moveLightbox(1);}} style={{
            position:"fixed",right:16,top:"50%",transform:"translateY(-50%)",
            background:"rgba(255,255,255,0.1)",border:"0.5px solid rgba(255,255,255,0.2)",
            borderRadius:"50%",width:44,height:44,color:"#fff",fontSize:20,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"
          }}>›</button>
          <button onClick={()=>setLightbox(null)} style={{
            position:"fixed",top:16,right:16,
            background:"rgba(255,255,255,0.1)",border:"0.5px solid rgba(255,255,255,0.2)",
            borderRadius:"50%",width:36,height:36,color:"#fff",fontSize:16,
            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"
          }}>✕</button>
          <img
            onClick={e=>e.stopPropagation()}
            src={lbPhoto.src}
            alt={lbPhoto.title}
            style={{maxWidth:"min(92vw,860px)",maxHeight:"72vh",objectFit:"contain",borderRadius:8}}
          />
          <div style={{textAlign:"center",color:"#fff"}}>
            <div style={{fontWeight:500,fontSize:16}}>{lbPhoto.title}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:4}}>{lbPhoto.desc}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:6}}>
              {lightbox+1} / {filtered.length}
            </div>
          </div>
          {/* Thumbnail strip */}
          <div style={{display:"flex",gap:8,overflowX:"auto",maxWidth:"min(92vw,700px)",paddingBottom:4}}>
            {filtered.map((p,i) => (
              <img
                key={p.id}
                src={p.src}
                alt=""
                onClick={e=>{e.stopPropagation();setLightbox(i);}}
                style={{
                  width:52,height:52,objectFit:"cover",borderRadius:6,cursor:"pointer",flexShrink:0,
                  opacity: i===lightbox ? 1 : 0.5,
                  border: i===lightbox ? "2px solid #fff" : "2px solid transparent",
                  transition:"opacity 0.2s"
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ── */}
      {confirmDel && (
        <div style={{
          position:"fixed",inset:0,zIndex:8000,background:"rgba(0,0,0,0.55)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:24
        }}>
          <div style={{
            background:"var(--color-background-primary)",
            border:"0.5px solid var(--color-border-tertiary)",
            borderRadius:"var(--border-radius-lg)",padding:"28px 32px",
            maxWidth:360,width:"100%",textAlign:"center"
          }}>
            <div style={{fontSize:16,fontWeight:500,marginBottom:8}}>Delete this photo?</div>
            <div style={{fontSize:14,color:"var(--color-text-secondary)",marginBottom:24}}>
              "{confirmDel.title}" will be permanently removed.
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)}
                style={{padding:"8px 20px",borderRadius:"var(--border-radius-md)"}}>
                Cancel
              </button>
              <button onClick={()=>handleDelete(confirmDel.id)}
                style={{
                  padding:"8px 20px",borderRadius:"var(--border-radius-md)",
                  background:"var(--color-background-danger)",
                  color:"var(--color-text-danger)",
                  border:"0.5px solid var(--color-border-danger)"
                }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {modal && editTarget && (
        <div style={{
          position:"fixed",inset:0,zIndex:8000,background:"rgba(0,0,0,0.55)",
          display:"flex",alignItems:"center",justifyContent:"center",padding:24,
          overflowY:"auto"
        }}>
          <div style={{
            background:"var(--color-background-primary)",
            border:"0.5px solid var(--color-border-tertiary)",
            borderRadius:"var(--border-radius-xl)",padding:"28px 28px",
            width:"100%",maxWidth:540,position:"relative"
          }}>
            <button onClick={closeModal} style={{
              position:"absolute",top:14,right:14,
              background:"none",border:"none",fontSize:18,
              color:"var(--color-text-secondary)",cursor:"pointer",lineHeight:1
            }}>✕</button>

            <h2 style={{fontSize:18,fontWeight:500,marginBottom:20}}>
              {modal==="add" ? "Add new photo" : "Edit photo"}
            </h2>

            {/* Image preview */}
            <div style={{
              width:"100%",aspectRatio:"16/9",borderRadius:"var(--border-radius-lg)",
              overflow:"hidden",background:"var(--color-background-secondary)",
              marginBottom:20,position:"relative",
              border:"0.5px solid var(--color-border-tertiary)"
            }}>
              {editTarget.src ? (
                <img src={editTarget.src} alt="preview"
                  style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              ) : (
                <div style={{
                  width:"100%",height:"100%",display:"flex",alignItems:"center",
                  justifyContent:"center",flexDirection:"column",gap:8,
                  color:"var(--color-text-secondary)"
                }}>
                  <div style={{fontSize:32,opacity:0.4}}>🖼</div>
                  <div style={{fontSize:13}}>No image yet</div>
                </div>
              )}
            </div>

            {/* Upload or URL */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:8,fontWeight:500}}>
                Image source
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <button
                  onClick={()=>fileRef.current?.click()}
                  style={{
                    flex:1,padding:"9px 0",borderRadius:"var(--border-radius-md)",
                    fontSize:13,background:"var(--color-background-secondary)",
                    border:"0.5px solid var(--color-border-secondary)"
                  }}>
                  Upload from device
                </button>
                <input ref={fileRef} type="file" accept="image/*"
                  style={{display:"none"}} onChange={handleFileRead}/>
              </div>
              <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>Or paste an image URL</div>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={editTarget.src.startsWith("data:") ? "" : editTarget.src}
                onChange={e => setEditTarget(t=>({...t, src:e.target.value}))}
                style={{width:"100%",fontSize:13}}
              />
            </div>

            {/* Title */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:6,fontWeight:500}}>
                Title <span style={{color:"var(--color-text-danger)"}}>*</span>
              </div>
              <input
                type="text" placeholder="e.g. Night Fury Dragon — Front"
                value={editTarget.title}
                onChange={e=>setEditTarget(t=>({...t,title:e.target.value}))}
                style={{width:"100%",fontSize:13}}
              />
            </div>

            {/* Description */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:6,fontWeight:500}}>
                Short description
              </div>
              <input
                type="text" placeholder="e.g. Matte black PLA, 14cm wingspan"
                value={editTarget.desc}
                onChange={e=>setEditTarget(t=>({...t,desc:e.target.value}))}
                style={{width:"100%",fontSize:13}}
              />
            </div>

            {/* Category + Product row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22}}>
              <div>
                <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:6,fontWeight:500}}>Category</div>
                <select value={editTarget.cat} onChange={e=>setEditTarget(t=>({...t,cat:e.target.value}))} style={{width:"100%",fontSize:13}}>
                  {CATS.map(c=>(
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:6,fontWeight:500}}>Product</div>
                <select value={editTarget.product} onChange={e=>setEditTarget(t=>({...t,product:e.target.value}))} style={{width:"100%",fontSize:13}}>
                  {PRODUCTS.map(p=>(
                    <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={closeModal} style={{padding:"9px 22px",borderRadius:"var(--border-radius-md)",fontSize:14}}>
                Cancel
              </button>
              <button onClick={handleSave} style={{
                padding:"9px 22px",borderRadius:"var(--border-radius-md)",fontSize:14,
                background:"var(--color-background-info)",color:"var(--color-text-info)",
                border:"0.5px solid var(--color-border-info)",fontWeight:500
              }}>
                {modal==="add" ? "Add photo" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          HEADER
      ══════════════════════════════ */}
      <div style={{
        background:"var(--color-background-primary)",
        borderBottom:"0.5px solid var(--color-border-tertiary)",
        padding:"16px 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexWrap:"wrap",gap:12
      }}>
        <div>
          <div style={{fontSize:18,fontWeight:500}}>Photo Manager</div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:2}}>
            {photos.length} photos · {filtered.length} shown
          </div>
        </div>
        <button
          onClick={openAdd}
          style={{
            padding:"9px 20px",borderRadius:"var(--border-radius-md)",fontSize:14,
            background:"var(--color-background-info)",color:"var(--color-text-info)",
            border:"0.5px solid var(--color-border-info)",fontWeight:500,
            display:"flex",alignItems:"center",gap:6
          }}>
          + Add photo
        </button>
      </div>

      {/* ══════════════════════════════
          STAT CARDS
      ══════════════════════════════ */}
      <div style={{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",
        gap:10,padding:"16px 24px"
      }}>
        {[
          {label:"Total",  val:photos.length,  col:"var(--color-text-primary)"},
          ...CATS.map(c=>({
            label:c.emoji+" "+c.label,
            val: photos.filter(p=>p.cat===c.id).length,
            col:"var(--color-text-secondary)"
          }))
        ].map((s,i)=>(
          <div key={i} style={{
            background:"var(--color-background-secondary)",
            borderRadius:"var(--border-radius-md)",padding:"12px 14px"
          }}>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
            <div style={{fontSize:22,fontWeight:500,color:s.col}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════
          TOOLBAR
      ══════════════════════════════ */}
      <div style={{
        padding:"0 24px 16px",
        display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search photos…"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{flex:1,minWidth:160,maxWidth:280,fontSize:13}}
        />

        {/* Category filter */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[{id:"all",label:"All",emoji:""},...CATS].map(c=>(
            <button
              key={c.id}
              onClick={()=>setFilter(c.id)}
              style={{
                padding:"6px 14px",borderRadius:50,fontSize:12,fontWeight:500,
                background: filter===c.id ? "var(--color-background-info)" : "var(--color-background-secondary)",
                color:       filter===c.id ? "var(--color-text-info)"       : "var(--color-text-secondary)",
                border:      filter===c.id ? "0.5px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)"
              }}>
              {c.emoji} {c.label||"All"}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div style={{display:"flex",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",overflow:"hidden"}}>
          {["grid","list"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:"7px 14px",fontSize:13,background: view===v ? "var(--color-background-secondary)" : "transparent",
              color: view===v ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              border:"none"
            }}>
              {v==="grid" ? "⊞ Grid" : "☰ List"}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════
          EMPTY STATE
      ══════════════════════════════ */}
      {filtered.length === 0 && (
        <div style={{textAlign:"center",padding:"60px 24px",color:"var(--color-text-secondary)"}}>
          <div style={{fontSize:36,marginBottom:12}}>🖼</div>
          <div style={{fontSize:15,fontWeight:500,marginBottom:6}}>No photos found</div>
          <div style={{fontSize:13}}>Try a different filter or add a new photo.</div>
        </div>
      )}

      {/* ══════════════════════════════
          GRID VIEW
      ══════════════════════════════ */}
      {view === "grid" && filtered.length > 0 && (
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
          gap:14,padding:"0 24px 32px"
        }}>
          {filtered.map((p,i) => (
            <div key={p.id} style={{
              background:"var(--color-background-primary)",
              border:"0.5px solid var(--color-border-tertiary)",
              borderRadius:"var(--border-radius-lg)",
              overflow:"hidden",
              display:"flex",flexDirection:"column"
            }}>
              {/* Photo */}
              <div
                style={{aspectRatio:"4/3",overflow:"hidden",cursor:"zoom-in",position:"relative"}}
                onClick={()=>setLightbox(i)}
              >
                <img
                  src={p.src} alt={p.title}
                  style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.35s ease"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                />
                {/* Category badge */}
                <div style={{
                  position:"absolute",top:8,left:8,
                  background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",
                  color:"#fff",fontSize:11,fontWeight:500,
                  padding:"3px 9px",borderRadius:50
                }}>
                  {catLabel(p.cat)}
                </div>
              </div>

              {/* Info */}
              <div style={{padding:"12px 14px",flex:1,display:"flex",flexDirection:"column",gap:4}}>
                <div style={{fontSize:13,fontWeight:500,lineHeight:1.3}}>{p.title}</div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",flex:1}}>{p.desc}</div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",opacity:0.6,marginTop:2}}>
                  Product: {p.product}
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display:"flex",gap:0,
                borderTop:"0.5px solid var(--color-border-tertiary)"
              }}>
                <button
                  onClick={()=>openEdit(p)}
                  style={{
                    flex:1,padding:"9px 0",fontSize:12,fontWeight:500,
                    background:"none",border:"none",
                    borderRight:"0.5px solid var(--color-border-tertiary)",
                    color:"var(--color-text-secondary)",cursor:"pointer"
                  }}>
                  Edit
                </button>
                <button
                  onClick={()=>setConfirmDel(p)}
                  style={{
                    flex:1,padding:"9px 0",fontSize:12,fontWeight:500,
                    background:"none",border:"none",
                    color:"var(--color-text-danger)",cursor:"pointer"
                  }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════
          LIST VIEW
      ══════════════════════════════ */}
      {view === "list" && filtered.length > 0 && (
        <div style={{padding:"0 24px 32px",display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map((p,i) => (
            <div key={p.id} style={{
              background:"var(--color-background-primary)",
              border:"0.5px solid var(--color-border-tertiary)",
              borderRadius:"var(--border-radius-lg)",
              display:"flex",alignItems:"center",gap:14,padding:12,
              overflow:"hidden"
            }}>
              <img
                src={p.src} alt={p.title}
                onClick={()=>setLightbox(i)}
                style={{
                  width:72,height:56,objectFit:"cover",
                  borderRadius:"var(--border-radius-md)",
                  flexShrink:0,cursor:"zoom-in"
                }}
              />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{p.desc}</div>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <span style={{
                    fontSize:11,padding:"2px 8px",borderRadius:50,
                    background:"var(--color-background-secondary)",
                    color:"var(--color-text-secondary)",
                    border:"0.5px solid var(--color-border-tertiary)"
                  }}>{catLabel(p.cat)}</span>
                  <span style={{
                    fontSize:11,padding:"2px 8px",borderRadius:50,
                    background:"var(--color-background-secondary)",
                    color:"var(--color-text-secondary)",
                    border:"0.5px solid var(--color-border-tertiary)"
                  }}>{p.product}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button onClick={()=>openEdit(p)} style={{
                  padding:"7px 16px",borderRadius:"var(--border-radius-md)",
                  fontSize:13,background:"var(--color-background-secondary)",
                  border:"0.5px solid var(--color-border-secondary)",
                  color:"var(--color-text-primary)",cursor:"pointer"
                }}>Edit</button>
                <button onClick={()=>setConfirmDel(p)} style={{
                  padding:"7px 16px",borderRadius:"var(--border-radius-md)",
                  fontSize:13,background:"var(--color-background-danger)",
                  border:"0.5px solid var(--color-border-danger)",
                  color:"var(--color-text-danger)",cursor:"pointer"
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
