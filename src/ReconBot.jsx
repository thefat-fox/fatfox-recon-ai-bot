import { useState, useRef, useEffect, useCallback } from "react";

const SYSTEM_PROMPT = `You are FatFox Recon AI-Bot, an elite Bug Bounty Recon Bot running on Kali Linux. You are a highly specialized cybersecurity assistant for LEGAL, AUTHORIZED penetration testing and bug bounty programs.

Your expertise covers:
- Subdomain enumeration strategies (amass, subfinder, assetfinder, dnsx)
- Port scanning & service detection (nmap, masscan, rustscan)
- Web application fingerprinting (whatweb, wappalyzer, wafw00f)
- Directory & endpoint fuzzing (ffuf, gobuster, feroxbuster, dirsearch)
- Parameter discovery (arjun, paramspider)
- JavaScript analysis & secret hunting (gau, waybackurls, linkfinder, secretfinder)
- Vulnerability scanning (nuclei templates, nikto)
- OSINT techniques (theHarvester, shodan, censys, hunter.io)
- Cloud asset discovery (S3 buckets, Azure blobs, GCP storage)
- API recon & testing
- CVE research and exploitation concepts
- Report writing for bug bounty submissions

When given a target domain or scope, you:
1. Create a structured recon methodology
2. Suggest exact terminal commands for Kali Linux
3. Explain what each tool does and what to look for
4. Prioritize high-impact findings
5. Chain tools together in effective workflows

IMPORTANT: Always remind users to only test systems they have explicit written permission to test. Never assist with unauthorized access.

Format responses with clear sections, use markdown-style headers with ##, and provide actual Kali Linux commands in code blocks using triple backtick syntax. Be technical, precise, and actionable.`;

const QUICK_COMMANDS = [
  { label: "Subdomain Enum", prompt: "Give me a full subdomain enumeration workflow for a target domain including passive and active techniques with exact Kali Linux commands", type: "subdomain" },
  { label: "Port Scan", prompt: "Create a comprehensive port scanning strategy using nmap and masscan for a bug bounty target. Include stealth options and service detection", type: "portscan" },
  { label: "Web Fingerprint", prompt: "How do I fingerprint a web application tech stack for bug bounty recon? Give me all the Kali tools and commands", type: "web" },
  { label: "JS Secret Hunt", prompt: "Show me how to hunt for secrets, API keys, and endpoints in JavaScript files during bug bounty recon", type: "js" },
  { label: "Nuclei Scan", prompt: "Set up and run Nuclei for vulnerability scanning on a bug bounty target. Include template selection and filtering strategies", type: "nuclei" },
  { label: "Cloud Recon", prompt: "How do I discover cloud assets S3 Azure GCP for a bug bounty target? Give me tools and commands for Kali Linux", type: "cloud" },
  { label: "Full Checklist", prompt: "Create a complete bug bounty recon methodology checklist from initial scope to vulnerability discovery, with Kali Linux commands for each step", type: "checklist" },
  { label: "OSINT Dive", prompt: "Walk me through OSINT techniques for bug bounty recon including email harvesting, employee discovery, and infrastructure mapping", type: "osint" },
];

const SCAN_STAGES = {
  subdomain: ["Initializing passive recon...", "Querying DNS records...", "Running subfinder...", "Running amass...", "Cross-referencing results...", "Deduplicating subdomains...", "Finalizing enumeration..."],
  portscan: ["Sending SYN probes...", "Scanning top 1000 ports...", "Running service detection...", "OS fingerprinting...", "Checking filtered ports...", "Running script scans...", "Compiling results..."],
  web: ["Probing HTTP headers...", "Detecting CMS...", "Fingerprinting JS libraries...", "Checking WAF signatures...", "Analyzing cookies...", "Mapping tech stack...", "Finalizing report..."],
  js: ["Fetching JS files...", "Extracting endpoints...", "Scanning for API keys...", "Checking .env leaks...", "Hunting secrets...", "Analyzing source maps...", "Compiling findings..."],
  nuclei: ["Loading templates...", "Running CVE checks...", "Testing misconfigs...", "Scanning exposures...", "Checking takeovers...", "Running fuzzing templates...", "Aggregating findings..."],
  cloud: ["Enumerating S3 buckets...", "Checking Azure blobs...", "Probing GCP storage...", "Testing permissions...", "Scanning exposed keys...", "Checking DNS for cloud...", "Finalizing cloud map..."],
  checklist: ["Loading methodology...", "Mapping recon phases...", "Linking toolchains...", "Ordering by impact...", "Building workflow...", "Cross-checking gaps...", "Generating checklist..."],
  osint: ["Harvesting emails...", "Scraping LinkedIn...", "Querying Shodan...", "Checking Censys...", "Enumerating employees...", "Mapping infrastructure...", "Building OSINT report..."],
  default: ["Initializing query...", "Loading knowledge base...", "Analyzing request...", "Generating payload...", "Formatting output...", "Validating results...", "Finalizing response..."],
};

