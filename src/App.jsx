import { useEffect, useRef, useState } from "react";

export default function DoubleSlitSimulationSite() {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);
  const dotsRef = useRef([]);

  const [mode, setMode] = useState("water");
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelSettled, setPanelSettled] = useState(true);
  const [showWave, setShowWave] = useState(false);

  const [slitDistance, setSlitDistance] = useState(0.8);
  const [lightWavelength, setLightWavelength] = useState(1.1);
  const [electronEnergy, setElectronEnergy] = useState(50);
  const [electronRate, setElectronRate] = useState(10);
  const [electronCount, setElectronCount] = useState(0);

  const [planarWaves, setPlanarWaves] = useState(false);
  const [waterSources, setWaterSources] = useState([
    { x: 0.42, y: 0.5, amplitude: 1.2, frequency: 1 },
  ]);

  const [selectedGenerator] = useState(0);

  const resetSingle = () => {
    if (mode !== "single") return;
    dotsRef.current = [];
    setElectronCount(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);

    let time = 0;
    let accumulator = 0;

    function effectiveWavelength() {
      if (mode === "electron" || mode === "single") {
        return 3.16 / Math.sqrt(electronEnergy);
      }
      return lightWavelength;
    }

    function interference(y) {
      const wl = effectiveWavelength();
      const phase = (Math.PI * slitDistance * y) / (wl * 120);
      return Math.pow(Math.cos(phase), 2);
    }

    function background() {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 80; i++) {
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.beginPath();
        ctx.moveTo(0, i * 32);
        ctx.lineTo(width, i * 32);
        ctx.stroke();
      }
    }

    function drawWater() {
      const W = width;
      const H = height;
      const scale = 4;
      const rw = Math.ceil(W / scale);
      const rh = Math.ceil(H / scale);
      const imageData = ctx.createImageData(rw, rh);
      const data = imageData.data;

      for (let py = 0; py < rh; py++) {
        for (let px = 0; px < rw; px++) {
          const wx = px * scale;
          const wy = py * scale;
          let elevation = 0;
          for (const source of waterSources) {
            const sx = source.x * W;
            const sy = source.y * H;
            if (planarWaves) {
              const dist = wx - sx;
              if (dist >= 0) {
                elevation +=
                  (Math.sin((2 * Math.PI * dist) / 60 - time * 3) *
                    source.amplitude) /
                  (1 + dist * 0.004);
              }
            } else {
              const dx = wx - sx;
              const dy = wy - sy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              elevation +=
                (Math.sin((2 * Math.PI * dist) / 60 - time * 3) *
                  source.amplitude) /
                (1 + dist * 0.008);
            }
          }
          const norm = Math.max(-1, Math.min(1, elevation));
          let r, g, b, a;
          if (norm > 0) {
            r = Math.floor(norm * 80);
            g = Math.floor(norm * 180);
            b = Math.floor(55 + norm * 200);
            a = Math.floor(80 + norm * 175);
          } else {
            const t = -norm;
            r = 0;
            g = Math.floor(t * 20);
            b = Math.floor(t * 60);
            a = Math.floor(80 + t * 120);
          }
          const idx = (py * rw + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
      const offscreen = document.createElement("canvas");
      offscreen.width = rw;
      offscreen.height = rh;
      offscreen.getContext("2d").putImageData(imageData, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(offscreen, 0, 0, W, H);
      ctx.restore();

      waterSources.forEach((source, index) => {
        const sx = source.x * W;
        const sy = source.y * H;
        const ringR = (time * 40) % 60;
        ctx.strokeStyle =
          index === selectedGenerator
            ? `rgba(245,158,11,${1 - ringR / 60})`
            : `rgba(56,189,248,${1 - ringR / 60})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 10 + ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = index === selectedGenerator ? "#f59e0b" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(index + 1, sx, sy);
      });

      ctx.fillStyle = "rgba(148,163,184,0.7)";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("Click canvas to add a wave source", 16, height - 16);
    }

    function drawExperiment(color, isSingle = false) {
      const wallX = width * 0.45;
      const screenX = width * 0.82;
      const sourceX = width * 0.15;
      const centerY = height * 0.5;
      const slitH = 28;
      const slitOffset = 75 + slitDistance * 30;

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(sourceX, centerY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(wallX, centerY - 170, 18, 340);
      ctx.clearRect(wallX, centerY - slitOffset - slitH / 2, 18, slitH);
      ctx.clearRect(wallX, centerY + slitOffset - slitH / 2, 18, slitH);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sourceX, centerY);
      ctx.lineTo(wallX, centerY - slitOffset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sourceX, centerY);
      ctx.lineTo(wallX, centerY + slitOffset);
      ctx.stroke();

      if (showWave && !isSingle) {
        const wl = effectiveWavelength();
        const wavePx = wl * 80;
        const slit1Y = centerY - slitOffset;
        const slit2Y = centerY + slitOffset;
        const wallXabs = wallX + 9;

        const colorA =
          mode === "light"
            ? { cr: 255, cg: 255, cb: 255, tr: 40, tg: 40, tb: 40 }
            : { cr: 178, cg: 0, cb: 255, tr: 35, tg: 0, tb: 50 };

        const huygensMaxAlpha = 90;
        const huygensMaxAlphaTrough = 60;

        const scale = 3;

        const leftW = wallX - sourceX - 20;
        if (leftW > 0) {
          const lRW = Math.ceil(leftW / scale);
          const lRH = Math.ceil(height / scale);
          const lImg = ctx.createImageData(lRW, lRH);
          const ld = lImg.data;
          for (let py = 0; py < lRH; py++) {
            for (let px = 0; px < lRW; px++) {
              const wx = sourceX + 20 + px * scale;
              const amp = Math.sin((2 * Math.PI * wx) / wavePx - time * 4);
              const idx = (py * lRW + px) * 4;
              if (amp >= 0) {
                ld[idx] = Math.floor(amp * colorA.cr);
                ld[idx + 1] = Math.floor(amp * colorA.cg);
                ld[idx + 2] = Math.floor(amp * colorA.cb);
                ld[idx + 3] = Math.floor(amp * 210);
              } else {
                const t = -amp;
                ld[idx] = Math.floor(t * colorA.tr);
                ld[idx + 1] = Math.floor(t * colorA.tg);
                ld[idx + 2] = Math.floor(t * colorA.tb);
                ld[idx + 3] = Math.floor(t * 160);
              }
            }
          }
          const offL = document.createElement("canvas");
          offL.width = lRW;
          offL.height = lRH;
          offL.getContext("2d").putImageData(lImg, 0, 0);
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(offL, sourceX + 20, 0, leftW, height);
          ctx.restore();
        }

        const rightW = screenX - wallXabs;
        const rRW = Math.ceil(rightW / scale);
        const rRHs = Math.ceil(height / scale);

        const imgB = ctx.createImageData(rRW, rRHs);
        const dB = imgB.data;
        const imgC = ctx.createImageData(rRW, rRHs);
        const dC = imgC.data;
        const imgA = ctx.createImageData(rRW, rRHs);
        const dA = imgA.data;

        for (let py = 0; py < rRHs; py++) {
          for (let px = 0; px < rRW; px++) {
            const wx = wallXabs + px * scale;
            const wy = py * scale;

            const r1 = Math.sqrt((wx - wallXabs) ** 2 + (wy - slit1Y) ** 2);
            const r2 = Math.sqrt((wx - wallXabs) ** 2 + (wy - slit2Y) ** 2);

            const a1 =
              Math.sin((2 * Math.PI * r1) / wavePx - time * 4) /
              (1 + r1 * 0.005);
            const a2 =
              Math.sin((2 * Math.PI * r2) / wavePx - time * 4) /
              (1 + r2 * 0.005);
            const sum = Math.max(-1, Math.min(1, (a1 + a2) * 0.65));

            const idx = (py * rRW + px) * 4;

            if (a1 >= 0) {
              dB[idx] = Math.floor(a1 * 255);
              dB[idx + 1] = Math.floor(a1 * 180);
              dB[idx + 2] = 0;
              dB[idx + 3] = Math.floor(a1 * huygensMaxAlpha);
            } else {
              const t = -a1;
              dB[idx] = Math.floor(t * 60);
              dB[idx + 1] = Math.floor(t * 30);
              dB[idx + 2] = 0;
              dB[idx + 3] = Math.floor(t * huygensMaxAlphaTrough);
            }

            if (a2 >= 0) {
              dC[idx] = 0;
              dC[idx + 1] = Math.floor(a2 * 220);
              dC[idx + 2] = Math.floor(a2 * 80);
              dC[idx + 3] = Math.floor(a2 * huygensMaxAlpha);
            } else {
              const t = -a2;
              dC[idx] = 0;
              dC[idx + 1] = Math.floor(t * 40);
              dC[idx + 2] = Math.floor(t * 20);
              dC[idx + 3] = Math.floor(t * huygensMaxAlphaTrough);
            }

            if (sum >= 0) {
              dA[idx] = Math.floor(sum * colorA.cr);
              dA[idx + 1] = Math.floor(sum * colorA.cg);
              dA[idx + 2] = Math.floor(sum * colorA.cb);
              dA[idx + 3] = Math.floor(sum * 210);
            } else {
              const t = -sum;
              dA[idx] = Math.floor(t * colorA.tr);
              dA[idx + 1] = Math.floor(t * colorA.tg);
              dA[idx + 2] = Math.floor(t * colorA.tb);
              dA[idx + 3] = Math.floor(t * 160);
            }
          }
        }

        const drawOff = (imgData, destX, destY, destW, destH) => {
          const off = document.createElement("canvas");
          off.width = imgData.width;
          off.height = imgData.height;
          off.getContext("2d").putImageData(imgData, 0, 0);
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(off, destX, destY, destW, destH);
          ctx.restore();
        };

        drawOff(imgB, wallXabs, 0, rightW, height);
        drawOff(imgC, wallXabs, 0, rightW, height);
        drawOff(imgA, wallXabs, 0, rightW, height);
      }

      ctx.fillStyle = "#000000";
      ctx.fillRect(screenX, centerY - 220, 22, 440);
      const alpha = isSingle ? 0.25 : 1.0;
      for (let y = -220; y <= 220; y++) {
        const intensity = interference(y);
        const v = Math.floor(intensity * 255);
        ctx.fillStyle =
          mode === "light"
            ? `rgba(${v},${v},${v},${alpha})`
            : `rgba(${Math.floor(v * 0.7)},0,${v},${alpha})`;
        ctx.fillRect(screenX, centerY + y, 22, 2);
      }
    }

    function drawSingleElectron() {
      drawExperiment("#f97316", true);
      const screenX = width * 0.82;
      const centerY = height * 0.5;
      accumulator += electronRate * 0.02;
      if (accumulator > 1) {
        accumulator = 0;
        const y = (Math.random() - 0.5) * 420;
        if (Math.random() < interference(y)) {
          dotsRef.current.push({ x: screenX + 10, y: centerY + y });
          setElectronCount((c) => c + 1);
        }
      }
      for (const dot of dotsRef.current) {
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      time += 0.016;
      background();
      if (mode === "water") drawWater();
      if (mode === "light") drawExperiment("#60a5fa");
      if (mode === "electron") drawExperiment("#a855f7");
      if (mode === "single") drawSingleElectron();
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [
    mode,
    slitDistance,
    lightWavelength,
    electronEnergy,
    electronRate,
    waterSources,
    selectedGenerator,
    showWave,
    planarWaves,
  ]);

  const tabs = [
    ["water", "Water Waves"],
    ["light", "Light"],
    ["electron", "Electron"],
    ["single", "Single Electron"],
  ];

  const colorAHex = mode === "light" ? "#ffffff" : "#b200ff";

  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden relative text-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={(e) => {
          if (mode !== "water") return;
          const rect = e.currentTarget.getBoundingClientRect();
          setWaterSources((prev) => [
            ...prev,
            {
              x: (e.clientX - rect.left) / rect.width,
              y: (e.clientY - rect.top) / rect.height,
              amplitude: 1.2,
              frequency: 1,
            },
          ]);
        }}
      />

      <div
        className={`absolute top-4 left-4 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl z-10 ${panelOpen ? "w-[460px] p-5" : "w-[72px] p-3"}`}
        style={{
          transition: "width 0.3s, padding 0.3s",
          minHeight: 0,
          overflow: "hidden",
        }}
        onTransitionEnd={() => setPanelSettled(true)}
      >
        <div
          className="flex justify-between items-center mb-4"
          style={{ whiteSpace: "nowrap" }}
        >
          <h1
            className={`font-black ${panelOpen ? "text-3xl" : "hidden"}`}
            style={{ whiteSpace: "nowrap" }}
          >
            Double Slit Lab
          </h1>
          <button
            onClick={() => {
              setPanelSettled(false);
              setPanelOpen((v) => !v);
            }}
            className="px-3 py-2 bg-white/10 rounded-xl flex-shrink-0"
          >
            {panelOpen ? "←" : "→"}
          </button>
        </div>

        {panelOpen && panelSettled && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    setMode(id);
                    dotsRef.current = [];
                    setElectronCount(0);
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${mode === id ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {panelOpen && mode === "water" && (
              <div className="space-y-3">
                <button
                  onClick={() => setPlanarWaves((v) => !v)}
                  className={`w-full py-2 rounded-xl text-sm font-medium border transition-colors ${planarWaves ? "bg-cyan-600 border-cyan-400" : "bg-cyan-900/40 border-cyan-700/50 hover:bg-cyan-800/50"}`}
                >
                  {planarWaves ? "Planar Waves" : "Radial Waves"}
                </button>
                <button
                  onClick={() =>
                    setWaterSources([
                      { x: 0.42, y: 0.5, amplitude: 1.2, frequency: 1 },
                    ])
                  }
                  className="w-full bg-red-500/20 border border-red-400/30 rounded-xl py-2 text-sm hover:bg-red-500/30 transition-colors"
                >
                  Reset to 1 Generator
                </button>
                <p className="text-xs text-slate-400">
                  Sources: {waterSources.length} · Click the canvas to add more
                </p>
              </div>
            )}

            {(mode === "light" || mode === "electron") && (
              <div className="mb-4">
                <button
                  onClick={() => setShowWave((v) => !v)}
                  className={`w-full py-2 rounded-xl text-sm font-medium border transition-colors ${showWave ? "bg-indigo-600 border-indigo-400" : "bg-white/10 border-white/10 hover:bg-white/20"}`}
                >
                  {showWave ? "Wave Propagation ON" : "Wave Propagation OFF"}
                </button>
                {showWave && (
                  <div className="mt-2 space-y-1 text-xs leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                        style={{ background: colorAHex }}
                      />
                      <span className="text-slate-300">
                        Incoming wave &amp; net sum
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: "#ffb400" }}
                      />
                      <span className="text-slate-300">Slit 1 wavefront</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: "#00dc50" }}
                      />
                      <span className="text-slate-300">Slit 2 wavefront</span>
                    </div>
                    <p className="text-slate-500 pt-1">
                      Where slit waves reinforce → bright fringe. Where they
                      cancel → dark.
                    </p>
                  </div>
                )}
              </div>
            )}

            {mode !== "water" && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Slit Distance</span>
                    <span>{slitDistance.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2"
                    step="0.05"
                    value={slitDistance}
                    onChange={(e) => {
                      setSlitDistance(+e.target.value);
                      resetSingle();
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                {mode === "light" && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Wavelength</span>
                      <span>{lightWavelength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.5"
                      step="0.05"
                      value={lightWavelength}
                      onChange={(e) => setLightWavelength(+e.target.value)}
                      className="w-full accent-blue-500"
                    />
                  </div>
                )}

                {(mode === "electron" || mode === "single") && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Electron Energy</span>
                      <span>{electronEnergy}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={electronEnergy}
                      onChange={(e) => {
                        setElectronEnergy(+e.target.value);
                        resetSingle();
                      }}
                      className="w-full accent-purple-500"
                    />
                  </div>
                )}

                {mode === "single" && (
                  <>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Emission Rate</span>
                        <span>{electronRate}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="40"
                        step="1"
                        value={electronRate}
                        onChange={(e) => setElectronRate(+e.target.value)}
                        className="w-full accent-orange-500"
                      />
                    </div>
                    <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2 text-sm">
                      <span className="text-slate-400">Electrons detected</span>
                      <span className="font-mono text-orange-400">
                        {electronCount}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        dotsRef.current = [];
                        setElectronCount(0);
                      }}
                      className="w-full bg-orange-500/20 border border-orange-400/30 rounded-xl py-2 text-sm hover:bg-orange-500/30 transition-colors"
                    >
                      Clear Screen
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
