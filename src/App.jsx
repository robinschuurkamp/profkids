import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bjwdgjgsmvsxgxmsdxvb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqd2RnamdzbXZzeGd4bXNkeHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTM3ODksImV4cCI6MjA5Mzg4OTc4OX0.zH6Q6yntSgIrDRxa-a6Nf_4UDD1Bug2AqWzK28sFxK4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "implicit",
  },
  global: {
    headers: {
      "X-Client-Info": "profkids-web",
    },
  },
});

// ─── TRAINING DATA ──────────────────────────────────────────────────
const ALL_EXERCISES = {
  aanvaller: [
    { id: "afwerking", label: "Afwerking op doel", icon: "🎯", unit: "schoten", defaultGoal: 15, tip: "Standbeen naast de bal, kijk naar de hoek voor je schiet" },
    { id: "loopacties", label: "Loopacties zonder bal", icon: "💨", unit: "minuten", defaultGoal: 5, tip: "Snelle sprints achter de verdediging langs, zoek de ruimte" },
    { id: "hooghouden", label: "Hooghouden", icon: "🦵", unit: "keer", defaultGoal: 20, tip: "Bal licht raken, ogen op de bal" },
    { id: "koppen", label: "Koppen op doel", icon: "🤯", unit: "keer", defaultGoal: 10, tip: "Spring op het juiste moment, richt met je voorhoofd" },
    { id: "dribbelen", label: "Dribbelen langs pionnen", icon: "🏃", unit: "ronden", defaultGoal: 5, tip: "Bal dicht bij je voet, richting veranderen is key" },
    { id: "volley", label: "Volley oefening", icon: "⚡", unit: "keer", defaultGoal: 10, tip: "Kijk de bal aan, timing is alles bij een volley" },
  ],
  middenvelder: [
    { id: "passen", label: "Passen tegen de muur", icon: "↔️", unit: "keer", defaultGoal: 30, tip: "Binnenkant voet, mik op een punt, speel snel terug" },
    { id: "balcontrole", label: "Balcontrole oefening", icon: "🎮", unit: "minuten", defaultGoal: 5, tip: "Neem de bal aan met je eerste aanname al in de goede richting" },
    { id: "hooghouden", label: "Hooghouden", icon: "🦵", unit: "keer", defaultGoal: 25, tip: "Wissel af tussen links en rechts voor extra uitdaging" },
    { id: "overspelen", label: "Overspelen in beweging", icon: "🔄", unit: "minuten", defaultGoal: 10, tip: "Pas en beweeg meteen, sta nooit stil na een pass" },
    { id: "schot_afstand", label: "Schot van afstand", icon: "💥", unit: "keer", defaultGoal: 10, tip: "Lage bal over de grond is moeilijker voor de keeper" },
    { id: "uithoudingsvermogen", label: "Duurloop", icon: "🏃‍♂️", unit: "minuten", defaultGoal: 15, tip: "Middenvelders lopen het meest — bouw je conditie op" },
  ],
  verdediger: [
    { id: "koppen", label: "Verdedigend koppen", icon: "🤯", unit: "keer", defaultGoal: 15, tip: "Ruim de bal weg van het doel, niet naar het midden" },
    { id: "tackelen", label: "Tackelen oefening", icon: "🦵", unit: "keer", defaultGoal: 10, tip: "Blijf laag, wacht op het goede moment, pak de bal niet de man" },
    { id: "opbouwen", label: "Korte opbouw passing", icon: "↔️", unit: "keer", defaultGoal: 30, tip: "Verdedigers moeten ook kunnen passen — rustig en zeker" },
    { id: "positionering", label: "Positionering & afdekken", icon: "🧱", unit: "minuten", defaultGoal: 10, tip: "Houd de aanvaller op je zwakke kant, snij de ruimte af" },
    { id: "sprint_terug", label: "Sprint terug bij verlies bal", icon: "💨", unit: "ronden", defaultGoal: 8, tip: "Direct terugsprinten als je de bal verliest, discipline!" },
    { id: "uithoudingsvermogen", label: "Conditie & kracht", icon: "💪", unit: "minuten", defaultGoal: 15, tip: "Fysieke kracht is voor een verdediger heel belangrijk" },
  ],
  keeper: [
    { id: "duiken", label: "Duikbewegingen", icon: "🤸", unit: "keer", defaultGoal: 10, tip: "Duik breed, strek je armen, val op je zij niet op je buik" },
    { id: "reflexen", label: "Reflex training", icon: "⚡", unit: "minuten", defaultGoal: 5, tip: "Laat iemand snel gooien van dichtbij, reageer op de bal" },
    { id: "uittrappen", label: "Doeltraps & uitwerpen", icon: "🦶", unit: "keer", defaultGoal: 15, tip: "Trap lang en doelgericht, gooi nauwkeurig bij korte afstand" },
    { id: "aanlopen", label: "1-op-1 situaties", icon: "🏃", unit: "keer", defaultGoal: 8, tip: "Loop de aanvaller tegemoet, maak je groot, wacht het laatste moment af" },
    { id: "communicatie", label: "Roepen & organiseren", icon: "📢", unit: "minuten", defaultGoal: 10, tip: "De keeper is de baas op het veld — geef altijd aanwijzingen" },
    { id: "positiespel", label: "Positiespel in doel", icon: "🧱", unit: "minuten", defaultGoal: 10, tip: "Stap mee met de bal, sta altijd op de kortste hoeklijn" },
  ],
};