const BOOT_LINES = [
  "[ OK ] Initializing FatFox kernel modules...",
  "[ OK ] Loading exploit database signatures...",
  "[ OK ] Connecting to threat intelligence feeds...",
  "[ OK ] Calibrating neural recon engine...",
  "[ OK ] Mounting attack surface analyzer...",
  "[ OK ] Bug bounty protocol suite loaded...",
  "",
  " ███████╗ █████╗ ████████╗███████╗ ██████╗ ██╗  ██╗",
  " ██╔════╝██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗╚██╗██╔╝",
  " █████╗  ███████║   ██║   █████╗  ██║   ██║ ╚███╔╝ ",
  " ██╔══╝  ██╔══██║   ██║   ██╔══╝  ██║   ██║ ██╔██╗ ",
  " ██║     ██║  ██║   ██║   ██║     ╚██████╔╝██╔╝ ██╗",
  " ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚═╝  ╚═╝",
  "",
  " >> FatFox Recon AI-Bot v1.0 -- Powered by Groq (Free)",
  " >> Running on: Kali Linux 2024.4 | Kernel 6.8.0-kali",
  " >> Status: ARMED AND OPERATIONAL",
  " >> Enter target scope or select a recon module below.",
];

function formatMessage(text) {
  const lines = text.split("\n");
  const elements = [];
  let inCode = false;
  let codeLines = [];
  let codeKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        inCode = false;
        elements.push(
          <div key={"code-" + codeKey++} style={{ background: "#0a0a0a", border: "1px solid #00ff4133", borderLeft: "3px solid #00ff41", borderRadius: "4px", padding: "12px 16px", margin: "10px 0", fontFamily: "'Courier New', monospace", fontSize: "12px", color: "#00e676", overflowX: "auto", whiteSpace: "pre" }}>
            {codeLines.join("\n")}
          </div>
        );
        codeLines = [];
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith("## ")) {
      elements.push(<div key={i} style={{ color: "#00ff41", fontWeight: "bold", fontSize: "13px", marginTop: "16px", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase", borderBottom: "1px solid #00ff4133", paddingBottom: "4px" }}>{line.slice(3)}</div>);
    } else if (line.startsWith("### ")) {
      elements.push(<div key={i} style={{ color: "#69ff47", fontWeight: "bold", fontSize: "12px", marginTop: "12px", marginBottom: "4px" }}>{line.slice(4)}</div>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<div key={i} style={{ color: "#b9f6ca", fontWeight: "bold", marginTop: "6px" }}>{line.slice(2, -2)}</div>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", color: "#a5d6a7", marginBottom: "2px" }}>
          <span style={{ color: "#00ff41", marginRight: "8px" }}>{">"}</span>{renderInline(line.slice(2))}
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", color: "#a5d6a7", marginBottom: "2px" }}>
          <span style={{ color: "#69ff47", marginRight: "6px" }}>{line.match(/^\d+/)[0]}.</span>{renderInline(line.replace(/^\d+\.\s/, ""))}
        </div>
      );
    } else if (line.startsWith("> ")) {
      elements.push(<div key={i} style={{ borderLeft: "2px solid #ff6b35", paddingLeft: "12px", color: "#ffcc02", fontStyle: "italic", margin: "6px 0" }}>{line.slice(2)}</div>);
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "8px" }} />);
    } else {
      elements.push(<div key={i} style={{ color: "#c8e6c9", lineHeight: "1.7", marginBottom: "1px" }}>{renderInline(line)}</div>);
    }
  }
  return elements;
}

function renderInline(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} style={{ background: "#0d1f0d", color: "#00ff41", padding: "1px 6px", borderRadius: "3px", fontSize: "11px", fontFamily: "monospace" }}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} style={{ color: "#b9f6ca" }}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

