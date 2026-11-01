
import { useEffect, useState } from "react";

const API = "http://localhost:5000";

const emptyForm = () => ({
  clientId: "",
  sessionDate: new Date().toISOString().slice(0, 10),
  noteType: "SOAP",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  isPrivate: true,
});

function SessionNotes({ onBack }) {
  const [clients, setClients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const token = sessionStorage.getItem("token");

  async function readResponse(response) {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text || "Server response error." };
    }
  }

  async function loadData() {
    setLoading(true);

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [clientResponse, noteResponse] = await Promise.all([
        fetch(`${API}/api/clients`, { headers }),
        fetch(`${API}/api/session-notes`, { headers }),
      ]);

      const clientData = await readResponse(clientResponse);
      const noteData = await readResponse(noteResponse);

      if (!clientResponse.ok) {
        throw new Error(clientData.message || "Could not load clients.");
      }

      if (!noteResponse.ok) {
        throw new Error(noteData.message || "Could not load notes.");
      }

      setClients(clientData);
      setNotes(noteData);
    } catch (error) {
      setMessage(error.message || "Could not load session notes.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function editNote(note) {
    setEditingId(note._id);

    setForm({
      clientId: note.client?._id || "",
      sessionDate: note.sessionDate
        ? new Date(note.sessionDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      noteType: note.noteType || "SOAP",
      subjective: note.subjective || "",
      objective: note.objective || "",
      assessment: note.assessment || "",
      plan: note.plan || "",
      isPrivate: note.isPrivate !== false,
    });

    setMessage("Editing selected note.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("Editing cancelled.");
  }

  async function saveNote(event) {
    event.preventDefault();

    if (!form.clientId) {
      setMessage("Please select a client.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        editingId
          ? `${API}/api/session-notes/${editingId}`
          : `${API}/api/session-notes`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            (editingId ? "Could not update note." : "Could not save note.")
        );
      }

      setMessage(
        editingId
          ? "Session note updated successfully!"
          : "Session note saved successfully!"
      );

      setEditingId(null);
      setForm(emptyForm());

      await loadData();
    } catch (error) {
      setMessage(error.message || "Could not save session note.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this demonstration note?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/api/session-notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not delete note.");
      }

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm());
      }

      setMessage("Session note deleted.");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Could not delete note.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="dashboard-page">
      <header>
        <h1>Unfazed</h1>
        <button onClick={onBack}>← Dashboard</button>
      </header>

      <main>
        <h2>Clinical Session Notes</h2>
        <p>Manage demonstration session notes.</p>

        <div className="feature-card">
          <h3>{editingId ? "Edit Session Note" : "Create Session Note"}</h3>

          {clients.length === 0 ? (
            <p>Add a fictional demo client before creating a note.</p>
          ) : (
            <form onSubmit={saveNote}>
              <label>Select Client</label>
              <select
                name="clientId"
                value={form.clientId}
                onChange={updateField}
                required
              >
                <option value="">Choose a client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <label>Session Date</label>
              <input
                type="date"
                name="sessionDate"
                value={form.sessionDate}
                onChange={updateField}
                required
              />

              <label>Note Type</label>
              <select
                name="noteType"
                value={form.noteType}
                onChange={updateField}
              >
                <option value="SOAP">SOAP</option>
                <option value="DAP">DAP</option>
                <option value="General">General</option>
              </select>

              <label>Subjective</label>
              <textarea
                name="subjective"
                value={form.subjective}
                onChange={updateField}
                placeholder="Demonstration entry"
                rows="3"
              />

              <label>Objective</label>
              <textarea
                name="objective"
                value={form.objective}
                onChange={updateField}
                placeholder="Demonstration entry"
                rows="3"
              />

              <label>Assessment</label>
              <textarea
                name="assessment"
                value={form.assessment}
                onChange={updateField}
                placeholder="Demonstration entry"
                rows="3"
              />

              <label>Plan</label>
              <textarea
                name="plan"
                value={form.plan}
                onChange={updateField}
                placeholder="Demonstration entry"
                rows="3"
              />

              <label>
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      isPrivate: event.target.checked,
                    }))
                  }
                />
                Private note
              </label>

              <button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Session Note"
                  : "Save Session Note"}
              </button>

              {editingId && (
                <button type="button" onClick={cancelEdit}>
                  Cancel Edit
                </button>
              )}
            </form>
          )}
        </div>

        {message && <p role="status">{message}</p>}

        <h2>Saved Notes ({notes.length})</h2>

        {loading && notes.length === 0 ? (
          <p>Loading notes...</p>
        ) : notes.length === 0 ? (
          <div className="feature-card">
            <p>No session notes available.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div className="feature-card" key={note._id}>
              <h3>{note.noteType} Note</h3>

              <p>Client: {note.client?.name || "Unknown client"}</p>

              <p>
                Date:{" "}
                {new Date(note.sessionDate).toLocaleDateString("en-IN")}
              </p>

              <p>{note.isPrivate ? "Private" : "Shared"}</p>

              <p><strong>Subjective:</strong> {note.subjective || "—"}</p>
              <p><strong>Objective:</strong> {note.objective || "—"}</p>
              <p><strong>Assessment:</strong> {note.assessment || "—"}</p>
              <p><strong>Plan:</strong> {note.plan || "—"}</p>

              <button onClick={() => editNote(note)}>
                Edit Note
              </button>

              <button onClick={() => deleteNote(note._id)}>
                Delete Note
              </button>
            </div>
          ))
        )}

        <button onClick={onBack}>Back to Dashboard</button>
      </main>
    </div>
  );
}

export default SessionNotes;