// Daily training: pick exercises based on day of year + position
function getDailyTraining(position = "aanvaller") {
  const pos = position.toLowerCase();
  const exercises = ALL_EXERCISES[pos] || ALL_EXERCISES.aanvaller;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const shuffled = [...exercises].sort((a, b) => {
    const hashA = (dayOfYear * 7 + a.id.charCodeAt(0)) % 100;
    const hashB = (dayOfYear * 7 + b.id.charCodeAt(0)) % 100;
    return hashA - hashB;
  });
  return shuffled.slice(0, 4);
}

// ─── RONALDO CHAT ────────────────────────────────────────────────────
function getRonaldoAnswer(text, position = "aanvaller") {
  const t = text.toLowerCase().trim();
  if (!t) return "Typ maar iets, kampioen!";
  if (t.includes("naam") || t.includes("wie ben je")) return "Ik ben Cristiano Ronaldo — CR7! Meervoudig wereldvoetballer van het jaar. En jij gaat de volgende grote ster worden! 💪";
  if (t.includes("hoi") || t.includes("hallo") || t === "hey" || t === "yo") return "Hey hey! Klaar om vandaag alles te geven op het veld?! 🔥";
  if (t.includes("prof")) return "Prof worden kost tijd en discipline. Ik trainde elke dag ook als niemand keek. Jij kan het ook!";
  if (t.includes("eten") || t.includes("voeding")) return "Ik eet veel kip, rijst, groenten en drink veel water. Geen frisdrank! Je lichaam is je machine, geef hem de beste brandstof.";
  if (t.includes("slaap")) return "9 uur slaap! Echt. Je spieren groeien als je slaapt, niet in de sportschool.";
  if (t.includes("trainen") || t.includes("oefening")) return `Als ${position} is het extra belangrijk om ${position === "aanvaller" ? "je afwerking en loopacties" : position === "middenvelder" ? "je passing en conditie" : position === "verdediger" ? "je positionering en koppels" : "je reflexen en duikbewegingen"} te trainen. Doe de dagelijkse oefeningen!`;
  if (t.includes("hooghouden")) return "Begin met 5, dan 10, dan 20. Ik deed dit uren als kind. Nu doe ik het nog steeds als warming-up!";
  if (t.includes("schieten") || t.includes("schot")) return "Rustig aanlopen, standbeen naast de bal, kijk naar de hoek. Hard schieten is goed, maar slim schieten is beter!";
  if (t.includes("snel") || t.includes("sprint")) return "Korte sprints van 10-20 meter. Explosieve start. Dat is wat het verschil maakt in een wedstrijd!";
  if (t.includes("moe") || t.includes("geen zin")) return "Dat gevoel ken ik! Maar de mensen die doorgaan als ze moe zijn, zijn degenen die prof worden. Nog één oefening!";
  if (t.includes("verloren")) return "Elke pro verliest. Het gaat erom hoe je opstaat. Analyse wat er fout ging en kom morgen sterker terug!";
  if (t.includes("gewonnen")) return "SIUUU! 🎉 Vier het, maar morgen is er weer training. Winnen is een gewoonte, niet een toeval!";
  if (t.includes("positie") || t.includes(position)) return `Als ${position} ben jij de sleutel van het team. Zorg dat je de beste ${position} in je team bent — dan kom je verder!`;
  if (t.includes("angst") || t.includes("zenuwachtig")) return "Ik was ook zenuwachtig voor grote wedstrijden. Gebruik die energie! Het betekent dat je er om geeft.";
  return "Goede vraag! Mijn tip: werk harder dan iedereen, slaap goed, eet goed en geef nooit op. SIUUU! ⚽";
}

