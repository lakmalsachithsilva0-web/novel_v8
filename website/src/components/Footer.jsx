import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link to="/" className="logo footer-logo">
            <span className="logo-word">NovelHub</span>
          </Link>
          <p className="footer-about">Free stories · same API as the mobile app.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/library">Library</Link>
          <Link to="/write">Write</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/profile">Profile</Link>
          <Link to="/account">More</Link>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} NovelHub</div>
    </footer>
  );
}
