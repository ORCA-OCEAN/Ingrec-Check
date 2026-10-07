/* IngreCheck – Front-end demo logic (localStorage)
   Replace with real backend/OCR later.
*/

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const store = {
  get(k, fb=null){ try{ return JSON.parse(localStorage.getItem(k)) ?? fb; }catch{ return fb; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
  remove(k){ localStorage.removeItem(k); }
};

// -------- Branding / Nav ----------
const BRAND = "IngreCheck";
document.addEventListener("DOMContentLoaded", ()=>{
  const brandEls = $$(".brand-name");
  brandEls.forEach(el => el.textContent = BRAND);

  const navUser = $('[data-nav-user]');
  if (navUser){
    const u = currentUser();
    navUser.innerHTML = u
      ? `<a class="btn btn-primary" href="dashboard.html">Dashboard</a>
         <button class="btn btn-light" id="btn-logout">Logout</button>`
      : `<a class="btn btn-dark" href="login.html">Login</a>
         <a class="btn btn-primary" href="register.html">Register</a>`;
    const lo = $("#btn-logout");
    if(lo) lo.addEventListener("click", ()=>{ logoutUser(); location.href="index.html"; });
  }
});

// -------- Auth ----------
function currentUser(){ return store.get("ic_user", null); }
function registerUser({name,email,password,issues}){
  const users = store.get("ic_users", []);
  if(users.some(u=>u.email===email)) throw new Error("Email already exists");
  const user = { id: Date.now(), name, email, password, issues };
  users.push(user); store.set("ic_users", users);
  store.set("ic_user", { id:user.id, name:user.name, email:user.email, issues:user.issues });
  return user;
}
function loginUser({email,password}){
  const users = store.get("ic_users", []);
  const u = users.find(u=>u.email===email && u.password===password);
  if(!u) throw new Error("Invalid credentials");
  store.set("ic_user", { id:u.id, name:u.name, email:u.email, issues:u.issues });
  return u;
}
function logoutUser(){ store.remove("ic_user"); }
function requireAuth(){ if(!currentUser()) location.href="login.html"; }

// -------- Health Issues (10 common, food-relevant) ----------
const COMMON_ISSUES = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "High Cholesterol",
  "Celiac Disease (Gluten)",
  "Lactose Intolerance",
  "Peanut Allergy",
  "Soy Allergy",
  "Shellfish Allergy",
  "Egg Allergy"
];

// -------- Standards + Risk rules (demo) ----------
const STANDARD_LIMITS = {
  "Sugar":                 { unit:"g",  per:"100g",    max:15 },
  "Sodium":                { unit:"mg", per:"100g",    max:400 },
  "Saturated Fat":         { unit:"g",  per:"100g",    max:5   },
  "Trans Fat":             { unit:"g",  per:"100g",    max:0.5 },
  "Artificial Color (E102)":{ unit:"-", per:"presence",max:0 },
  "MSG":                   { unit:"-",  per:"presence",max:0 },
};

const HEALTH_RISKS = [
  { issues:["Diabetes"], match:["Sugar","High Fructose Corn Syrup"], level:"unsafe", note:"May spike blood glucose." },
  { issues:["Hypertension","Heart Disease","High Cholesterol"], match:["Sodium","Saturated Fat","Trans Fat"], level:"caution", note:"May increase BP/LDL; limit intake." },
  { issues:["Celiac Disease (Gluten)"], match:["Gluten","Wheat","Barley","Rye"], level:"unsafe", note:"Gluten detected." },
  { issues:["Lactose Intolerance"], match:["Milk","Lactose","Whey"], level:"caution", note:"Lactose-containing ingredient." },
  { issues:["Peanut Allergy"], match:["Peanut"], level:"unsafe", note:"Allergenic ingredient (peanut)." },
  { issues:["Soy Allergy"], match:["Soy","Soybean","Soy Lecithin"], level:"unsafe", note:"Allergenic ingredient (soy)." },
  { issues:["Shellfish Allergy"], match:["Shrimp","Crab","Lobster","Shellfish"], level:"unsafe", note:"Allergenic ingredient (shellfish)." },
  { issues:["Egg Allergy"], match:["Egg","Albumen"], level:"unsafe", note:"Allergenic ingredient (egg)." },
];

// -------- Parsing & Evaluation ----------
function title(s){ return s.replace(/\s+/g,' ').trim().replace(/\b[a-z]/g,c=>c.toUpperCase()); }
function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

async function parseIngredientsFromText(text){
  const raw = text.replace(/ingredients?:/i,"").replace(/[()]/g,"");
  const parts = raw.split(/,|;|\n/).map(s=>s.trim()).filter(Boolean);
  return parts.map(p=>{
    const m = p.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*(mg|g)?$/i);
    if(m){ return { name: title(m[1]), qty: parseFloat(m[2]), unit: (m[3]||"").toLowerCase() }; }
    return { name: title(p), qty: null, unit: "" };
  });
}