// ─── COMPONENTS ──────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid #16a34a" }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #16a34a, #15803d)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.35,
      flexShrink: 0, border: "2px solid #bbf7d0",
    }}>{initials}</div>
  );
}

const POSITIONS = ["Aanvaller", "Middenvelder", "Verdediger", "Keeper"];

// ─── AUTH PAGE ────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  async function handleForgot() {
    if (!email) { setError("Vul eerst je emailadres in."); return; }
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://profkids.nl",
    });
    if (e) setError("Fout: " + e.message);
    else setSuccess("Reset link verstuurd! Check je email.");
    setLoading(false);
    setForgotMode(false);
  }

  async function handle() {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) setError("Inloggen mislukt: " + e.message);
        else if (data?.session) onAuth(data.session);
        else setError("Geen sessie ontvangen, probeer opnieuw.");
      } else {
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        if (e) setError("Registratie mislukt: " + e.message);
        else if (data?.session) onAuth(data.session);
        else setSuccess("Account aangemaakt! Check je email en log daarna in.");
      }
    } catch(err) {
      setError("Fout: " + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />

      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚽</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#15803d", letterSpacing: "-1px" }}>profkids</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>.nl</div>
      </div>

      <div style={{ background: "white", borderRadius: 20, padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #d1fae5" }}>
        <div style={{ display: "flex", marginBottom: 24, background: "#f0fdf4", borderRadius: 10, padding: 4 }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
              background: mode === m ? "#16a34a" : "transparent",
              color: mode === m ? "white" : "#6b7280",
              transition: "all 0.2s",
            }}>
              {m === "login" ? "Inloggen" : "Registreren"}
            </button>
          ))}
        </div>

        {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{success}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jouw naam" style={inputStyle} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mailadres" type="email" style={inputStyle} />
          <div style={{ position: "relative" }}>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Wachtwoord"
              type={showPassword ? "text" : "password"}
              style={{ ...inputStyle, paddingRight: 44 }}
              onKeyDown={e => e.key === "Enter" && handle()} />
            <button onClick={() => setShowPassword(p => !p)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af",
            }}>{showPassword ? "🙈" : "👁️"}</button>
          </div>
          <button onClick={handle} disabled={loading} style={{
            background: loading ? "#86efac" : "linear-gradient(135deg, #16a34a, #15803d)",
            color: "white", border: "none", borderRadius: 10, padding: "12px 0",
            fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
          }}>
            {loading ? "Even wachten..." : mode === "login" ? "Inloggen" : "Account aanmaken"}
          </button>
          {mode === "login" && (
            <button onClick={forgotMode ? handleForgot : () => setForgotMode(true)} style={{
              background: "none", border: "none", color: "#16a34a", fontSize: 13,
              fontWeight: 600, cursor: "pointer", padding: "4px 0", textAlign: "center",
            }}>
              {forgotMode ? "📧 Stuur reset link naar mijn email" : "Wachtwoord vergeten?"}
            </button>
          )}
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
        profkids.nl — word de beste versie van jezelf ⚽
      </p>
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1.5px solid #d1fae5", borderRadius: 10,
  padding: "11px 14px", fontSize: 14, outline: "none", boxSizing: "border-box",
  color: "#111827", background: "#fafafa", fontFamily: "inherit",
};