function ScanProgressBar({ scanType }) {
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const stages = SCAN_STAGES[scanType] || SCAN_STAGES.default;

  useEffect(() => {
    setProgress(0);
    setStageIdx(0);
    const totalDuration = 12000;
    const interval = 100;
    const steps = totalDuration / interval;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      const pct = Math.min(Math.floor((current / steps) * 97), 97);
      setProgress(pct);
      const sIdx = Math.min(Math.floor((pct / 100) * stages.length), stages.length - 1);
      setStageIdx(sIdx);
    }, interval);
    return () => clearInterval(timer);
  }, [scanType]);

  const filled = Math.floor(progress / 5);
  const empty = 20 - filled;
  const bar = "=".repeat(filled) + "-".repeat(empty);

  return (
    <div style={{ marginBottom: "16px", borderLeft: "2px solid #00ff4133", paddingLeft: "16px" }}>
      <div style={{ color: "#00ff41", fontSize: "11px", marginBottom: "8px", letterSpacing: "1px" }}>[FATFOX] RUNNING ANALYSIS...</div>
      <div style={{ marginBottom: "6px" }}>
        <span style={{ color: "#69ff47", fontSize: "11px", fontFamily: "monospace" }}>[{bar}] {progress}%</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {[0,1,2,3,4].map((idx) => (
            <div key={idx} style={{ width: "5px", height: "5px", background: "#00ff41", animation: "blink 0.8s " + (idx * 0.12) + "s infinite", boxShadow: "0 0 5px #00ff41" }} />
          ))}
        </div>
        <span style={{ color: "#ffcc02", fontSize: "11px", fontFamily: "monospace" }}>{">> "}{stages[stageIdx]}</span>
      </div>
    </div>
  );
}

