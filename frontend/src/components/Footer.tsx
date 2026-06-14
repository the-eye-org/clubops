export default function Footer() {
  return (
    <footer className="px-6 py-12 mt-auto" style={{ background: "var(--ink-soft)", borderTop: "1px solid var(--seam)" }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="bg-white p-1 rounded-md shrink-0 mt-1">
            <img src="/psgtech-logo.png" alt="PSG Tech" className="w-12 h-12 object-contain" />
          </div>
          <div className="space-y-2.5">
            <p style={{ color: "var(--cream)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>PSG College of Technology</p>
            <div style={{ color: "var(--dust)", fontSize: 13, lineHeight: 1.6 }}>
              <p>Avinashi Road, Peelamedu,</p>
              <p>Coimbatore, Tamil Nadu - 641 004</p>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1.5">
                <p className="flex items-center gap-2">
                  <span style={{ color: "var(--amber-dim)", fontWeight: 600 }}>Tel:</span> 0422-2572177
                </p>
                <p className="flex items-center gap-2">
                  <span style={{ color: "var(--amber-dim)", fontWeight: 600 }}>Email:</span> principal@psgtech.ac.in
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="md:text-right space-y-1.5">
          <p style={{ color: "var(--fog)", fontSize: 12, opacity: 0.5 }}>© 2026 Copyrights reserved by PSG Tech Students' Union.</p>
          <p style={{ color: "var(--amber)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.8 }}>
            Developed by Dinesh T M (23Z320)
          </p>
        </div>
      </div>
    </footer>
  );
}