// ─── PROFILE SETUP PAGE ───────────────────────────────────────────────
function ProfileSetup({ userId, onDone, onCancel, isEditing }) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("Aanvaller");
  const [age, setAge] = useState("");
  const [club, setClub] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function save() {
    setLoading(true);
    let avatar_url = null;
    if (avatarPreview) avatar_url = avatarPreview; // In production, upload to Supabase Storage

    const profile = { id: userId, name, position: position.toLowerCase(), age: parseInt(age) || null, club, bio, avatar_url };
    await supabase.from("profiles").upsert(profile);
    onDone(profile);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />
      <div style={{ background: "white", borderRadius: 24, padding: 36, width: "100%", maxWidth: 440, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #d1fae5" }}>
        {isEditing && onCancel && (
          <button onClick={onCancel} style={{
            background: "none", border: "none", cursor: "pointer", color: "#6b7280",
            fontSize: 14, fontWeight: 600, padding: "0 0 16px 0", display: "flex", alignItems: "center", gap: 6,
          }}>← Terug</button>
        )}
        <div style={{ fontSize: 28, fontWeight: 900, color: "#15803d", marginBottom: 4 }}>
          {isEditing ? "Profiel bewerken ✏️" : "Maak je profiel ⚽"}
        </div>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, marginTop: 0 }}>Vertel ons wie je bent, dan passen we de training op jou aan.</p>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div onClick={() => fileRef.current.click()} style={{ cursor: "pointer", position: "relative" }}>
            <Avatar src={avatarPreview} name={name || "?"} size={64} />
            <div style={{ position: "absolute", bottom: -2, right: -2, background: "#16a34a", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", fontSize: 12 }}>📷</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Profielfoto</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Klik op de foto om te uploaden</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Jouw naam (bijv. Roan)" style={inputStyle} />
          <input value={age} onChange={e => setAge(e.target.value)} placeholder="Leeftijd" type="number" style={inputStyle} />
          <input value={club} onChange={e => setClub(e.target.value)} placeholder="Club of school team (optioneel)" style={inputStyle} />

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Jouw positie</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {POSITIONS.map(p => (
                <button key={p} onClick={() => setPosition(p)} style={{
                  padding: "10px 8px", borderRadius: 10, border: `2px solid ${position === p ? "#16a34a" : "#e5e7eb"}`,
                  background: position === p ? "#f0fdf4" : "white", color: position === p ? "#15803d" : "#6b7280",
                  fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s",
                }}>
                  {p === "Aanvaller" ? "⚡ " : p === "Middenvelder" ? "🔄 " : p === "Verdediger" ? "🧱 " : "🥅 "}{p}
                </button>
              ))}
            </div>
          </div>

          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Vertel iets over jezelf (optioneel)..." rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />

          <button onClick={save} disabled={!name || loading} style={{
            background: name ? "linear-gradient(135deg, #16a34a, #15803d)" : "#e5e7eb",
            color: name ? "white" : "#9ca3af", border: "none", borderRadius: 10,
            padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: name ? "pointer" : "default",
          }}>
            {loading ? "Opslaan..." : "Start met trainen! →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────
function Dashboard({ profile, userId, onEditProfile, onLogout }) {
  const [activeTab, setActiveTab] = useState("training");
  const [scores, setScores] = useState({});
  const [savedScores, setSavedScores] = useState({});
  const [wedstrijden, setWedstrijden] = useState([]);
  const [newWedstrijd, setNewWedstrijd] = useState({ datum: "", tegenstander: "", doelpunten_voor: "", doelpunten_tegen: "", notitie: "" });
  const [wedstrijdSaved, setWedstrijdSaved] = useState(false);
  const [chat, setChat] = useState([{
    role: "ronaldo",
    text: `Hoi ${profile.name || "kampioen"}! Klaar voor vandaag? Als ${profile.position || "voetballer"} gaan we hard werken! 💪`,
  }]);
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [weekScores, setWeekScores] = useState([]);
  const chatRef = useRef();

  const dailyExercises = getDailyTraining(profile.position);
  const todayStr = new Date().toISOString().split("T")[0];
  const dayName = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"][new Date().getDay()];

  useEffect(() => {
    loadScores();
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat, isThinking]);

  async function loadScores() {
    const { data } = await supabase.from("scores").select("*").eq("user_id", userId).execute();
    if (data) {
      const today = {};
      const week = [];
      data.forEach(row => {
        if (row.date === todayStr) today[row.category] = row.score;
        week.push(row);
      });
      setSavedScores(today);
      setScores(today);
      setWeekScores(week);
    }
    const { data: w } = await supabase.from("wedstrijden").select("*").eq("user_id", userId).execute();
    if (w) setWedstrijden(w.sort((a, b) => b.datum.localeCompare(a.datum)));
  }

  async function saveScores() {
    const entries = Object.entries(scores).filter(([, v]) => v !== "" && v !== undefined);
    for (const [category, score] of entries) {
      await supabase.from("scores").upsert({ user_id: userId, date: todayStr, category, score: parseInt(score) || 0 });
    }
    setSavedScores({ ...scores });
    setScoreSaved(true);
    setTimeout(() => setScoreSaved(false), 2500);
  }

  async function saveWedstrijd() {
    if (!newWedstrijd.tegenstander || !newWedstrijd.datum) return;
    const entry = {
      user_id: userId,
      datum: newWedstrijd.datum,
      tegenstander: newWedstrijd.tegenstander,
      doelpunten_voor: parseInt(newWedstrijd.doelpunten_voor) || 0,
      doelpunten_tegen: parseInt(newWedstrijd.doelpunten_tegen) || 0,
      notitie: newWedstrijd.notitie,
    };
    await supabase.from("wedstrijden").insert(entry);
    setNewWedstrijd({ datum: "", tegenstander: "", doelpunten_voor: "", doelpunten_tegen: "", notitie: "" });
    setWedstrijdSaved(true);
    setTimeout(() => setWedstrijdSaved(false), 2500);
    loadScores();
  }

  function sendMessage() {
    if (!message.trim() || isThinking) return;
    const userText = message.trim();
    setChat(prev => [...prev, { role: "user", text: userText }]);
    setMessage("");
    setIsThinking(true);
    const answer = getRonaldoAnswer(userText, profile.position);
    setTimeout(() => {
      setChat(prev => [...prev, { role: "ronaldo", text: answer }]);
      setIsThinking(false);
    }, 1100);
  }

  const tabs = [
    { key: "training", label: "Training", emoji: "⚽" },
    { key: "scores", label: "Scores", emoji: "🏆" },
    { key: "wedstrijden", label: "Wedstrijden", emoji: "🆚" },
    { key: "ronaldo", label: "Ronaldo", emoji: "💬" },
    { key: "profiel", label: "Profiel", emoji: "👤" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />

      {/* Top nav */}
      <nav style={{
        background: "white", borderBottom: "1px solid #d1fae5", padding: "0 20px",
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚽</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#15803d", letterSpacing: "-0.5px" }}>profkids.nl</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={profile.avatar_url} name={profile.name} size={34} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{profile.name}</span>
          <button onClick={onLogout} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>Uitloggen</button>
        </div>
      </nav>

      {/* Hero bar */}
      <div style={{
        background: "linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)",
        padding: "20px 20px 16px",
      }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 }}>{dayName} — dagelijkse training</div>
          <div style={{ color: "white", fontSize: 22, fontWeight: 900 }}>Hoi {profile.name}! 👋</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>
              {profile.position ? profile.position.charAt(0).toUpperCase() + profile.position.slice(1) : "Voetballer"}
            </div>
            {profile.club && (
              <div style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>
                ⚽ {profile.club}
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>
              {weekScores.length} trainingen gedaan
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 20px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", gap: 0 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "14px 16px", border: "none", borderBottom: `3px solid ${activeTab === tab.key ? "#16a34a" : "transparent"}`,
              background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: activeTab === tab.key ? "#16a34a" : "#9ca3af",
              transition: "all 0.15s",
            }}>
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── TRAINING TAB ── */}
        {activeTab === "training" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "#111827" }}>Jouw training van vandaag</h2>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                  Speciaal samengesteld voor een {profile.position || "voetballer"}
                </p>
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#15803d" }}>
                🔄 Dagelijks vers
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
              {dailyExercises.map((ex, i) => (
                <div key={ex.id} style={{
                  background: "white", borderRadius: 16, border: "1.5px solid #d1fae5",
                  padding: "20px 16px", position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 12, right: 14, fontSize: 11, fontWeight: 700, color: "#bbf7d0" }}>#{i + 1}</div>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>{ex.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 }}>{ex.label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 10 }}>{ex.tip}</div>
                  <div style={{ background: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: 12, borderRadius: 8, padding: "4px 10px", display: "inline-block" }}>
                    Doel: {ex.defaultGoal} {ex.unit}
                  </div>
                  {savedScores[ex.id] && (
                    <div style={{ marginTop: 8, background: "#15803d", color: "white", fontWeight: 700, fontSize: 12, borderRadius: 8, padding: "4px 10px", display: "inline-block" }}>
                      ✓ Gedaan: {savedScores[ex.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Score inputs for today's exercises */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#111827" }}>📝 Vul je scores in</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {dailyExercises.map(ex => (
                  <div key={ex.id}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
                      {ex.icon} {ex.label}
                    </label>
                    <input
                      value={scores[ex.id] || ""}
                      onChange={e => setScores(prev => ({ ...prev, [ex.id]: e.target.value }))}
                      placeholder={`Doel: ${ex.defaultGoal} ${ex.unit}`}
                      type="number"
                      style={{ ...inputStyle, fontSize: 14 }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={saveScores} style={{
                marginTop: 16, background: scoreSaved ? "#15803d" : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "white", border: "none", borderRadius: 10, padding: "11px 24px",
                fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              }}>
                {scoreSaved ? "✓ Opgeslagen!" : "Scores opslaan"}
              </button>
            </div>

            {/* Tips */}
            <div style={{ background: "linear-gradient(135deg, #15803d, #166534)", borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 14px" }}>⭐ Tips voor een {profile.position || "voetballer"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                {dailyExercises.map(ex => (
                  <div key={ex.id} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 14px", color: "white", fontSize: 13, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>{ex.icon} {ex.label}:</span> {ex.tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SCORES TAB ── */}
        {activeTab === "scores" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🏆 Jouw scores</h2>

            {/* Today summary */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: "#374151" }}>Vandaag — {todayStr}</h3>
              {Object.keys(savedScores).length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>Nog geen scores vandaag. Ga trainen! 💪</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                  {Object.entries(savedScores).map(([cat, score]) => {
                    const ex = [...Object.values(ALL_EXERCISES).flat()].find(e => e.id === cat);
                    return (
                      <div key={cat} style={{ background: "#f0fdf4", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 24 }}>{ex?.icon || "⚽"}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#15803d" }}>{score}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{ex?.label || cat}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Score history */}
            {weekScores.length > 0 && (
              <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px", color: "#374151" }}>Geschiedenis</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...new Set(weekScores.map(s => s.date))].sort((a, b) => b.localeCompare(a)).map(date => {
                    const dayScores = weekScores.filter(s => s.date === date);
                    return (
                      <div key={date} style={{ borderRadius: 12, border: "1px solid #e5e7eb", padding: "12px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>{date}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {dayScores.map(s => {
                            const ex = [...Object.values(ALL_EXERCISES).flat()].find(e => e.id === s.category);
                            return (
                              <div key={s.id} style={{ background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8 }}>
                                {ex?.icon || "⚽"} {ex?.label || s.category}: {s.score}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WEDSTRIJDEN TAB ── */}
        {activeTab === "wedstrijden" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🆚 Wedstrijden</h2>

            {/* Stats */}
            {wedstrijden.length > 0 && (() => {
              const gewonnen = wedstrijden.filter(w => w.doelpunten_voor > w.doelpunten_tegen).length;
              const gelijk = wedstrijden.filter(w => w.doelpunten_voor === w.doelpunten_tegen).length;
              const verloren = wedstrijden.filter(w => w.doelpunten_voor < w.doelpunten_tegen).length;
              const doelpunten = wedstrijden.reduce((s, w) => s + w.doelpunten_voor, 0);
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>
                  {[
                    { label: "Gewonnen", value: gewonnen, color: "#15803d", bg: "#f0fdf4" },
                    { label: "Gelijk", value: gelijk, color: "#d97706", bg: "#fffbeb" },
                    { label: "Verloren", value: verloren, color: "#dc2626", bg: "#fef2f2" },
                    { label: "Doelpunten", value: doelpunten, color: "#1d4ed8", bg: "#eff6ff" },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Nieuwe wedstrijd invoeren */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>➕ Wedstrijd toevoegen</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>📅 Datum</label>
                  <input type="date" value={newWedstrijd.datum}
                    onChange={e => setNewWedstrijd(p => ({ ...p, datum: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>🆚 Tegenstander</label>
                  <input value={newWedstrijd.tegenstander} placeholder="Naam tegenstander"
                    onChange={e => setNewWedstrijd(p => ({ ...p, tegenstander: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>⚽ Jouw doelpunten</label>
                  <input type="number" value={newWedstrijd.doelpunten_voor} placeholder="0"
                    onChange={e => setNewWedstrijd(p => ({ ...p, doelpunten_voor: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>🥅 Tegenstander doelpunten</label>
                  <input type="number" value={newWedstrijd.doelpunten_tegen} placeholder="0"
                    onChange={e => setNewWedstrijd(p => ({ ...p, doelpunten_tegen: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 14 }} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>📝 Notitie (optioneel)</label>
                <input value={newWedstrijd.notitie} placeholder="Bijv: 2 assists gemaakt, goed gespeeld"
                  onChange={e => setNewWedstrijd(p => ({ ...p, notitie: e.target.value }))}
                  style={{ ...inputStyle, fontSize: 14 }} />
              </div>
              <button onClick={saveWedstrijd} style={{
                marginTop: 16,
                background: wedstrijdSaved ? "#15803d" : "linear-gradient(135deg, #16a34a, #15803d)",
                color: "white", border: "none", borderRadius: 10, padding: "11px 24px",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
                {wedstrijdSaved ? "✓ Opgeslagen!" : "Wedstrijd opslaan"}
              </button>
            </div>

            {/* Wedstrijd geschiedenis */}
            {wedstrijden.length > 0 && (
              <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>📋 Gespeelde wedstrijden</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {wedstrijden.map((w, i) => {
                    const gewonnen = w.doelpunten_voor > w.doelpunten_tegen;
                    const gelijk = w.doelpunten_voor === w.doelpunten_tegen;
                    const kleur = gewonnen ? "#15803d" : gelijk ? "#d97706" : "#dc2626";
                    const bg = gewonnen ? "#f0fdf4" : gelijk ? "#fffbeb" : "#fef2f2";
                    const label = gewonnen ? "W" : gelijk ? "G" : "V";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1px solid #f0fdf4", background: "#fafafa" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: bg, color: kleur, fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{label}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>vs {w.tegenstander}</div>
                          {w.notitie && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{w.notitie}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 900, fontSize: 18, color: kleur }}>{w.doelpunten_voor} - {w.doelpunten_tegen}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{w.datum}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {wedstrijden.length === 0 && (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: 14 }}>
                Nog geen wedstrijden. Voeg je eerste wedstrijd toe! ⚽
              </div>
            )}
          </div>
        )}

        {/* ── RONALDO TAB ── */}
        {activeTab === "ronaldo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Ronaldo header */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg"
                alt="Cristiano Ronaldo"
                style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "3px solid #16a34a" }}
                onError={e => { e.target.style.display = "none"; }}
              />
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>Cristiano Ronaldo</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>CR7 — Voetballegende</div>
                <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>● Online</div>
              </div>
              <div style={{ marginLeft: "auto", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#15803d" }}>7</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>rugnummer</div>
              </div>
            </div>

            {/* Chat */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", overflow: "hidden" }}>
              <div ref={chatRef} style={{ height: 360, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "#f9fafb" }}>
                {chat.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, justifyContent: item.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                    {item.role === "ronaldo" && (
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg"
                        alt="CR7" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }}
                        onError={e => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='14' fill='%2316a34a'/%3E%3Ctext x='14' y='19' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3E7%3C/text%3E%3C/svg%3E"; }}
                      />
                    )}
                    <div style={{
                      maxWidth: "72%",
                      background: item.role === "user" ? "#16a34a" : "white",
                      color: item.role === "user" ? "white" : "#111827",
                      borderRadius: item.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding: "10px 14px", fontSize: 14, lineHeight: 1.55,
                      border: item.role === "ronaldo" ? "1px solid #e5e7eb" : "none",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>{item.text}</div>
                    {item.role === "user" && <Avatar src={profile.avatar_url} name={profile.name} size={28} />}
                  </div>
                ))}
                {isThinking && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg"
                      alt="CR7" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", objectPosition: "top" }}
                      onError={e => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='14' fill='%2316a34a'/%3E%3Ctext x='14' y='19' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3E7%3C/text%3E%3C/svg%3E"; }}
                    />
                    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "18px 18px 18px 4px", padding: "10px 16px", fontSize: 14, color: "#9ca3af" }}>
                      Ronaldo typt... ⚽
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: "14px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Vraag iets aan Ronaldo..."
                  style={{ ...inputStyle, flex: 1, fontSize: 14 }}
                />
                <button onClick={sendMessage} disabled={isThinking} style={{
                  background: isThinking ? "#86efac" : "#16a34a", color: "white", border: "none",
                  borderRadius: 10, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: isThinking ? "default" : "pointer",
                }}>Stuur</button>
              </div>
            </div>

            {/* Quick questions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Hoe word ik snel?", "Tips voor mijn positie", "Wat eet jij?", "Hoe train jij?"].map(q => (
                <button key={q} onClick={() => { setMessage(q); }} style={{
                  background: "white", border: "1px solid #d1fae5", borderRadius: 20,
                  padding: "6px 14px", fontSize: 13, color: "#15803d", fontWeight: 600, cursor: "pointer",
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── PROFIEL TAB ── */}
        {activeTab === "profiel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                <Avatar src={profile.avatar_url} name={profile.name} size={72} />
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>{profile.name}</div>
                  <div style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
                    {profile.position ? profile.position.charAt(0).toUpperCase() + profile.position.slice(1) : "Voetballer"}
                    {profile.age ? ` · ${profile.age} jaar` : ""}
                    {profile.club ? ` · ${profile.club}` : ""}
                  </div>
                  {profile.bio && <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>{profile.bio}</div>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Trainingen", value: [...new Set(weekScores.map(s => s.date))].length, icon: "📅" },
                  { label: "Oefeningen", value: weekScores.length, icon: "💪" },
                  { label: "Positie", value: profile.position ? profile.position.charAt(0).toUpperCase() + profile.position.slice(1) : "—", icon: "⚽" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#f0fdf4", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22 }}>{stat.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#15803d" }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <button onClick={onEditProfile} style={{
                background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white", border: "none",
                borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>✏️ Profiel bewerken</button>
            </div>

            {/* All exercises overview */}
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #d1fae5", padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Alle oefeningen voor jouw positie</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(ALL_EXERCISES[profile.position] || ALL_EXERCISES.aanvaller).map(ex => (
                  <div key={ex.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f0fdf4" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{ex.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{ex.label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{ex.tip}</div>
                    </div>
                    <div style={{ marginLeft: "auto", flexShrink: 0, background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 8 }}>
                      {ex.defaultGoal} {ex.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId) {
      try {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
        if (mounted && p?.name) setProfile(p);
      } catch(e) {}
    }

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          if (data.session) {
            setSession(data.session);
            await loadProfile(data.session.user.id);
          }
          setLoading(false);
        }
      } catch(e) {
        if (mounted) setLoading(false);
      }
    }
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session) {
        setSession(session);
        await loadProfile(session.user.id);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Safety timeout - never stay on loading screen
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  function handleAuth(session) {
    if (session) setSession(session);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
          <div style={{ color: "#15803d", fontWeight: 700 }}>Laden...</div>
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage onAuth={handleAuth} />;
  if (!profile || editingProfile) {
    return (
      <ProfileSetup
        userId={session.user?.id || session.id}
        onDone={(p) => { setProfile(p); setEditingProfile(false); }}
        onCancel={() => setEditingProfile(false)}
        isEditing={editingProfile}
      />
    );
  }

  return (
    <Dashboard
      profile={profile}
      userId={session.user?.id || session.id}
      onEditProfile={() => setEditingProfile(true)}
      onLogout={handleLogout}
    />
  );
}