export default function FatFoxReconBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanType, setScanType] = useState("default");
  const [booting, setBooting] = useState(true);
  const [bootIndex, setBootIndex] = useState(0);
  const [bootDone, setBootDone] = useState(false);
  const [target, setTarget] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bootIndex < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIndex((i) => i + 1), bootIndex < 7 ? 120 : 55);
      return () => clearTimeout(t);
    } else {
      setTimeout(() => { setBooting(false); setBootDone(true); }, 400);
    }
  }, [bootIndex]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, bootIndex]);

  useEffect(() => {
    if (!booting && inputRef.current) inputRef.current.focus();
  }, [booting]);

  const sendMessage = useCallback(async (overridePrompt, type) => {
    const scanT = type || "default";
    const text = overridePrompt || input.trim();
    if (!text || loading) return;
    if (!overridePrompt) setInput("");
    setScanType(scanT);

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setScanCount((c) => c + 1);

    try {
      const allMessages = [...messages, userMsg];
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + import.meta.env.VITE_GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 2048,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...allMessages,
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: "## ERROR\n```\n" + data.error.message + "\n```" }]);
        return;
      }

      const reply =
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
          ? data.choices[0].message.content
          : "No response received.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "## ERROR\nFailed to connect to Groq API.\n```\n" + err.message + "\n```" }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const glowStyle = { textShadow: "0 0 8px currentColor" };

  return (
    <div style={{ background: "#020d02", minHeight: "100vh", color: "#00ff41", fontFamily: "'Courier New', Courier, monospace", display: "flex", flexDirection: "column" }}>

      <div style={{ borderBottom: "1px solid #00ff4155", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#020d02", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "8px", height: "8px", background: "#00ff41", borderRadius: "50%", boxShadow: "0 0 8px #00ff41", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "12px", letterSpacing: "2px", ...glowStyle }}>FATFOX RECON AI-BOT // BUG BOUNTY INTELLIGENCE</span>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "10px", color: "#69ff47" }}>
          <span>SCANS: {scanCount}</span>
          <span style={{ color: "#ff6b35" }}>VER: 1.0</span>
          <span style={{ color: "#00ff41" }}>ONLINE</span>
        </div>
      </div>

      <div style={{ padding: "5px 20px", borderBottom: "1px solid #00ff4122", display: "flex", alignItems: "center", gap: "10px", background: "#030f03", flexShrink: 0 }}>
        <span style={{ color: "#69ff47", fontSize: "11px", letterSpacing: "1px" }}>TARGET:</span>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="example.com"
          style={{ background: "transparent", border: "none", borderBottom: "1px solid #00ff4144", color: "#ffcc02", fontFamily: "monospace", fontSize: "12px", outline: "none", padding: "2px 8px", width: "260px" }}
        />
        <button
          onClick={() => { if (target) sendMessage("Set recon target scope to: " + target + ". Acknowledge and give me the recommended first 3 recon steps for this scope.", "default"); }}
          style={{ background: "#00ff4115", border: "1px solid #00ff4155", color: "#00ff41", fontFamily: "monospace", fontSize: "10px", padding: "3px 12px", cursor: "pointer", letterSpacing: "1px" }}
        >LOCK TARGET</button>
      </div>

      <div style={{ padding: "7px 20px", display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: "1px solid #00ff4122", background: "#020d02", flexShrink: 0 }}>
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => sendMessage(cmd.prompt, cmd.type)}
            disabled={loading}
            style={{ background: "#00ff4108", border: "1px solid #00ff4133", color: "#69ff47", fontFamily: "monospace", fontSize: "10px", padding: "3px 9px", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.5px", opacity: loading ? 0.5 : 1, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.target.style.background = "#00ff4122"; e.target.style.color = "#00ff41"; }}
            onMouseLeave={(e) => { e.target.style.background = "#00ff4108"; e.target.style.color = "#69ff47"; }}
          >{cmd.label}</button>
        ))}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 20px", scrollbarWidth: "thin", scrollbarColor: "#00ff4133 transparent" }}>

        {(booting || bootDone) && (
          <div style={{ marginBottom: "20px" }}>
            {BOOT_LINES.slice(0, bootIndex).map((line, i) => (
              <div key={i} style={{
                fontSize: "11px",
                color: line.startsWith("[ OK ]") ? "#69ff47" : line.startsWith(" >>") ? "#b9f6ca" : line.startsWith(" ") && line.includes("═") ? "#00ff41" : "#a5d6a7",
                textShadow: "0 0 4px currentColor",
                lineHeight: "1.55",
                whiteSpace: "pre",
              }}>{line}</div>
            ))}
            {bootDone && messages.length === 0 && (
              <div style={{ marginTop: "14px", color: "#ffcc02", fontSize: "11px", borderLeft: "3px solid #ffcc02", paddingLeft: "12px" }}>
                WARNING: Only scan systems you own or have explicit written authorization to test. Unauthorized scanning is illegal.
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "18px" }}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ color: "#ff6b35", minWidth: "fit-content", fontSize: "12px" }}>root@fatfox:~#</span>
                <div style={{ color: "#ffcc02", fontSize: "12px", lineHeight: "1.6" }}>{msg.content}</div>
              </div>
            ) : (
              <div style={{ borderLeft: "2px solid #00ff4133", paddingLeft: "16px" }}>
                <div style={{ color: "#00ff41", fontSize: "10px", marginBottom: "8px", letterSpacing: "1px" }}>[FATFOX OUTPUT] ─────────────────────────────</div>
                <div style={{ fontSize: "12px", lineHeight: "1.7" }}>{formatMessage(msg.content)}</div>
              </div>
            )}
          </div>
        ))}

        {loading && <ScanProgressBar scanType={scanType} />}
      </div>

      <div style={{ borderTop: "1px solid #00ff4155", padding: "10px 20px", background: "#020d02", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#ff6b35", fontSize: "13px", minWidth: "fit-content", ...glowStyle }}>root@fatfox:~#</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Enter recon query, ask about a tool, or describe your target..."
            disabled={loading || booting}
            style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #00ff4133", color: "#00ff41", fontFamily: "monospace", fontSize: "13px", outline: "none", padding: "4px 0", caretColor: "#00ff41" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ background: loading ? "#00ff4108" : "#00ff4122", border: "1px solid #00ff41", color: "#00ff41", fontFamily: "monospace", fontSize: "11px", padding: "6px 16px", cursor: (loading || !input.trim()) ? "not-allowed" : "pointer", letterSpacing: "2px", opacity: !input.trim() ? 0.4 : 1 }}
          >EXEC</button>
        </div>
        <div style={{ color: "#00ff4144", fontSize: "10px", marginTop: "5px", letterSpacing: "0.5px" }}>
          ENTER to execute | Select module above for quick recon | FatFox Recon AI-Bot v1.0 | Powered by Groq
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #00ff4133; border-radius: 2px; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
