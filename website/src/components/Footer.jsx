import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer site-footer--novelhub">
      <div className="footer-top-glow" aria-hidden="true" />
      <div className="container footer-wrap">
        <section className="footer-invitation">
          <div className="footer-brand-lockup"><span className="footer-brand-mark" aria-hidden="true">N</span><div><span className="eyebrow">A HOME FOR EVERY STORY</span><h2>Find the words that stay with you.</h2></div></div>
          <Link className="btn btn-primary" to="/">Explore NovelHub <span aria-hidden="true">→</span></Link>
        </section>

        <div className="footer-main-grid">
          <div className="footer-brand-column">
            <Link to="/" className="logo footer-logo"><span className="logo-word">NovelHub</span></Link>
            <p className="footer-about">A reader’s corner for new worlds, late-night chapters, and the writers brave enough to share them.</p>
            <span className="footer-signoff"><i>✦</i> Read a little. Feel a lot.</span>
          </div>
          <nav className="footer-link-group" aria-label="Discover NovelHub">
            <h3>Discover</h3><Link to="/">Home</Link><Link to="/genres/Stories">All stories</Link><Link to="/audiobooks">Audio shelf</Link><Link to="/contests">Writing challenges</Link>
          </nav>
          <nav className="footer-link-group" aria-label="Your NovelHub space">
            <h3>Your space</h3><Link to="/library">My library</Link><Link to="/profile">Profile</Link><Link to="/write">Writing desk</Link><Link to="/community">Community</Link>
          </nav>
          <nav className="footer-link-group" aria-label="More NovelHub links">
            <h3>NovelHub</h3><Link to="/account">Help & settings</Link><Link to="/account/terms">Terms of service</Link><Link to="/account/privacy">Privacy policy</Link><Link to="/login">Sign in</Link>
          </nav>
        </div>

        <div className="footer-bottom"><span>© {new Date().getFullYear()} NovelHub</span><span>Made for people who love a good story <i aria-hidden="true">♡</i></span></div>
      </div>
    </footer>
  );
}
