
import { useState, useEffect } from "react";
import "./App.css";
import PaymentManagement from "./PaymentManagement";
import SessionNotes from "./SessionNotes";
import Messages from "./Messages";
import Subscription from "./Subscription";

const API = "http://localhost:5000";

const selfCareTasks = [
  "Drink enough water",
  "Take a short break",
  "Spend time outdoors",
  "Write down something positive",
  "Practice a few minutes of relaxation",
];

const moods = [
  { name: "Happy", emoji: "😊" },
  { name: "Calm", emoji: "😌" },
  { name: "Okay", emoji: "🙂" },
  { name: "Sad", emoji: "😔" },
  { name: "Stressed", emoji: "😣" },
];

const weekdays = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday"
];

async function readResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Server response error." };
  }
}

function App() {
  const [page, setPage] = useState("home");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [userName, setUserName] = useState("");
  const [userSlug, setUserSlug] = useState("");

  const [completedTasks, setCompletedTasks] = useState([]);
  const [selfCareLoading, setSelfCareLoading] = useState(false);

  const [selectedMood, setSelectedMood] = useState("");
  const [moodHistory, setMoodHistory] = useState([]);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [availability, setAvailability] = useState({
    workingDays: [],
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    timezone: "Asia/Kolkata"
  });

  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [waitlist, setWaitlist] = useState([]);
  const [waitlistTime, setWaitlistTime] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const [clients, setClients] = useState([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const token = sessionStorage.getItem("token");

  async function loadAppointments() {
    try {
      const response = await fetch(`${API}/api/appointments`);
      const data = await readResponse(response);

      if (response.ok && Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadWaitlist() {
    try {
      const response = await fetch(`${API}/api/waitlist`);
      const data = await readResponse(response);

      if (response.ok && Array.isArray(data)) {
        setWaitlist(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadClients() {
    setClientLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not load clients.");
      }

      setClients(data);
    } catch (error) {
      setMessage(error.message || "Could not load clients.");
    } finally {
      setClientLoading(false);
    }
  }

  async function saveClient(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const consentGiven = formData.get("consentGiven") === "on";

    const clientData = {
      name: formData.get("name").trim(),
      email: formData.get("email"),
      phone: formData.get("phone"),
      consentGiven,
      intakeNotes: consentGiven ? formData.get("intakeNotes") : ""
    };

    if (!clientData.name) {
      setMessage("Please enter the client name.");
      return;
    }

    setClientLoading(true);
    setMessage("");

    try {
      const isEditing = Boolean(editingClient);

      const url = isEditing
        ? `${API}/api/clients/${editingClient._id}`
        : `${API}/api/clients`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Could not save client.");
      }

      setEditingClient(null);
      form.reset();

      await loadClients();

      setMessage(
        isEditing
          ? "Client updated successfully!"
          : "Client added successfully!"
      );
    } catch (error) {
      setMessage(error.message || "Could not save client.");
    } finally {
      setClientLoading(false);
    }
  }

  async function deleteClient(id) {
    if (!id) return;

    setClientLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/clients/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Could not delete client.");
      }

      if (editingClient?._id === id) {
        setEditingClient(null);
      }

      await loadClients();
      setMessage("Client deleted successfully!");
    } catch (error) {
      setMessage(error.message || "Could not delete client.");
    } finally {
      setClientLoading(false);
    }
  }

  async function joinWaitlist(event) {
    event.preventDefault();

    const form = event.currentTarget;
    setWaitlistLoading(true);
    setMessage("");

    const formData = new FormData(form);

    const waitlistData = {
      clientName: formData.get("waitlistName").trim(),
      date: selectedDate,
      time: waitlistTime
    };

    try {
      const response = await fetch(`${API}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waitlistData)
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Could not join waitlist.");
      }

      await loadWaitlist();
      form.reset();
      setWaitlistTime("");
      setMessage("Successfully joined the appointment waitlist!");
    } catch (error) {
      setMessage(error.message || "Could not join waitlist.");
    } finally {
      setWaitlistLoading(false);
    }
  }

  async function loadAvailableSlots(date) {
    if (!date) {
      setAvailableSlots([]);
      setSelectedTime("");
      return;
    }

    setSlotsLoading(true);
    setAvailableSlots([]);
    setSelectedTime("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/appointments/slots?date=${encodeURIComponent(date)}`
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not load available slots.");
      }

      setAvailableSlots(data.availableSlots || []);

      if (data.message) {
        setMessage(data.message);
      } else if (!data.availableSlots?.length) {
        setMessage("No available slots for this date. You can join the waitlist below.");
      }
    } catch (error) {
      setMessage(error.message || "Could not load available slots.");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function loadSelfCare() {
    setSelfCareLoading(true);

    try {
      const response = await fetch(`${API}/api/selfcare`);
      const data = await readResponse(response);

      if (!response.ok) throw new Error(data.message);

      setCompletedTasks(data.tasks || []);
    } catch (error) {
      setMessage(error.message || "Could not load self-care.");
    } finally {
      setSelfCareLoading(false);
    }
  }

  async function loadProfile() {
    setProfileLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await readResponse(response);

      if (!response.ok) throw new Error(data.message);

      setProfile(data);
    } catch (error) {
      setMessage(error.message || "Could not load profile.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadPublicProfile(slug) {
    setProfileLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/profile/${encodeURIComponent(slug)}`
      );

      const data = await readResponse(response);

      if (!response.ok) throw new Error(data.message);

      setProfile(data);
      setPage("publicProfile");
    } catch (error) {
      setProfile(null);
      setMessage(error.message || "Therapist profile not found.");
      setPage("publicProfile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadAvailability() {
    setAvailabilityLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/availability`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await readResponse(response);

      if (!response.ok) throw new Error(data.message);

      setAvailability({
        workingDays: data.workingDays || [],
        startTime: data.startTime || "09:00",
        endTime: data.endTime || "17:00",
        slotDuration: data.slotDuration || 30,
        timezone: data.timezone || "Asia/Kolkata"
      });
    } catch (error) {
      setMessage(error.message || "Could not load availability.");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function saveAvailability(event) {
    event.preventDefault();
    setAvailabilityLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(availability)
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not save availability.");
      }

      setAvailability(data.availability);
      setMessage("Availability saved successfully!");
    } catch (error) {
      setMessage(error.message || "Could not save availability.");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  function toggleWorkingDay(day) {
    setAvailability(previous => ({
      ...previous,
      workingDays: previous.workingDays.includes(day)
        ? previous.workingDays.filter(item => item !== day)
        : [...previous.workingDays, day]
    }));
  }

  useEffect(() => {
    if (page === "dashboard") loadAppointments();
    if (page === "selfcare") loadSelfCare();
    if (page === "profile") loadProfile();
    if (page === "availability") loadAvailability();
    if (page === "clients") loadClients();
  }, [page]);

  useEffect(() => {
    const path = window.location.pathname.split("/").filter(Boolean);

    if (path.length === 1) {
      loadPublicProfile(path[0]);
    }
  }, []);

  function openForm(type) {
    setMode(type);
    setMessage("");
    setPage("auth");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const body = {
      email: formData.get("email"),
      password: formData.get("password")
    };

    if (mode === "register") {
      body.name = formData.get("name");
    }

    try {
      const response = await fetch(
        `${API}/api/auth/${mode === "register" ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        setMessage(result.message || "Something went wrong.");
        return;
      }

      if (result.token) {
        sessionStorage.setItem("token", result.token);
      }

      setUserName(result.user?.name || body.name || body.email.split("@")[0]);
      setUserSlug(result.user?.slug || "");
      setPage("dashboard");
    } catch {
      setMessage("Cannot connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const body = {
      name: formData.get("name"),
      bio: formData.get("bio"),
      specializations: formData.get("specializations")
        .split(",").map(item => item.trim()).filter(Boolean),
      languages: formData.get("languages")
        .split(",").map(item => item.trim()).filter(Boolean)
    };

    try {
      const response = await fetch(`${API}/api/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const result = await readResponse(response);

      if (!response.ok) throw new Error(result.message);

      setProfile(result.user);
      setUserName(result.user.name);
      setUserSlug(result.user.slug || "");
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage(error.message || "Profile update failed.");
    }
  }

  async function openAppointments() {
    setMessage("");
    setSelectedDate("");
    setSelectedTime("");
    setAvailableSlots([]);
    setWaitlistTime("");
    setPage("appointments");
    await loadAppointments();
    await loadWaitlist();
  }

  async function addAppointment(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!selectedDate || !selectedTime) {
      setMessage("Please select a date and an available time slot.");
      return;
    }

    const appointmentData = {
      clientName: formData.get("clientName").trim(),
      date: selectedDate,
      time: selectedTime
    };

    try {
      const response = await fetch(`${API}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData)
      });

      const result = await readResponse(response);

      if (!response.ok) {
        setMessage(result.message || "Could not save appointment.");
        await loadAvailableSlots(selectedDate);
        return;
      }

      await loadAppointments();

      form.reset();
      setSelectedDate("");
      setSelectedTime("");
      setAvailableSlots([]);

      setMessage("Appointment saved successfully!");
    } catch {
      setMessage("Could not connect to the backend.");
    }
  }

  async function updateAppointment(event) {
    event.preventDefault();

    if (!editingAppointment?._id) return;

    const formData = new FormData(event.currentTarget);

    const updatedData = {
      clientName: formData.get("clientName").trim(),
      date: formData.get("date"),
      time: formData.get("time")
    };

    try {
      const response = await fetch(
        `${API}/api/appointments/${encodeURIComponent(editingAppointment._id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        setMessage(result.message || "Update failed.");
        return;
      }

      setEditingAppointment(null);
      await loadAppointments();
      setMessage("Appointment updated successfully!");
    } catch {
      setMessage("Cannot reach the backend.");
    }
  }

  async function deleteAppointment(id) {
    try {
      const response = await fetch(
        `${API}/api/appointments/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        setMessage(result.message || "Could not delete appointment.");
        return;
      }

      await loadAppointments();

      if (selectedDate) {
        await loadAvailableSlots(selectedDate);
      }

      setMessage("Appointment deleted successfully!");
    } catch {
      setMessage("Could not connect to the backend.");
    }
  }

  async function toggleTask(task) {
    const previousTasks = completedTasks;

    const updatedTasks = previousTasks.includes(task)
      ? previousTasks.filter(item => item !== task)
      : [...previousTasks, task];

    setCompletedTasks(updatedTasks);

    try {
      const response = await fetch(`${API}/api/selfcare`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedTasks })
      });

      const result = await readResponse(response);

      if (!response.ok) throw new Error(result.message);

      setMessage("Self-care progress saved!");
    } catch (error) {
      setCompletedTasks(previousTasks);
      setMessage(error.message || "Could not save progress.");
    }
  }

  function saveMood() {
    if (!selectedMood) {
      setMessage("Please select a mood first.");
      return;
    }

    const today = new Date().toLocaleDateString("en-IN");

    setMoodHistory(previous => [
      { mood: selectedMood, date: today, id: Date.now() },
      ...previous
    ]);

    setSelectedMood("");
    setMessage("Your mood has been saved!");
  }

  function logout() {
    sessionStorage.removeItem("token");
    setEditingAppointment(null);
    setEditingClient(null);
    setUserName("");
    setUserSlug("");
    setAppointments([]);
    setWaitlist([]);
    setClients([]);
    setCompletedTasks([]);
    setSelectedMood("");
    setMoodHistory([]);
    setPage("home");
    setMessage("");
  }

  const today = new Date().toLocaleDateString("en-CA");

  const upcomingCount = appointments.filter(
    item => String(item.date).slice(0, 10) >= today
  ).length;

  const progress = Math.round(
    completedTasks.length / selfCareTasks.length * 100
  );

  // SUBSCRIPTION PAGE
  if (page === "subscription") {
    return (
      <Subscription
        onBack={() => {
          setMessage("");
          setPage("dashboard");
        }}
      />
    );
  }

  // PAYMENT MANAGEMENT PAGE
  if (page === "payments") {
    return (
      <PaymentManagement
        onBack={() => {
          setMessage("");
          setPage("dashboard");
        }}
      />
    );
  }

  // CLINICAL DOCUMENTATION PAGE
  if (page === "sessionNotes") {
    return (
      <SessionNotes
        onBack={() => {
          setMessage("");
          setPage("dashboard");
        }}
      />
    );
  }

  // COMMUNICATION / MESSAGES PAGE
  if (page === "messages") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={() => {
            setMessage("");
            setPage("dashboard");
          }}>
            ← Dashboard
          </button>
        </header>

        <main>
          <Messages />
        </main>
      </div>
    );
  }

  if (page === "publicProfile") {
    return (
      <div className="dashboard-page">
        <main>
          {profileLoading ? (
            <h2>Loading therapist profile...</h2>
          ) : profile ? (
            <div className="feature-card">
              <h1>{profile.name}</h1>
              <p>{profile.bio || "Welcome to my therapist profile."}</p>
              <h3>Specializations</h3>
              <p>{profile.specializations?.join(", ") || "Not added yet"}</p>
              <h3>Languages</h3>
              <p>{profile.languages?.join(", ") || "Not added yet"}</p>
              <p>Unfazed Therapist Profile</p>
            </div>
          ) : (
            <h2>{message || "Therapist profile not found."}</h2>
          )}

          <button onClick={() => {
            window.history.pushState({}, "", "/");
            setPage("home");
            setMessage("");
          }}>
            Back to Home
          </button>
        </main>
      </div>
    );
  }

  if (page === "clients") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={() => {
            setEditingClient(null);
            setPage("dashboard");
          }}>
            ← Dashboard
          </button>
        </header>

        <main>
          <h2>Client Management</h2>
          <p>Use fictional demonstration records only.</p>

          <div className="feature-card">
            <h3>{editingClient ? "Edit Demo Client" : "Add Demo Client"}</h3>

            <form key={editingClient?._id || "new-client"} onSubmit={saveClient}>
              <label>Client Name</label>
              <input
                name="name"
                placeholder="Enter fictional demo name"
                defaultValue={editingClient?.name || ""}
                required
              />

              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Demo email only"
                defaultValue={editingClient?.email || ""}
              />

              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="Demo number only"
                defaultValue={editingClient?.phone || ""}
              />

              <label style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                margin: "15px 0"
              }}>
                <input
                  type="checkbox"
                  name="consentGiven"
                  defaultChecked={editingClient?.consentGiven || false}
                  style={{ width: "auto" }}
                />
                Demo consent checkbox
              </label>

              <label>Demonstration Notes</label>
              <textarea
                name="intakeNotes"
                rows="4"
                placeholder="Use fictional demonstration text only"
                defaultValue={editingClient?.intakeNotes || ""}
              />

              <button type="submit" disabled={clientLoading}>
                {clientLoading
                  ? "Saving..."
                  : editingClient
                    ? "Update Demo Client"
                    : "Add Demo Client"}
              </button>

              {editingClient && (
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </div>

          {message && <p role="status">{message}</p>}

          <h2>Demo Clients ({clients.length})</h2>

          {clientLoading && clients.length === 0 ? (
            <p>Loading demo clients...</p>
          ) : clients.length === 0 ? (
            <div className="feature-card">
              <p>No demo clients added yet.</p>
            </div>
          ) : (
            clients.map(client => (
              <div className="feature-card" key={client._id}>
                <h3>{client.name}</h3>
                <p>Email: {client.email || "Not provided"}</p>
                <p>Phone: {client.phone || "Not provided"}</p>
                <p>
                  Consent: {client.consentGiven ? "Given" : "Not given"}
                </p>

                {client.consentGiven && client.intakeNotes && (
                  <>
                    <h4>Demonstration Notes</h4>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {client.intakeNotes}
                    </p>
                  </>
                )}

                <button onClick={() => {
                  setEditingClient(client);
                  setMessage("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>
                  Edit Demo Client
                </button>

                <button
                  onClick={() => deleteClient(client._id)}
                  disabled={clientLoading}
                >
                  Delete Demo Client
                </button>
              </div>
            ))
          )}

          <button onClick={() => setPage("dashboard")}>
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  if (page === "profile") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
        </header>

        <main>
          <h2>Therapist Profile</h2>

          {profileLoading ? (
            <p>Loading profile...</p>
          ) : profile ? (
            <form onSubmit={saveProfile}>
              <label>Name</label>
              <input name="name" defaultValue={profile.name} required />

              <label>Bio</label>
              <textarea
                name="bio"
                defaultValue={profile.bio}
                rows="4"
                placeholder="Write about your professional experience..."
              />

              <label>Specializations (comma separated)</label>
              <input
                name="specializations"
                defaultValue={profile.specializations?.join(", ")}
                placeholder="Counselling, Stress Management"
              />

              <label>Languages (comma separated)</label>
              <input
                name="languages"
                defaultValue={profile.languages?.join(", ")}
                placeholder="English, Telugu, Hindi"
              />

              <button type="submit">Save Profile</button>

              {profile.slug && (
                <p>
                  Your public profile link:
                  <br />
                  <a href={`/${profile.slug}`} target="_blank" rel="noreferrer">
                    {window.location.origin}/{profile.slug}
                  </a>
                </p>
              )}
            </form>
          ) : (
            <p>{message || "Profile could not be loaded."}</p>
          )}

          {message && <p role="status">{message}</p>}
        </main>
      </div>
    );
  }

  if (page === "availability") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={() => setPage("dashboard")}>← Dashboard</button>
        </header>

        <main>
          <h2>Manage Availability</h2>
          <p>Choose the days and hours for demonstration appointments.</p>

          {availabilityLoading ? (
            <p>Loading availability...</p>
          ) : (
            <form onSubmit={saveAvailability} className="feature-card">
              <h3>Working Days</h3>

              {weekdays.map(day => (
                <label
                  key={day}
                  style={{ display: "flex", gap: "10px", padding: "8px 0" }}
                >
                  <input
                    type="checkbox"
                    checked={availability.workingDays.includes(day)}
                    onChange={() => toggleWorkingDay(day)}
                  />
                  {day}
                </label>
              ))}

              <h3>Working Hours</h3>

              <label>Start Time</label>
              <input
                type="time"
                value={availability.startTime}
                onChange={event => setAvailability(previous => ({
                  ...previous,
                  startTime: event.target.value
                }))}
                required
              />

              <label>End Time</label>
              <input
                type="time"
                value={availability.endTime}
                onChange={event => setAvailability(previous => ({
                  ...previous,
                  endTime: event.target.value
                }))}
                required
              />

              <h3>Appointment Duration</h3>
              <select
                value={availability.slotDuration}
                onChange={event => setAvailability(previous => ({
                  ...previous,
                  slotDuration: Number(event.target.value)
                }))}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>

              <p>Timezone: India Standard Time (Asia/Kolkata)</p>

              <button type="submit" disabled={availabilityLoading}>
                Save Availability
              </button>
            </form>
          )}

          {message && <p role="status">{message}</p>}
          <button onClick={() => setPage("dashboard")}>Back to Dashboard</button>
        </main>
      </div>
    );
  }

  if (page === "auth") {
    return (
      <div className="auth-page">
        <button className="back-btn" onClick={() => setPage("home")}>
          ← Back
        </button>

        <div className="auth-container">
          <h1>Unfazed</h1>
          <h2>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h2>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <input name="name" placeholder="Full Name" required />
            )}

            <input type="email" name="email" placeholder="Email Address" required />
            <input type="password" name="password" placeholder="Password" required />

            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </button>
          </form>

          {message && <p role="alert">{message}</p>}

          <p>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => openForm(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (page === "dashboard") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={logout}>Logout</button>
        </header>

        <main>
          <section className="hero">
            <h2>Welcome, {userName || "there"}!</h2>
            <p>Your well-being matters. Take today one step at a time.</p>
          </section>

          <h2>Your Dashboard</h2>

          <div className="features">
            <div className="feature-card">
              <h3>Total Appointments</h3>
              <p>{appointments.length}</p>
              <button onClick={openAppointments}>Manage Appointments</button>
            </div>

            <div className="feature-card">
              <h3>Upcoming Appointments</h3>
              <p>{upcomingCount}</p>
              <button onClick={openAppointments}>View Upcoming</button>
            </div>

            <div className="feature-card">
              <h3>Client Management</h3>
              <p>Manage fictional demonstration client records.</p>
              <button onClick={() => {
                setEditingClient(null);
                setMessage("");
                setPage("clients");
              }}>
                Manage Clients
              </button>
            </div>

            <div className="feature-card">
              <h3>Payment Management</h3>
              <p>View the existing payment demonstration module.</p>
              <button onClick={() => {
                setMessage("");
                setPage("payments");
              }}>
                Manage Payments
              </button>
            </div>

            <div className="feature-card">
              <h3>Clinical Documentation</h3>
              <p>Manage demonstration SOAP and DAP notes.</p>
              <button onClick={() => {
                setMessage("");
                setPage("sessionNotes");
              }}>
                Manage Session Notes
              </button>
            </div>

            <div className="feature-card">
              <h3>Communication</h3>
              <p>Send and view demonstration messages.</p>
              <button onClick={() => {
                setMessage("");
                setPage("messages");
              }}>
                Open Messages
              </button>
            </div>

            <div className="feature-card">
              <h3>Subscription</h3>
              <p>View your current Free plan and subscription status.</p>
              <button onClick={() => {
                setMessage("");
                setPage("subscription");
              }}>
                View Subscription
              </button>
            </div>

            <div className="feature-card">
              <h3>Self-Care Progress</h3>
              <p>{progress}% completed today</p>
              <button onClick={() => { setMessage(""); setPage("selfcare"); }}>
                Open Self-Care
              </button>
            </div>

            <div className="feature-card">
              <h3>Mood Tracker</h3>
              <p>Record how you feel today.</p>
              <button onClick={() => { setMessage(""); setPage("mood"); }}>
                Track My Mood
              </button>
            </div>

            <div className="feature-card">
              <h3>Therapist Profile</h3>
              <p>Edit your professional information.</p>
              <button onClick={() => { setMessage(""); setPage("profile"); }}>
                Manage Profile
              </button>
            </div>

            <div className="feature-card">
              <h3>Availability Settings</h3>
              <p>Set your working days and appointment hours.</p>
              <button onClick={() => { setMessage(""); setPage("availability"); }}>
                Manage Availability
              </button>
            </div>
          </div>

          {message && <p role="status">{message}</p>}
        </main>
      </div>
    );
  }

  if (page === "selfcare") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={() => setPage("dashboard")}>← Dashboard</button>
        </header>

        <main>
          <h2>Your Daily Self-Care</h2>
          <p>Small steps matter. Choose what you have completed today.</p>

          <div className="feature-card">
            <h3>Today's Progress: {progress}%</h3>

            <div style={{
              height: "12px",
              background: "#e5e9e2",
              borderRadius: "10px",
              overflow: "hidden",
              margin: "15px 0"
            }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                background: "#729783",
                transition: "width 0.3s"
              }} />
            </div>

            {selfCareLoading ? <p>Loading...</p> : selfCareTasks.map(task => (
              <label key={task} style={{
                display: "flex",
                gap: "12px",
                padding: "12px 0"
              }}>
                <input
                  type="checkbox"
                  checked={completedTasks.includes(task)}
                  onChange={() => toggleTask(task)}
                />
                {task}
              </label>
            ))}
          </div>

          <p>{completedTasks.length} of {selfCareTasks.length} activities completed.</p>
          {message && <p role="status">{message}</p>}
          <button onClick={() => setPage("dashboard")}>Back to Dashboard</button>
        </main>
      </div>
    );
  }

  if (page === "mood") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={() => setPage("dashboard")}>← Dashboard</button>
        </header>

        <main>
          <h2>How are you feeling today?</h2>
          <p>Take a moment to check in with yourself.</p>

          <div className="feature-card">
            <h3>Choose Your Mood</h3>

            <div className="features">
              {moods.map(item => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => { setSelectedMood(item.name); setMessage(""); }}
                  style={{
                    padding: "18px",
                    border: selectedMood === item.name ? "2px solid #729783" : "1px solid #ddd",
                    borderRadius: "12px",
                    background: selectedMood === item.name ? "#eaf1eb" : "white"
                  }}
                >
                  <span style={{ fontSize: "28px" }}>{item.emoji}</span>
                  <br />
                  {item.name}
                </button>
              ))}
            </div>

            <button onClick={saveMood}>Save My Mood</button>
            {message && <p role="status">{message}</p>}
          </div>

          <h2>Your Mood History</h2>
          {moodHistory.length === 0 ? (
            <p>No mood entries yet.</p>
          ) : moodHistory.map(entry => {
            const mood = moods.find(item => item.name === entry.mood);
            return (
              <div className="feature-card" key={entry.id}>
                <h3>{mood?.emoji} {entry.mood}</h3>
                <p>{entry.date}</p>
              </div>
            );
          })}

          <button onClick={() => setPage("dashboard")}>Back to Dashboard</button>
        </main>
      </div>
    );
  }

  if (page === "appointments") {
    return (
      <div className="dashboard-page">
        <header>
          <h1>Unfazed</h1>
          <button onClick={() => {
            setEditingAppointment(null);
            setPage("dashboard");
          }}>
            ← Dashboard
          </button>
        </header>

        <main>
          <h2>Book a Demonstration Appointment</h2>

          <form onSubmit={addAppointment}>
            <input name="clientName" placeholder="Fictional demo name" required />

            <label>Appointment Date</label>
            <input
              type="date"
              name="date"
              min={today}
              value={selectedDate}
              onChange={event => {
                const date = event.target.value;
                setSelectedDate(date);
                setWaitlistTime("");
                loadAvailableSlots(date);
              }}
              required
            />

            <label>Available Appointment Times</label>

            {slotsLoading ? (
              <p>Checking available times...</p>
            ) : (
              <select
                value={selectedTime}
                onChange={event => setSelectedTime(event.target.value)}
                disabled={!selectedDate || availableSlots.length === 0}
                required
              >
                <option value="">Select an available time</option>
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            )}

            <button
              type="submit"
              disabled={slotsLoading || !selectedDate || !selectedTime}
            >
              Save Demonstration Appointment
            </button>
          </form>

          {message && <p role="status">{message}</p>}

          {selectedDate && !slotsLoading && availableSlots.length === 0 && (
            <div className="feature-card">
              <h2>Join the Demonstration Waitlist</h2>
              <p>
                No appointment times are currently available for this date.
              </p>

              <form onSubmit={joinWaitlist}>
                <label>Fictional Demo Name</label>
                <input
                  name="waitlistName"
                  placeholder="Enter a fictional name"
                  required
                />

                <label>Preferred Date</label>
                <input type="date" value={selectedDate} readOnly />

                <label>Preferred Time</label>
                <input
                  type="time"
                  value={waitlistTime}
                  onChange={event => setWaitlistTime(event.target.value)}
                  required
                />

                <button type="submit" disabled={waitlistLoading}>
                  {waitlistLoading ? "Joining..." : "Join Waitlist"}
                </button>
              </form>
            </div>
          )}

          <h2>Appointment Waitlist</h2>

          {waitlist.length === 0 ? (
            <p>No waitlist entries yet.</p>
          ) : waitlist.map(entry => (
            <div className="feature-card" key={entry._id}>
              <h3>{entry.clientName}</h3>
              <p>Date: {String(entry.date).slice(0, 10)}</p>
              <p>Preferred time: {entry.time}</p>
              <p>Status: {entry.status}</p>
            </div>
          ))}

          <h2>Upcoming Appointments</h2>

          {appointments.length === 0 ? (
            <p>No appointments added yet.</p>
          ) : appointments.map(appointment => (
            <div className="feature-card" key={appointment._id}>
              <h3>{appointment.clientName}</h3>
              <p>Date: {String(appointment.date).slice(0, 10)}</p>
              <p>Time: {appointment.time}</p>

              <button onClick={() => {
                setEditingAppointment(appointment);
                setMessage("");
              }}>
                Edit Appointment
              </button>

              {editingAppointment?._id === appointment._id && (
                <form onSubmit={updateAppointment}>
                  <h3>Edit Appointment</h3>
                  <input
                    name="clientName"
                    defaultValue={appointment.clientName}
                    required
                  />
                  <input
                    type="date"
                    name="date"
                    defaultValue={String(appointment.date).slice(0, 10)}
                    required
                  />
                  <input
                    type="time"
                    name="time"
                    defaultValue={appointment.time}
                    required
                  />
                  <button type="submit">Save Changes</button>
                  <button
                    type="button"
                    onClick={() => setEditingAppointment(null)}
                  >
                    Cancel
                  </button>
                </form>
              )}

              <button onClick={() => deleteAppointment(appointment._id)}>
                Delete Appointment
              </button>
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header>
        <h1>Unfazed</h1>
        <nav>
          <button onClick={() => openForm("login")}>Login</button>
          <button onClick={() => openForm("register")}>Get Started</button>
        </nav>
      </header>

      <main className="hero">
        <h2>Your Well-being, Your Priority.</h2>
        <p>
          Make time for healing, build healthy habits, and take
          small steps towards a more balanced life.
        </p>
        <button onClick={() => openForm("register")}>Start Your Journey</button>
        <button onClick={() => openForm("login")}>Already a Member? Login</button>
      </main>
    </div>
  );
}

export default App;
