"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [termInput, setTermInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [terms, setTerms] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [locations, setLocations] = useState([]);
  const [results, setResults] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setTerms(JSON.parse(localStorage.getItem("jobWatcherTerms") || "[]"));
    setWebsites(JSON.parse(localStorage.getItem("jobWatcherWebsites") || "[]"));
    setLocations(JSON.parse(localStorage.getItem("jobWatcherLocations") || "[]"));
    setResults(JSON.parse(localStorage.getItem("jobWatcherResults") || "[]"));
    setAuditTrail(JSON.parse(localStorage.getItem("jobWatcherAuditTrail") || "[]"));
  }, []);

  function resetSearchState() {
    localStorage.removeItem("jobWatcherActiveResults");
    localStorage.removeItem("jobWatcherResults");
    setResults([]);
    alert("Search state reset. Next search will treat all matches as new.");
  }

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

  function saveLocation() {
    const cleanLocation = locationInput.trim();
    if (!cleanLocation) return;
    if (locations.includes(cleanLocation)) return;

    const updatedLocations = [...locations, cleanLocation];
    setLocations(updatedLocations);
    localStorage.setItem("jobWatcherLocations", JSON.stringify(updatedLocations));
    setLocationInput("");
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

  function deleteLocation(locationToDelete) {
    const updatedLocations = locations.filter(
      (location) => location !== locationToDelete
    );
    setLocations(updatedLocations);
    localStorage.setItem("jobWatcherLocations", JSON.stringify(updatedLocations));
  }

  async function runSearch() {
    if (terms.length === 0 || websites.length === 0) return;

    setIsSearching(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          terms,
          websites,
          locations
        })
      });

      const data = await response.json();
      const foundResults = data.results || [];

      const previousActiveResults = JSON.parse(
        localStorage.getItem("jobWatcherActiveResults") || "[]"
      );

      const previousActiveKeys = previousActiveResults.map(
        (result) => `${result.term}|${result.website}|${result.url}`
      );

      const newResults = foundResults.filter((result) => {
        const key = `${result.term}|${result.website}|${result.url}`;
        return !previousActiveKeys.includes(key);
      });

      setResults(newResults);
      localStorage.setItem("jobWatcherResults", JSON.stringify(newResults));

      const updatedAuditTrail = [...newResults, ...auditTrail];
      setAuditTrail(updatedAuditTrail);
      localStorage.setItem(
        "jobWatcherAuditTrail",
        JSON.stringify(updatedAuditTrail)
      );

      localStorage.setItem(
        "jobWatcherActiveResults",
        JSON.stringify(foundResults)
      );
    } catch (error) {
      console.error(error);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="container">
      <h1>Job Watcher</h1>

      <nav className="nav">
        <a href="#main">Main</a>
        <a href="#terms">Terms ({terms.length})</a>
        <a href="#websites">Websites ({websites.length})</a>
        <a href="#locations">Locations ({locations.length})</a>
        <a href="#results">Latest Results ({results.length})</a>
        <a href="#audit">Audit Trail ({auditTrail.length})</a>
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
        <h2>Add Location Filter</h2>
        <input
          type="text"
          value={locationInput}
          onChange={(event) => setLocationInput(event.target.value)}
          placeholder="e.g. London"
        />
        <button onClick={saveLocation}>Save Location</button>
      </section>

      <section className="card">
        <h2>Search</h2>
        <p>
          This searches all saved terms across all saved websites. If location
          filters are saved, results must also match at least one location.
        </p>

        <button onClick={runSearch} disabled={isSearching}>
          {isSearching ? "Searching..." : "Run Search"}
        </button>

        <button onClick={resetSearchState} style={{ marginTop: "10px" }}>
          Reset Search State
        </button>
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

      <section id="locations" className="card">
        <h2>Stored Location Filters</h2>
        {locations.length === 0 ? (
          <p>No location filters saved yet.</p>
        ) : (
          <div className="list">
            {locations.map((location) => (
              <div className="listItem" key={location}>
                <span>{location}</span>
                <button
                  className="smallButton"
                  onClick={() => deleteLocation(location)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="results" className="card">
        <h2>Latest Results</h2>
        {results.length === 0 ? (
          <p>No new successful matches from the latest search.</p>
        ) : (
          <ResultsTable results={results} />
        )}
      </section>

      <section id="audit" className="card">
        <h2>Audit Trail</h2>
        {auditTrail.length === 0 ? (
          <p>No successful matches yet.</p>
        ) : (
          <ResultsTable results={auditTrail} />
        )}
      </section>
    </main>
  );
}

function ResultsTable({ results }) {
  return (
    <div className="tableWrapper">
      <table>
        <thead>
          <tr>
            <th>Term</th>
            <th>Website</th>
            <th>Result</th>
            <th>Date Found</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={`${result.term}-${result.url}-${index}`}>
              <td>{result.term}</td>
              <td>{result.website}</td>
              <td>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {result.title}
                </a>
              </td>
              <td>{new Date(result.foundAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}