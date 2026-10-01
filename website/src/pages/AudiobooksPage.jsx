import { Link } from "react-router-dom";

export default function AudiobooksPage() {
  return (
    <main className="audio-page page-shell">
      <section className="audio-placeholder">
        <span className="eyebrow">AUDIO EDITIONS</span>
        <h1>Audio is still in the works.</h1>
        <p>NovelHub does not have playable audio editions yet. Explore the written catalog while we build this feature around real recordings.</p>
        <Link className="btn btn-primary" to="/genres/Stories">Explore stories <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