function evaluateIngredients(ings, userIssues=[]){
  const rows = ings.map(it=>{
    const std = STANDARD_LIMITS[it.name] || null;
    let status = "safe";
    let notes = [];

    // Standard check
    if (std){
      if (std.per === "presence"){
        if ((it.qty ?? 1) > std.max){ status = "unsafe"; notes.push("Presence not allowed"); }
        else notes.push("No presence detected/declared");
      } else if (it.qty != null){
        if (it.unit && std.unit && it.unit !== std.unit){
          notes.push(`Label unit ${it.unit} differs from std ${std.unit}`);
        }
        if (it.qty > std.max){ status = "caution"; notes.push(`Exceeds ${std.max}${std.unit} per ${std.per}`); }
        else notes.push(`Within limit (${std.max}${std.unit}/${std.per})`);
      } else {
        notes.push("No quantity on label; cannot verify limit");
      }
    } else {
      notes.push("No reference standard");
    }

    // Health issue risk matching
    HEALTH_RISKS.forEach(rule=>{
      if(rule.issues.some(is => userIssues.includes(is))){
        if(rule.match.some(k => new RegExp(`\\b${escapeRegExp(k)}\\b`, "i").test(it.name))){
          status = (rule.level==="unsafe") ? "unsafe" : (status==="unsafe" ? "unsafe" : "caution");
          notes.push(`${rule.issues[0]}: ${rule.note}`);
        }
      }
    });

    return {
      ingredient: it.name,
      safeLimit: std ? (std.per==="presence" ? "Not allowed" : `${std.max}${std.unit}/${std.per}`) : "—",
      status,
      remarks: notes.join("; ")
    };
  });

  const summary = {
    unsafe: rows.filter(r=>r.status==="unsafe").length,
    caution: rows.filter(r=>r.status==="caution").length,
    safe: rows.filter(r=>r.status==="safe").length
  };
  return { rows, summary };
}

function badgeClass(status){ return status==="unsafe" ? "badge-unsafe" : status==="caution" ? "badge-caution" : "badge-safe"; }

// -------- History ----------
function saveScan(product){
  const u = currentUser(); if(!u) return;
  const scans = store.get(`ic_scans_${u.id}`, []);
  scans.unshift(product);
  store.set(`ic_scans_${u.id}`, scans);
}
function getScans(){
  const u = currentUser(); return u ? store.get(`ic_scans_${u.id}`, []) : [];
}

