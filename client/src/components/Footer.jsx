function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span>✅ TaskFlow</span>
          <p>Stay organised, stay productive.</p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a></li>
            <li><a href="https://mongoosejs.com/" target="_blank" rel="noreferrer">Mongoose Docs</a></li>
            <li><a href="https://react.dev/" target="_blank" rel="noreferrer">React Docs</a></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Tech Stack</h4>
          <ul>
            <li>React + Vite</li>
            <li>Express.js</li>
            <li>MongoDB Atlas</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} TaskFlow. Built with React &amp; Express.</p>
      </div>
    </footer>
  );
}

export default Footer;
