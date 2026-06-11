"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [termInput, setTermInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [terms, setTerms] = useState([]);
  const [websites, setWebsites] = useState([]);

  useEffect(() => {
    setTerms(JSON.parse(localStorage.getItem("jobWatcherTerms") || "[]"));
    setWebsites(JSON.parse(localStorage.getItem("jobWatcherWebsites") || "[]"));
  }, []);

  function saveTerm() {
    const cleanTerm = termInput.trim();

    if (!cleanTerm) return;
    if (terms.includes(cleanTerm)) return;

    const updatedTerms = [...terms, cleanTerm];
    setTerms(updatedTerms);
    localStorage.setItem("jobWatcherTerms", JSON.stringify(updatedTerms));
    setTermInput("");
  }

  function saveWebsite() {
    let cleanWebsite = websiteInput.trim();

    if (!cleanWebsite) return;

    cleanWebsite = cleanWebsite.replace(/^https?:\/\//, "");
    cleanWebsite = cleanWebsite.replace(/\/$/, "");

    if (websites.includes(cleanWebsite)) return;

    const updatedWebsites = [...websites, cleanWebsite];
    setWebsites(updatedWebsites);
    localStorage.setItem("jobWatcherWebsites", JSON.stringify(updatedWebsites));
    setWebsiteInput("");
  }

  function deleteTerm(termToDelete) {
    const updatedTerms = terms.filter((term) => term !== termToDelete);
    setTerms(updatedTerms);
    localStorage.setItem("jobWatcherTerms", JSON.stringify(updatedTerms));
  }

  function deleteWebsite(websiteToDelete) {
    const updatedWebsites = websites.filter(
      (website) => website !== websiteToDelete
    );
    setWebsites(updatedWebsites);
    localStorage.setItem("jobWatcherWebsites", JSON.stringify(updatedWebsites));
  }

  return (
    <main className="container">
      <h1>Job Watcher</h1>

      <nav className="nav">
        <a href="#main">Main</a>
        <a href="#terms">Terms ({terms.length})</a>
        <a href="#websites">Websites ({websites.length})</a>
        <a href="#audit">Audit Trail</a>
      </nav>

      <section id="main" className="card">
        <h2>Add Search Term</h2>

        <input
          type="text"
          value={termInput}
          onChange={(event) => setTermInput(event.target.value)}
          placeholder="e.g. Management Accountant"
        />

        <button onClick={saveTerm}>Save Term</button>
      </section>

      <section className="card">
        <h2>Add Website</h2>

        <input
          type="text"
          value={websiteInput}
          onChange={(event) => setWebsiteInput(event.target.value)}
          placeholder="e.g. careers.umusic.com"
        />

        <button onClick={saveWebsite}>Save Website</button>
      </section>

      <section className="card">
        <h2>Search</h2>
        <p>
          This will eventually search all saved terms across all saved websites.
        </p>
        <button>Run Search</button>
      </section>

      <section id="terms" className="card">
        <h2>Stored Terms</h2>

        {terms.length === 0 ? (
          <p>No terms saved yet.</p>
        ) : (
          <div className="list">
            {terms.map((term) => (
              <div className="listItem" key={term}>
                <span>{term}</span>
                <button className="smallButton" onClick={() => deleteTerm(term)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="websites" className="card">
        <h2>Stored Websites</h2>

        {websites.length === 0 ? (
          <p>No websites saved yet.</p>
        ) : (
          <div className="list">
            {websites.map((website) => (
              <div className="listItem" key={website}>
                <span>{website}</span>
                <button
                  className="smallButton"
                  onClick={() => deleteWebsite(website)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="audit" className="card">
        <h2>Audit Trail</h2>
        <p>No successful matches yet.</p>
      </section>
    </main>
  );
}