// -------- Wire up pages ----------
document.addEventListener("DOMContentLoaded", ()=>{
  const href = location.href;

  // REGISTER
  if(href.endsWith("register.html")){
    const box = $("#issues-box");
    box.innerHTML = COMMON_ISSUES.map(i => `
      <label><input type="checkbox" name="issues" value="${i}"> ${i}</label>
    `).join("");

    $("#register-form").addEventListener("submit", (e)=>{
      e.preventDefault();
      const name = $("#name").value.trim();
      const email = $("#email").value.trim().toLowerCase();
      const password = $("#password").value;
      const issues = $$('input[name="issues"]:checked').map(i=>i.value);
      try{
        registerUser({name,email,password,issues});
        alert("Account created! Redirecting to dashboard.");
        location.href = "dashboard.html";
      }catch(err){ alert(err.message); }
    });
  }

  // LOGIN
  if(href.endsWith("login.html")){
    $("#login-form").addEventListener("submit", (e)=>{
      e.preventDefault();
      const email = $("#email").value.trim().toLowerCase();
      const password = $("#password").value;
      try{ loginUser({email,password}); location.href="dashboard.html"; }
      catch(err){ alert(err.message); }
    });
  }

  // DASHBOARD
  if(href.endsWith("dashboard.html")){
    requireAuth();
    const u = currentUser();
    $("#hello").textContent = u.name;
    const scans = getScans().slice(0,5);
    $("#recent-list").innerHTML = scans.length
      ? scans.map(s=>`<li>${s.name} • ${new Date(s.date).toLocaleString()} • <span class="badge ${badgeClass(s.status)}">${s.status}</span></li>`).join("")
      : "<li>No scans yet.</li>";
  }

  // SCAN
  if(href.endsWith("scan.html")){
    requireAuth();
    const drop = $("#drop");
    const ta = $("#ingredients-text");
    const nameInput = $("#product-name");

    drop.addEventListener("dragover", e=>{ e.preventDefault(); drop.style.opacity=.85; });
    drop.addEventListener("dragleave", ()=>{ drop.style.opacity=1; });
    drop.addEventListener("drop", async e=>{
      e.preventDefault(); drop.style.opacity=1;
      const file = e.dataTransfer.files?.[0];
      if(!file) return;
      showLoading(true,"Processing label…");
      await new Promise(r=>setTimeout(r,1200)); // simulate OCR
      showLoading(false);
      if(!nameInput.value) nameInput.value = file.name.replace(/\.[^.]+$/,'');
      ta.value = "Ingredients: Sugar 18g, Sodium 420mg, Saturated Fat 6g, MSG, Peanut";
    });

    $("#scan-form").addEventListener("submit", async (e)=>{
      e.preventDefault();
      const name = nameInput.value.trim() || "Unnamed Product";
      const txt = ta.value.trim();
      if(!txt){ alert("Please paste the ingredients text or drop a label image."); return; }
      showLoading(true,"Evaluating…");
      const ings = await parseIngredientsFromText(txt);
      const { rows, summary } = evaluateIngredients(ings, currentUser()?.issues || []);
      showLoading(false);
      sessionStorage.setItem("ic_last_result", JSON.stringify({ name, rows, summary, date: Date.now() }));
      location.href = "results.html";
    });
  }

  // RESULTS
  if(href.endsWith("results.html")){
    requireAuth();
    const payload = JSON.parse(sessionStorage.getItem("ic_last_result") || "null");
    if(!payload){ location.href="scan.html"; return; }

    $("#product-name").textContent = payload.name;
    $("#summary").innerHTML = `
      <span class="badge badge-unsafe">Unsafe: ${payload.summary.unsafe}</span>
      <span class="badge badge-caution" style="margin-left:8px">Caution: ${payload.summary.caution}</span>
      <span class="badge badge-safe" style="margin-left:8px">Safe: ${payload.summary.safe}</span>
    `;
    $("#rows").innerHTML = payload.rows.map(r=>`
      <tr>
        <td>${r.ingredient}</td>
        <td>${r.safeLimit}</td>
        <td><span class="badge ${badgeClass(r.status)}">${r.status}</span></td>
        <td>${r.remarks}</td>
      </tr>
    `).join("");

    $("#save-history").addEventListener("click", ()=>{
      const status = payload.summary.unsafe>0 ? "unsafe" : (payload.summary.caution>0 ? "caution" : "safe");
      saveScan({ name: payload.name, status, date: payload.date });
      alert("Saved to history.");
    });
  }

  // HISTORY
  if(href.endsWith("history.html")){
    requireAuth();
    const scans = getScans();
    $("#history-rows").innerHTML = scans.length ? scans.map((s,i)=>`
      <tr>
        <td>${s.name}</td>
        <td>${new Date(s.date).toLocaleString()}</td>
        <td><span class="badge ${badgeClass(s.status)}">${s.status}</span></td>
        <td>
          <button class="btn btn-light" data-recheck="${i}">Re-check</button>
          <button class="btn btn-danger" data-delete="${i}">Delete</button>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="4">No history yet.</td></tr>`;

    $("#history-rows").addEventListener("click", (e)=>{
      const del = e.target.closest("[data-delete]");
      const re  = e.target.closest("[data-recheck]");
      const u = currentUser();
      if(del){
        const arr = getScans(); arr.splice(Number(del.dataset.delete),1);
        store.set(`ic_scans_${u.id}`, arr); location.reload();
      }
      if(re){
        alert("Re-check would re-run evaluation against updated standards (stub).");
      }
    });
  }

  // PROFILE
  if(href.endsWith("profile.html")){
    requireAuth();
    const u = currentUser();
    $("#name").value = u.name;
    $("#email").value = u.email;

    const box = $("#issues-box");
    box.innerHTML = COMMON_ISSUES.map(i => `
      <label><input type="checkbox" name="issues" value="${i}" ${u.issues.includes(i)?"checked":""}> ${i}</label>
    `).join("");

    $("#profile-form").addEventListener("submit",(e)=>{
      e.preventDefault();
      const users = store.get("ic_users", []);
      const idx = users.findIndex(x=>x.id===u.id);
      users[idx].name = $("#name").value.trim();
      users[idx].issues = $$('input[name="issues"]:checked').map(i=>i.value);
      store.set("ic_users", users);
      store.set("ic_user", { id:u.id, name:users[idx].name, email:u.email, issues:users[idx].issues });
      alert("Profile updated.");
    });
  }
});

// Loading overlay
function showLoading(show, text=""){
  const el = $("#loading"); if(!el) return;
  el.style.display = show ? "flex" : "none";
  $("#loading-text").textContent = text || "";
}
